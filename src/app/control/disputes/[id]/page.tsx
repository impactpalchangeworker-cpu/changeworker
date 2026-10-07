import Link from "next/link"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import AdminResolveDisputePanel from "@/components/control/AdminResolveDisputePanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { buildWorkspaceDisplayTitle, formatAdminDate, formatAdminMoney, timestampToMillis } from "@/lib/adminData"

export const dynamic = "force-dynamic"

async function getDispute(id: string) {
  const db = getAdminDb()
  const disputeSnap = await db.collection("disputes").doc(id).get()
  if (!disputeSnap.exists) return null

  const data = disputeSnap.data() as any
  const clientUid = data.clientUid || data.clientId || null
  const talentUid = data.talentUid || data.talentId || null
  const workspaceId = String(data.workspaceId || "")

  const [workspaceSnap, clientSnap, talentSnap, messagesSnap, evidenceSnap] = await Promise.all([
    workspaceId ? db.collection("workspaces").doc(workspaceId).get() : null,
    clientUid ? db.collection("users").doc(clientUid).get() : null,
    talentUid ? db.collection("users").doc(talentUid).get() : null,
    db.collection("disputeMessages").where("disputeId", "==", id).get(),
    db.collection("disputeEvidence").where("disputeId", "==", id).get(),
  ])

  const workspace = workspaceSnap?.exists ? { id: workspaceSnap.id, ...(workspaceSnap.data() as any) } : null
  const threadId = String(workspace?.threadId || "")

  const [agreementSnap, milestonesSnap, finalWorkSnap, paymentsSnap, escrowLedgerSnap] = await Promise.all([
    threadId ? db.collection("threads").doc(threadId).collection("agreement").doc("current").get() : Promise.resolve(null),
    workspaceId ? db.collection("workspaces").doc(workspaceId).collection("milestones").get() : Promise.resolve(null),
    workspaceId
      ? db.collection("workspaces").doc(workspaceId).collection("finalWork").doc("submission").get()
      : Promise.resolve(null),
    workspaceId ? db.collection("workspaces").doc(workspaceId).collection("payments").get() : Promise.resolve(null),
    workspaceId ? db.collection("workspaces").doc(workspaceId).collection("escrowLedger").get() : Promise.resolve(null),
  ])

  const messages = (messagesSnap?.docs || [])
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampToMillis(a.createdAt) - timestampToMillis(b.createdAt))
  const evidence = (evidenceSnap?.docs || [])
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt))

  return {
    id: disputeSnap.id,
    ...data,
    workspace,
    client: clientSnap?.exists ? { id: clientSnap.id, ...(clientSnap.data() as any) } : null,
    talent: talentSnap?.exists ? { id: talentSnap.id, ...(talentSnap.data() as any) } : null,
    messages,
    evidence,
    agreement:
      agreementSnap && "exists" in agreementSnap && agreementSnap.exists
        ? (agreementSnap.data() as any)
        : null,
    milestones: (milestonesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...doc.data() })),
    finalWork: finalWorkSnap && "exists" in finalWorkSnap && finalWorkSnap.exists ? (finalWorkSnap.data() as any) : null,
    payments: (paymentsSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...doc.data() })),
    escrowLedger: (escrowLedgerSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...doc.data() })),
  }
}

function statusTone(status?: string) {
  if (!status) return "bg-gray-100 text-gray-700 hover:bg-gray-100"
  if (status.includes("resolved") || status === "closed")
    return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  if (status.includes("review")) return "bg-amber-50 text-amber-700 hover:bg-amber-50"
  return "bg-orange-50 text-[var(--primary)] hover:bg-orange-50"
}

function settlementTone(status?: string) {
  const normalized = String(status || "pending")
  if (normalized === "released") return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  if (normalized === "refunded") return "bg-red-50 text-red-700 hover:bg-red-50"
  if (normalized === "split_settlement" || normalized === "partially_refunded")
    return "bg-violet-50 text-violet-700 hover:bg-violet-50"
  if (normalized === "closed") return "bg-gray-100 text-gray-700 hover:bg-gray-100"
  return "bg-gray-100 text-gray-700 hover:bg-gray-100"
}

