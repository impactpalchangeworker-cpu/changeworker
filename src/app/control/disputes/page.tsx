"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import Link from "next/link"
import toast from "react-hot-toast"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Button from "@/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import AdminResolveDisputePanel from "@/components/control/AdminResolveDisputePanel"
import { buildWorkspaceDisplayTitle } from "@/lib/workspaceDisplay"
import FancyLoader from "@/components/ui/FancyLoader"

import { MessageSquare, FileText, DollarSign } from "lucide-react"

type Dispute = {
  id: string
  workspaceId: string
  clientUid?: string
  talentUid?: string
  clientId?: string
  talentId?: string
  raisedBy: string
  reason: string
  description: string
  status: string
  stage: string
  evidenceCount: number
  createdAt: Timestamp
  resolvedAt?: Timestamp
  resolution?: string
  adminNotes?: string
}

type UserProfile = {
  id: string
  displayName?: string
  fullName?: string
  email?: string
}

type Workspace = {
  id: string
  title?: string
  gigTitle?: string
  escrowAmount?: number
  payment?: {
    amount?: number
    status?: string
    settlementStatus?: string
    disputeResolution?: {
      action?: string
      clientRefundAmount?: number
      talentGrossAmount?: number
      talentNetAmount?: number
      platformFee?: number
      settlementStatus?: string
    }
  }
}

type DisputeWithDetails = Dispute & {
  client?: UserProfile
  talent?: UserProfile
  workspace?: Workspace
  messagesCount?: number
}

