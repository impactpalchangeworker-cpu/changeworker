import Link from "next/link"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"
import {
  buildWorkspaceDisplayTitle,
  formatAdminDate,
  formatAdminDuration,
  formatAdminMoney,
  timestampToMillis,
} from "@/lib/adminData"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

function statusBadge(status?: string) {
  return (
    <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
      {status || "unknown"}
    </Badge>
  )
}

function sortNewest<T extends Record<string, any>>(items: T[], keys: string[]) {
  return [...items].sort((a, b) => {
    const aMs = keys.map((key) => timestampToMillis(a[key])).find(Boolean) || 0
    const bMs = keys.map((key) => timestampToMillis(b[key])).find(Boolean) || 0
    return bMs - aMs
  })
}

async function getWorkspace(id: string) {
  if (!id) return null

  const db = getAdminDb()
  const directWorkspace = await db.collection("workspaces").doc(id).get()
  if (!directWorkspace.exists) return null

  const workspace = { id: directWorkspace.id, ...(directWorkspace.data() as any) }
  const workspaceRef = db.collection("workspaces").doc(id)
  const threadId = String(workspace.threadId || "")

  const [
    milestonesSnap,
    payoutRequestsSnap,
    finalWorkSnap,
    paymentsSnap,
    escrowLedgerSnap,
    hourlySessionSnap,
    hourlyCheckinsSnap,
    agreementSnap,
  ] = await Promise.all([
    workspaceRef.collection("milestones").get(),
    workspaceRef.collection("payoutRequests").get(),
    workspaceRef.collection("finalWork").doc("submission").get(),
    workspaceRef.collection("payments").get(),
    workspaceRef.collection("escrowLedger").get(),
    workspaceRef.collection("hourly").doc("session").collection("checkins").get(),
    workspaceRef.collection("hourly").doc("session").get(),
    threadId
      ? db.collection("threads").doc(threadId).collection("agreement").doc("current").get()
      : Promise.resolve(null),
  ])

  const milestones = milestonesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const payoutRequests = payoutRequestsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const payments = paymentsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const escrowLedger = escrowLedgerSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const hourlyCheckins = hourlySessionSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const hourlySession = hourlyCheckinsSnap.exists ? (hourlyCheckinsSnap.data() as any) : null
  const agreement =
    agreementSnap && "exists" in agreementSnap && agreementSnap.exists
      ? (agreementSnap.data() as any)
      : null

  return {
    ...workspace,
    milestonesCount: milestones.length,
    milestones: sortNewest(milestones, ["submittedAt", "createdAt"]),
    payoutRequestsCount: payoutRequests.length,
    payoutRequests: sortNewest(payoutRequests, ["requestedAt", "updatedAt", "createdAt"]),
    finalWork: finalWorkSnap.exists ? (finalWorkSnap.data() as any) : null,
    payments: sortNewest(payments, ["paidAt", "createdAt", "updatedAt"]),
    escrowLedger: sortNewest(escrowLedger, ["createdAt", "updatedAt"]),
    hourlySession,
    hourlyCheckins: sortNewest(hourlyCheckins, ["submittedAt", "updatedAt", "createdAt"]),
    agreement,
  }
}

