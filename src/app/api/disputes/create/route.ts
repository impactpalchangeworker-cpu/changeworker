import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const decoded = await adminApp.auth().verifyIdToken(token)
    const userId = decoded.uid

    const { workspaceId, raisedBy, reason, description } = await req.json()

    // Validate required fields
    if (!workspaceId || !reason || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId)
    const workspace = (await workspaceRef.get()).data() as any

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is part of this workspace
    if (workspace.clientUid !== userId && workspace.talentUid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // A case can be opened once the paid project is active, before final approval and payment.
    if (!["active", "in_progress", "completed"].includes(String(workspace.status || ""))) {
      return NextResponse.json({ error: "A dispute can be raised once project work has started" }, { status: 400 })
    }

    // Check if dispute already exists
    if (workspace.disputeId) {
      return NextResponse.json({ error: "Dispute already exists for this workspace" }, { status: 400 })
    }

    const disputeRef = adminDb.collection("disputes").doc()

    await disputeRef.set({
      workspaceId,
      clientUid: workspace.clientUid,
      talentUid: workspace.talentUid,
      raisedBy,
      reason,
      description,
      status: "open",
      stage: "discussion",
      evidenceCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    })

    await workspaceRef.update({
      disputeStatus: "open",
      disputeId: disputeRef.id,
      payment: {
        ...(workspace.payment || {}),
        payoutStatus: "paused_for_dispute",
      },
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Notify the other party
    const otherUserId = raisedBy === workspace.clientUid ? workspace.talentUid : workspace.clientUid
    await notifyUser({
      userId: otherUserId,
      type: "dispute",
      title: "Dispute opened",
      message: "A dispute has been opened in your workspace",
      link: `/dashboard/disputes/${disputeRef.id}`
    })

    return NextResponse.json({ success: true, disputeId: disputeRef.id })
  } catch (error: any) {
    console.error("Create dispute error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