const badgeByStatus = (status: string) => {
  const statusConfig = {
    open: { color: "bg-blue-100 text-blue-800", label: "Open" },
    under_discussion: { color: "bg-yellow-100 text-yellow-800", label: "Under Discussion" },
    under_review: { color: "bg-orange-100 text-orange-800", label: "Under Review" },
    resolved_release_talent: { color: "bg-green-100 text-green-800", label: "Released to Talent" },
    resolved_refund_client: { color: "bg-red-100 text-red-800", label: "Refunded to Client" },
    resolved_partial: { color: "bg-purple-100 text-purple-800", label: "Split Settlement" },
    closed: { color: "bg-gray-100 text-gray-800", label: "Closed" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
  return <Badge className={config.color}>{config.label}</Badge>
}

const settlementBadgeByStatus = (status?: string) => {
  const normalized = String(status || "pending")
  const statusConfig = {
    pending: { color: "bg-gray-100 text-gray-700", label: "Settlement pending" },
    released: { color: "bg-emerald-100 text-emerald-700", label: "Released to talent" },
    refunded: { color: "bg-red-100 text-red-700", label: "Refunded to client" },
    partially_refunded: { color: "bg-violet-100 text-violet-700", label: "Split settlement" },
    split_settlement: { color: "bg-violet-100 text-violet-700", label: "Split settlement" },
    closed: { color: "bg-gray-100 text-gray-700", label: "Closed without payout" },
  }

  const config = statusConfig[normalized as keyof typeof statusConfig] || {
    color: "bg-gray-100 text-gray-700",
    label: normalized.replace(/_/g, " "),
  }
  return <Badge className={config.color}>{config.label}</Badge>
}

export default function AdminDisputesPage() {
  const { user } = useAuth()
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null)

  useEffect(() => {
    if (!user) return
    void fetchDisputes()
  }, [user])

  const fetchDisputes = async () => {
    try {
      const disputesQuery = query(collection(db, "disputes"), orderBy("createdAt", "desc"))
      const disputesSnapshot = await getDocs(disputesQuery)
      const disputesData = disputesSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Dispute[]

      const disputesWithDetails = await Promise.all(
        disputesData.map(async (dispute) => {
          const clientUid = dispute.clientUid || dispute.clientId || ""
          const talentUid = dispute.talentUid || dispute.talentId || ""
          const [clientDoc, talentDoc, workspaceDoc, messagesQuery] = await Promise.all([
            clientUid ? getDoc(doc(db, "users", clientUid)) : Promise.resolve({ exists: () => false } as any),
            talentUid ? getDoc(doc(db, "users", talentUid)) : Promise.resolve({ exists: () => false } as any),
            getDoc(doc(db, "workspaces", dispute.workspaceId)),
            getDocs(query(collection(db, "disputeMessages"), where("disputeId", "==", dispute.id))),
          ])

          return {
            ...dispute,
            client: clientDoc.exists() ? ({ id: clientDoc.id, ...clientDoc.data() } as UserProfile) : undefined,
            talent: talentDoc.exists() ? ({ id: talentDoc.id, ...talentDoc.data() } as UserProfile) : undefined,
            workspace: workspaceDoc.exists() ? ({ id: workspaceDoc.id, ...workspaceDoc.data() } as Workspace) : undefined,
            messagesCount: messagesQuery.size,
          }
        })
      )

      setDisputes(disputesWithDetails)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Failed to load disputes")
    } finally {
      setLoading(false)
    }
  }

  const filterDisputes = (statusFilter: string) => {
    switch (statusFilter) {
      case "open":
        return disputes.filter((item) => !item.status.includes("resolved") && item.status !== "closed")
      case "under_review":
        return disputes.filter((item) => item.stage === "admin_review")
      case "resolved":
        return disputes.filter((item) => item.status.includes("resolved") || item.status === "closed")
      default:
        return disputes
    }
  }

  if (loading) {
    return (
      <FancyLoader label="Loading disputes..." compact />
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Trust and safety"
        title="Dispute management"
        description="Review escalations raised from workspaces, compare evidence, and resolve payment or delivery conflicts using the recorded platform history."
        stats={[
          { label: "All disputes", value: disputes.length },
          { label: "Open", value: filterDisputes("open").length },
          { label: "Under review", value: filterDisputes("under_review").length },
          { label: "Resolved", value: filterDisputes("resolved").length },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900">Active dispute queues</h1>
          </div>

          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open ({filterDisputes("open").length})</TabsTrigger>
              <TabsTrigger value="under_review">Under review ({filterDisputes("under_review").length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({filterDisputes("resolved").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {filterDisputes("open").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("open").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No open disputes</p>
              ) : null}
            </TabsContent>

            <TabsContent value="under_review" className="space-y-4">
              {filterDisputes("under_review").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("under_review").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No disputes under review</p>
              ) : null}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {filterDisputes("resolved").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("resolved").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No resolved disputes</p>
              ) : null}
            </TabsContent>
          </Tabs>

          {selectedDispute ? (
            <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogTitle>Resolve dispute</DialogTitle>
                  <AdminResolveDisputePanel
                    disputeId={selectedDispute.id}
                    projectAmount={Number(selectedDispute.workspace?.payment?.amount || selectedDispute.workspace?.escrowAmount || 0)}
                    defaultNotes={selectedDispute.adminNotes || ""}
                    onResolved={async () => {
                      await fetchDisputes()
                      setSelectedDispute(null)
                    }}
                  />
                </DialogContent>
              </Dialog>
            ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function DisputeCard({
  dispute,
  onResolve,
}: {
  dispute: DisputeWithDetails
  onResolve: (dispute: DisputeWithDetails) => void
}) {
  return (
    <Card className="rounded-[1.5rem] border bg-[var(--secondary)] shadow-none">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {buildWorkspaceDisplayTitle({
                gigTitle: dispute.workspace?.gigTitle || dispute.workspace?.title || "Untitled gig",
                clientName: dispute.client?.displayName || dispute.client?.fullName || "Client",
                talentName: dispute.talent?.displayName || dispute.talent?.fullName || "Talent",
              })}
            </h3>
            <p className="text-sm text-gray-600">
              {dispute.client?.displayName || dispute.client?.fullName || "Client"} and{" "}
              {dispute.talent?.displayName || dispute.talent?.fullName || "Talent"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {badgeByStatus(dispute.status)}
            {settlementBadgeByStatus(dispute.workspace?.payment?.settlementStatus)}
          </div>
        </div>

        <div className="mb-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-gray-500">Client</p>
            <p className="font-medium text-gray-900">{dispute.client?.displayName || dispute.client?.fullName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-500">Talent</p>
            <p className="font-medium text-gray-900">{dispute.talent?.displayName || dispute.talent?.fullName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-500">Reason</p>
            <p className="font-medium text-gray-900">{dispute.reason || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{dispute.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {dispute.evidenceCount || 0} evidence files
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {dispute.messagesCount || 0} messages
          </div>
          {dispute.workspace?.escrowAmount ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ₦{Number(dispute.workspace.escrowAmount).toLocaleString()} project payment
            </div>
          ) : null}
        </div>

        <p className="mb-4 break-words text-sm leading-7 text-gray-700">{dispute.description}</p>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/control/disputes/${dispute.id}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            View details
          </Link>
          {!dispute.status.includes("resolved") && dispute.status !== "closed" ? (
            <Button onClick={() => onResolve(dispute)}>Resolve dispute</Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