export default async function WorkspaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const workspace: any = await getWorkspace(id)

  if (!workspace) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Workspace not found.</CardContent>
      </Card>
    )
  }

  const payoutPending = workspace.payoutRequests.filter((item: any) =>
    ["requested", "approved", "processing"].includes(String(item.status || "").toLowerCase())
  ).length
  const paymentVolume = workspace.payments.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Workspace detail"
        title={buildWorkspaceDisplayTitle(workspace)}
        description="Inspect delivery, hourly activity, agreement state, project payment records, payouts, and submitted work from one admin workspace view."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/control/workspaces"
              className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              Back to workspaces
            </Link>
            {workspace.threadId ? (
              <Link
                href={`/control/messages/${workspace.threadId}`}
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open thread
              </Link>
            ) : null}
          </div>
        }
        stats={[
          { label: "Status", value: workspace.status || "unknown" },
          { label: "Client", value: workspace.clientName || workspace.clientUid || "N/A" },
          { label: "Talent", value: workspace.talentName || workspace.talentUid || "N/A" },
          { label: "Funding", value: formatAdminMoney(paymentVolume || workspace.payment?.amount || 0) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-gray-900">Workspace summary</h2>
                {statusBadge(workspace.status)}
              </div>

              <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="font-semibold text-gray-500">Created</div>
                  <div className="mt-1 text-gray-900">{formatAdminDate(workspace.createdAt, true)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Payment state</div>
                  <div className="mt-1 text-gray-900">{workspace.payment?.status || "not funded"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Project payment</div>
                  <div className="mt-1 text-gray-900">
                    {formatAdminMoney(workspace.payment?.amount || paymentVolume)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Payment status</div>
                  <div className="mt-1 text-gray-900">
                    {workspace.payment?.payoutStatus || workspace.payment?.status || "Not started"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Milestones</div>
                  <div className="mt-1 text-gray-900">{workspace.milestonesCount || 0}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Payout requests</div>
                  <div className="mt-1 text-gray-900">{workspace.payoutRequestsCount || 0}</div>
                </div>
              </div>

              {workspace.description ? (
                <div className="mt-6">
                  <div className="font-semibold text-gray-500">Notes</div>
                  <div className="mt-2 text-sm leading-7 text-gray-700">{workspace.description}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Project payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workspace.payments.length === 0 ? (
                <div className="text-sm text-gray-600">No workspace payment records yet.</div>
              ) : (
                workspace.payments.map((payment: any) => (
                  <div key={payment.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-extrabold text-gray-900">
                        {payment.reference || payment.id}
                      </div>
                      {statusBadge(payment.status || "recorded")}
                    </div>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <div className="font-semibold text-gray-500">Amount</div>
                        <div className="mt-1 text-gray-900">{formatAdminMoney(payment.amount)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Paid</div>
                        <div className="mt-1 text-gray-900">
                          {formatAdminDate(payment.paidAt || payment.createdAt, true)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Provider</div>
                        <div className="mt-1 text-gray-900">
                          {payment.provider || payment.gateway || "Monnify"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {workspace.escrowLedger.length ? (
                <div className="space-y-3">
                  <div className="text-sm font-extrabold text-gray-900">Payment activity</div>
                  {workspace.escrowLedger.map((entry: any) => (
                    <div key={entry.id} className="rounded-2xl border bg-[var(--secondary)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-semibold capitalize text-gray-900">
                          {String(entry.type || "entry").replace(/_/g, " ")}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatAdminMoney(entry.amount)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                        {formatAdminDate(entry.createdAt, true)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Hourly operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workspace.hourlySession ? (
                <div className="grid gap-4 text-sm md:grid-cols-3">
                  <div>
                    <div className="font-semibold text-gray-500">Session status</div>
                    <div className="mt-1 text-gray-900">{workspace.hourlySession.status || "unknown"}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Tracked time</div>
                    <div className="mt-1 text-gray-900">
                      {formatAdminDuration(workspace.hourlySession.totalSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Current hour</div>
                    <div className="mt-1 text-gray-900">
                      {workspace.hourlySession.currentHourIndex !== undefined
                        ? Number(workspace.hourlySession.currentHourIndex) + 1
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No hourly session data on this workspace.</div>
              )}

              {workspace.hourlyCheckins.length ? (
                <div className="space-y-3">
                  {workspace.hourlyCheckins.map((checkin: any) => (
                    <div key={checkin.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-extrabold text-gray-900">
                          Hour {checkin.hourIndex ?? "?"}
                        </div>
                        {statusBadge(checkin.status || "submitted")}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                        {checkin.note || "No note submitted."}
                      </div>
                      <div className="mt-3 grid gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 md:grid-cols-2">
                        <div>Submitted {formatAdminDate(checkin.submittedAt, true)}</div>
                        {checkin.dispute?.reason ? <div>Dispute raised</div> : <div>No dispute</div>}
                      </div>
                      {checkin.dispute?.reason ? (
                        <div className="mt-3 rounded-2xl border bg-orange-50 p-3 text-sm text-orange-900">
                          <span className="font-bold">Client dispute:</span> {checkin.dispute.reason}
                        </div>
                      ) : null}
                      {checkin.defense?.note ? (
                        <div className="mt-3 rounded-2xl border bg-emerald-50 p-3 text-sm text-emerald-900">
                          <span className="font-bold">Talent defense:</span> {checkin.defense.note}
                        </div>
                      ) : null}
                      {checkin.screenshotPreviewUrl ? (
                        <a
                          href={checkin.screenshotPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50"
                        >
                          Open screenshot preview
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {workspace.finalWork ? (
            <Card className="rounded-[1.75rem] border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Final work and milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold text-gray-900">Final work</div>
                    {statusBadge(workspace.finalWork.status || "submitted")}
                  </div>
                  <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-gray-500">Submitted</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminDate(workspace.finalWork.submittedAt, true)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Notes</div>
                      <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                        {workspace.finalWork.notes || "No notes"}
                      </div>
                    </div>
                  </div>
                  {workspace.finalWork.attachments?.length ? (
                    <div className="mt-4 space-y-2">
                      {workspace.finalWork.attachments.map((attachment: any, index: number) => (
                        <a
                          key={`${attachment.storagePath || attachment.name || "final"}-${index}`}
                          href={attachment.rawUrl || attachment.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-2xl border bg-white px-4 py-3 text-sm text-gray-900 transition hover:border-orange-200 hover:bg-orange-50"
                        >
                          {attachment.name || `Final work attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                {workspace.milestones.length ? (
                  <div className="space-y-3">
                    {workspace.milestones.map((milestone: any) => (
                      <div key={milestone.id} className="rounded-2xl border bg-white p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="font-semibold text-gray-900">{milestone.title || milestone.id}</div>
                          {statusBadge(milestone.status || "unknown")}
                        </div>
                        {milestone.notes ? (
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{milestone.notes}</div>
                        ) : null}
                        {milestone.attachments?.length ? (
                          <div className="mt-3 space-y-2">
                            {milestone.attachments.map((attachment: any, index: number) => (
                              <a
                                key={`${attachment.storagePath || attachment.name || "milestone"}-${index}`}
                                href={attachment.rawUrl || attachment.url || "#"}
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
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Linked records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/control/gigs/${workspace.gigId}`}
                className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white"
              >
                View gig
              </Link>
              <Link
                href={`/control/clients/${workspace.clientUid}`}
                className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white"
              >
                View client
              </Link>
              <Link
                href={`/control/talents/${workspace.talentUid}`}
                className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white"
              >
                View talent
              </Link>
              {workspace.threadId ? (
                <Link
                  href={`/control/messages/${workspace.threadId}`}
                  className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white"
                >
                  View thread and agreement
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Settlement queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border bg-[var(--secondary)] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Pending payout requests
                </div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">{payoutPending}</div>
              </div>
              {workspace.payoutRequests.length === 0 ? (
                <div className="text-sm text-gray-600">No payout requests on this workspace yet.</div>
              ) : (
                workspace.payoutRequests.map((request: any) => (
                  <div key={request.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-semibold text-gray-900">
                        Payout request for {workspace.talentName || "talent"}
                      </div>
                      {statusBadge(request.status || "requested")}
                    </div>
                    <div className="mt-3 grid gap-3 text-sm">
                      <div>
                        <div className="font-semibold text-gray-500">Requested</div>
                        <div className="mt-1 text-gray-900">
                          {formatAdminDate(request.requestedAt, true)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Requested by</div>
                        <div className="mt-1 text-gray-900">
                          {request.requestedBy === workspace.talentUid
                            ? workspace.talentName || workspace.talentUid
                            : request.requestedBy || "N/A"}
                        </div>
                      </div>
                      {request.decision?.reason ? (
                        <div>
                          <div className="font-semibold text-gray-500">Decision note</div>
                          <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                            {request.decision.reason}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {workspace.agreement ? (
            <Card className="rounded-[1.75rem] border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Agreement snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-500">Status</div>
                  <div className="mt-1 text-gray-900">{workspace.agreement.status || "draft"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Pay type</div>
                  <div className="mt-1 text-gray-900">{workspace.agreement.terms?.payType || "N/A"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Amount agreed</div>
                  <div className="mt-1 text-gray-900">
                    {workspace.agreement.terms?.amountAgreed
                      ? formatAdminMoney(workspace.agreement.terms.amountAgreed)
                      : "N/A"}
                  </div>
                </div>
                {workspace.agreement.pdfUrl ? (
                  <a
                    href={workspace.agreement.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border px-4 py-2 font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    View agreement PDF
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
