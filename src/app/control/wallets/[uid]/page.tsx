import Link from "next/link"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import {
  formatAdminDate,
  formatAdminMoney,
  getAdminIndexes,
  getUserSummary,
  getWorkspaceEscrowByClient,
  timestampToMillis,
} from "@/lib/adminData"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

const WITHDRAWAL_PAGE_SIZE = 5
const TX_PAGE_SIZE = 7

type PageProps = {
  params: Promise<{ uid: string }>
}

async function getWalletDetail(uid: string) {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()
  const escrowByClient = await getWorkspaceEscrowByClient()
  const [walletSnap, txSnap, withdrawalsSnap] = await Promise.all([
    db.collection("wallets").doc(uid).get(),
    db.collection("wallets").doc(uid).collection("transactions").get(),
    db.collection("wallets").doc(uid).collection("withdrawals").get(),
  ])

  if (!walletSnap.exists) return null

  const transactions = txSnap.docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt))

  const withdrawals = withdrawalsSnap.docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .sort(
      (a: any, b: any) =>
        timestampToMillis(b.updatedAt || b.createdAt) - timestampToMillis(a.updatedAt || a.createdAt)
    )

  return {
    id: walletSnap.id,
    ...(walletSnap.data() as any),
    owner: getUserSummary(uid, indexes),
    activeEscrow: Number(escrowByClient.get(uid) || 0),
    transactions,
    withdrawals,
  }
}

function statusBadge(status?: string) {
  const value = String(status || "recorded").toLowerCase()
  if (["paid", "completed", "success"].includes(value)) {
    return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{status}</Badge>
  }
  if (["pending", "requested", "processing"].includes(value)) {
    return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">{status}</Badge>
  }
  if (["failed", "declined"].includes(value)) {
    return <Badge className="bg-red-50 text-red-700 hover:bg-red-50">{status}</Badge>
  }
  return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{status}</Badge>
}