export default async function DisputeResolvePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dispute: any = await getDispute(id)

  if (!dispute) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Dispute not found.</CardContent>
      </Card>
    )
  }

  const escrowAmount = Number(dispute.workspace?.payment?.amount || dispute.workspace?.escrowAmount || 0)
  const canResolve = !String(dispute.status || "").includes("resolved") && dispute.status !== "closed"

  return (
    <div className="space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Dispute detail"
        title={
          buildWorkspaceDisplayTitle({
            gigTitle: dispute.workspace?.gigTitle || dispute.workspace?.title || "Untitled gig",
            clientName: dispute.client?.fullName || dispute.client?.email || dispute.clientUid || "Client",
            talentName: dispute.talent?.fullName || dispute.talent?.email || dispute.talentUid || "Talent",
          })
        }
        description="Review the full case file, evidence, payments, submissions, and conversation history before resolving the dispute."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/control/disputes"
              className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              Back to disputes
            </Link>
            {dispute.workspaceId ? (
              <Link
                href={`/control/workspaces/${dispute.workspaceId}`}
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open workspace
              </Link>
            ) : null}
          </div>
        }
        stats={[
          { label: "Status", value: dispute.status || "open" },
          { label: "Stage", value: dispute.stage || "N/A" },
          { label: "Project payment", value: formatAdminMoney(escrowAmount) },
          { label: "Evidence", value: dispute.evidence.length },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-gray-900">Case summary</h2>
                <Badge className={statusTone(dispute.status)}>{dispute.status || "open"}</Badge>
                <Badge className={settlementTone(dispute.workspace?.payment?.settlementStatus)}>
                  {String(dispute.workspace?.payment?.settlementStatus || "pending").replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="font-semibold text-gray-500">Reason</div>
                  <div className="mt-1 text-gray-900">{dispute.reason || "N/A"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Created</div>
                  <div className="mt-1 text-gray-900">{formatAdminDate(dispute.createdAt, true)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Client</div>
                  <div className="mt-1 text-gray-900">
                    {dispute.client?.fullName || dispute.client?.email || dispute.clientUid || dispute.clientId || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Talent</div>
                  <div className="mt-1 text-gray-900">
                    {dispute.talent?.fullName || dispute.talent?.email || dispute.talentUid || dispute.talentId || "N/A"}
                  </div>
                </div>
              </div>

              {dispute.description ? (
                <div className="mt-6">
                  <div className="font-semibold text-gray-500">Reported details</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {dispute.description}
                  </p>
                </div>
              ) : null}

              {(dispute.resolution || dispute.adminNotes || dispute.resolutionSummary) ? (
                <div className="mt-6 rounded-2xl border bg-[var(--secondary)] p-4">
                  <div className="font-semibold text-gray-900">Resolution record</div>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-gray-500">Action</div>
                      <div className="mt-1 text-gray-900">{dispute.resolution || "N/A"}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Resolved at</div>
                      <div className="mt-1 text-gray-900">{formatAdminDate(dispute.resolvedAt, true)}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Client refund</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.resolutionSummary?.clientRefundAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Talent net release</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.resolutionSummary?.talentNetAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Platform fee</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.resolutionSummary?.platformFee)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Resolved by</div>
                      <div className="mt-1 text-gray-900">
                        {dispute.resolutionSummary?.resolvedBy || "N/A"}
                      </div>
                    </div>
                  </div>
                  {dispute.adminNotes ? (
                    <div className="mt-4 text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                      {dispute.adminNotes}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Case conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispute.messages.length === 0 ? (
                <div className="text-sm text-gray-600">No dispute messages yet.</div>
              ) : (
                dispute.messages.map((message: any) => (
                  <div key={message.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-extrabold text-gray-900">
                        {message.senderId === dispute.clientUid || message.senderId === dispute.clientId
                          ? dispute.client?.fullName || "Client"
                          : message.senderId === dispute.talentUid || message.senderId === dispute.talentId
                            ? dispute.talent?.fullName || "Talent"
                            : message.senderId}
                      </div>
                      <div className="text-xs font-semibold text-gray-500">
                        {formatAdminDate(message.createdAt, true)}
                      </div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {message.message || "No message body"}
                    </div>
                    {message.attachments?.length ? (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment: any, index: number) => (
                          <a
                            key={`${attachment.storagePath || attachment.url || attachment.name || "msg"}-${index}`}
                            href={attachment.url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border bg-[var(--secondary)] px-3 py-2 text-sm text-gray-900"
                          >
                            {attachment.name || `Attachment ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Evidence and linked submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispute.evidence.length === 0 ? (
                <div className="text-sm text-gray-600">No evidence uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {dispute.evidence.map((item: any) => (
                    <a
                      key={item.id}
                      href={item.fileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border bg-white p-4 transition hover:border-orange-200 hover:bg-orange-50"
                    >
                      <div className="font-semibold text-gray-900">{item.description || "Evidence file"}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {formatAdminDate(item.createdAt, true)}
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {dispute.finalWork ? (
                <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                  <div className="font-semibold text-gray-900">Final work status</div>
                  <div className="mt-2 text-sm text-gray-700">{dispute.finalWork.status || "submitted"}</div>
                  {dispute.finalWork.notes ? (
                    <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{dispute.finalWork.notes}</div>
                  ) : null}
                </div>
              ) : null}

              {dispute.workspace?.payment?.disputeResolution ? (
                <div className="rounded-2xl border bg-white p-4">
                  <div className="font-semibold text-gray-900">Settlement outcome</div>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-gray-500">Action</div>
                      <div className="mt-1 text-gray-900">
                        {String(dispute.workspace.payment.disputeResolution.action || "recorded").replace(/_/g, " ")}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Client refund</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.workspace.payment.disputeResolution.clientRefundAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Talent release</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.workspace.payment.disputeResolution.talentNetAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Platform fee</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminMoney(dispute.workspace.payment.disputeResolution.platformFee)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {dispute.milestones.length ? (
                <div className="space-y-2">
                  {dispute.milestones.map((milestone: any) => (
                    <div key={milestone.id} className="rounded-2xl border bg-white p-4">
                      <div className="font-semibold text-gray-900">{milestone.title || milestone.id}</div>
                      <div className="mt-1 text-sm text-gray-600">{milestone.status || "unknown"}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Settlement context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-semibold text-gray-500">Workspace</div>
                <div className="mt-1 break-words text-gray-900">
                  {buildWorkspaceDisplayTitle({
                    gigTitle: dispute.workspace?.gigTitle || dispute.workspace?.title || "Untitled gig",
                    clientName: dispute.client?.fullName || dispute.client?.email || dispute.clientUid || "Client",
                    talentName: dispute.talent?.fullName || dispute.talent?.email || dispute.talentUid || "Talent",
                  })}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Payment state</div>
                <div className="mt-1 text-gray-900">
                  {String(dispute.workspace?.payment?.status || "not funded").replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Settlement state</div>
                <div className="mt-1 text-gray-900">
                  {String(dispute.workspace?.payment?.settlementStatus || "pending").replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Project payment</div>
                <div className="mt-1 text-gray-900">{formatAdminMoney(escrowAmount)}</div>
              </div>
              {dispute.payments.length ? (
                <div className="space-y-2">
                  <div className="font-semibold text-gray-500">Payment records</div>
                  {dispute.payments.map((payment: any) => (
                    <div key={payment.id} className="rounded-2xl border bg-[var(--secondary)] px-3 py-3">
                      <div className="break-all font-semibold text-gray-900">
                        {payment.reference || payment.id}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {formatAdminMoney(payment.amount)} · {payment.status || "recorded"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {dispute.escrowLedger.length ? (
                <div className="space-y-2">
                  <div className="font-semibold text-gray-500">Payment activity</div>
                  {dispute.escrowLedger.map((entry: any) => (
                    <div key={entry.id} className="rounded-2xl border bg-[var(--secondary)] px-3 py-3">
                      <div className="font-semibold capitalize text-gray-900">
                        {String(entry.type || "entry").replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {formatAdminDate(entry.createdAt, true)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {dispute.agreement?.pdfUrl ? (
                <a
                  href={dispute.agreement.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border px-4 py-2 font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50"
                >
                  View agreement PDF
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Resolution panel</CardTitle>
            </CardHeader>
            <CardContent>
              {canResolve ? (
                <AdminResolveDisputePanel
                  disputeId={dispute.id}
                  projectAmount={escrowAmount}
                  defaultNotes={dispute.adminNotes || ""}
                />
              ) : (
                <div className="text-sm leading-7 text-gray-600">
                  This dispute has already been resolved. The outcome is recorded in the case summary and payment activity.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Linked records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispute.workspaceId ? (
                <Link href={`/control/workspaces/${dispute.workspaceId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View workspace
                </Link>
              ) : null}
              {(dispute.clientUid || dispute.clientId) ? (
                <Link href={`/control/clients/${dispute.clientUid || dispute.clientId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View client
                </Link>
              ) : null}
              {(dispute.talentUid || dispute.talentId) ? (
                <Link href={`/control/talents/${dispute.talentUid || dispute.talentId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View talent
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