export default async function AdminWalletDetailPage({ params, searchParams }: { params: Promise<{ uid: string }>; searchParams?: Promise<{ withdrawalPage?: string; txPage?: string }> }) {
  const { uid } = await params
  const resolvedSearchParams = (await searchParams) || {}
  const wallet: any = await getWalletDetail(uid)

  if (!wallet) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Wallet not found.</CardContent>
      </Card>
    )
  }

  const pendingWithdrawals = wallet.withdrawals.filter((item: any) =>
    ["requested", "processing"].includes(String(item.status || "").toLowerCase())
  ).length

  const withdrawalPage = Math.max(1, Number(resolvedSearchParams.withdrawalPage || 1))
  const txPage = Math.max(1, Number(resolvedSearchParams.txPage || 1))
  const sortedWithdrawals = [...wallet.withdrawals].sort(
    (a: any, b: any) =>
      timestampToMillis(b.updatedAt || b.createdAt) - timestampToMillis(a.updatedAt || a.createdAt)
  )
  const sortedTransactions = [...wallet.transactions].sort(
    (a: any, b: any) =>
      timestampToMillis(b.createdAt || b.updatedAt) - timestampToMillis(a.createdAt || a.updatedAt)
  )
  const withdrawalPages = Math.max(1, Math.ceil(sortedWithdrawals.length / WITHDRAWAL_PAGE_SIZE))
  const txPages = Math.max(1, Math.ceil(sortedTransactions.length / TX_PAGE_SIZE))
  const safeWithdrawalPage = Math.min(withdrawalPage, withdrawalPages)
  const safeTxPage = Math.min(txPage, txPages)
  const visibleWithdrawals = sortedWithdrawals.slice((safeWithdrawalPage - 1) * WITHDRAWAL_PAGE_SIZE, safeWithdrawalPage * WITHDRAWAL_PAGE_SIZE)
  const visibleTransactions = sortedTransactions.slice((safeTxPage - 1) * TX_PAGE_SIZE, safeTxPage * TX_PAGE_SIZE)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Wallet detail"
        title={wallet.owner.name}
        description="Review the admin wallet view for this user, including funding, earnings, escrow exposure, bank setup, withdrawal requests, and transaction history."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/control/wallets"
              className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              Back to wallets
            </Link>
            {wallet.owner.adminHref !== "/control/users" ? (
              <Link
                href={wallet.owner.adminHref}
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open owner profile
              </Link>
            ) : null}
          </div>
        }
        stats={[
          { label: "Role", value: wallet.role || wallet.owner.role || "wallet" },
          {
            label: wallet.role === "client" ? "Escrow exposure" : "Available",
            value: formatAdminMoney(wallet.role === "client" ? wallet.activeEscrow : wallet.availableBalance),
          },
          { label: "Pending", value: formatAdminMoney(wallet.pendingBalance) },
          { label: "Withdrawal queue", value: pendingWithdrawals },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Wallet summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            {wallet.role === "client" ? (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Active escrow</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.activeEscrow)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Workspace funded</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalWorkspaceFunded ?? wallet.totalSpent)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Wallet balance</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.availableBalance)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total funded</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalFundingReceived ?? (Number(wallet.totalLoaded || 0) + Number(wallet.totalSpent || 0)))}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Available balance</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.availableBalance)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Pending balance</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.pendingBalance)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total earned</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalEarned)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total withdrawn</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalWithdrawn)}</div>
                </div>
              </>
            )}
            <div>
              <div className="font-semibold text-gray-500">Updated</div>
              <div className="mt-1 text-gray-900">{formatAdminDate(wallet.updatedAt, true)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Owner email</div>
              <div className="mt-1 text-gray-900">{wallet.owner.email || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Bank details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {wallet.bank?.recipientCode ? (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Account name</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.accountName}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Bank</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.bankName}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Account number</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.accountNumber}</div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  Verified for direct payment
                </Badge>
              </>
            ) : (
              <div className="text-gray-600">No verified bank details saved.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Withdrawal requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleWithdrawals.length === 0 ? (
              <div className="text-sm text-gray-600">No withdrawal requests yet.</div>
            ) : (
              visibleWithdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-extrabold text-gray-900">
                      {formatAdminMoney(withdrawal.amount)}
                    </div>
                    {statusBadge(withdrawal.status || "requested")}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div>
                      <div className="font-semibold text-gray-500">Requested</div>
                      <div className="mt-1 text-gray-900">
                        {formatAdminDate(withdrawal.createdAt, true)}
                      </div>
                    </div>
                    {withdrawal.errorMessage ? (
                      <div>
                        <div className="font-semibold text-gray-500">Provider feedback</div>
                        <div className="mt-1 text-gray-900">{withdrawal.errorMessage}</div>
                      </div>
                    ) : null}
                    {(["requested", "processing", "pending"].includes(String(withdrawal.status || "").toLowerCase())) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action="/api/admin/withdrawal-settle" method="post">
                          <input type="hidden" name="uid" value={uid} />
                          <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                          <input type="hidden" name="action" value="paid" />
                          <button type="submit" className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">Mark as paid</button>
                        </form>
                        <form action="/api/admin/withdrawal-settle" method="post">
                          <input type="hidden" name="uid" value={uid} />
                          <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                          <input type="hidden" name="action" value="reversed" />
                          <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100">Reverse</button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {sortedWithdrawals.length > WITHDRAWAL_PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/control/wallets/${uid}?withdrawalPage=${Math.max(1, safeWithdrawalPage - 1)}`}
                  className="rounded-full border px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-disabled={safeWithdrawalPage === 1}
                >
                  Previous
                </Link>
                <span className="text-xs font-semibold text-gray-500">Page {safeWithdrawalPage}/{withdrawalPages}</span>
                <Link
                  href={`/control/wallets/${uid}?withdrawalPage=${Math.min(withdrawalPages, safeWithdrawalPage + 1)}`}
                  className="rounded-full border px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-disabled={safeWithdrawalPage === withdrawalPages}
                >
                  Next
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Transaction history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleTransactions.length === 0 ? (
              <div className="text-sm text-gray-600">No wallet transactions yet.</div>
            ) : (
              visibleTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold capitalize text-gray-900">
                      {String(tx.reason || tx.type || "transaction").replace(/_/g, " ")}
                    </div>
                    <div className="text-xs font-semibold text-gray-500">
                      {formatAdminDate(tx.createdAt, true)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-gray-900">{formatAdminMoney(tx.amount)}</div>
                    <div className="mt-1">{statusBadge(tx.status || "recorded")}</div>
                  </div>
                </div>
              ))
            )}
            {sortedTransactions.length > TX_PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/control/wallets/${uid}?txPage=${Math.max(1, safeTxPage - 1)}`}
                  className="rounded-full border px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-disabled={safeTxPage === 1}
                >
                  Previous
                </Link>
                <span className="text-xs font-semibold text-gray-500">Page {safeTxPage}/{txPages}</span>
                <Link
                  href={`/control/wallets/${uid}?txPage=${Math.min(txPages, safeTxPage + 1)}`}
                  className="rounded-full border px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-disabled={safeTxPage === txPages}
                >
                  Next
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
