"use client"

import { useEffect, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { db } from "@/lib/firebase"
import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore"
import toast from "react-hot-toast"
import { Building2, CheckCircle2, CreditCard, Landmark, RefreshCw } from "lucide-react"

type Bank = { name: string; code: string }
type PayoutProfile = { bank?: { accountNumber?: string; accountName?: string; bankCode?: string; bankName?: string } }

function money(value: number) {
  return value.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
}

function PaymentPage() {
  const { user } = useAuth()
  const { role } = useUserRole()
  const isTalent = role === "talent"
  const [payoutProfile, setPayoutProfile] = useState<PayoutProfile | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(doc(db, "payoutProfiles", user.uid), (snapshot) => setPayoutProfile(snapshot.exists() ? snapshot.data() as PayoutProfile : null))
    if (isTalent) fetch("/api/monnify/banks").then((response) => response.json()).then((data) => setBanks(data.banks || [])).catch(() => toast.error("Unable to load banks"))
    const field = isTalent ? "talentUid" : "clientUid"
    getDocs(query(collection(db, "workspaces"), where(field, "==", user.uid), orderBy("updatedAt", "desc"))).then((snapshot) => setHistory(snapshot.docs.slice(0, 5).map((item) => ({ id: item.id, ...item.data() })))).catch(() => setHistory([]))
    return unsubscribe
  }, [isTalent, user])

  const verifyAccount = async () => {
    if (!user || !bankCode || !/^\d{10}$/.test(accountNumber)) return toast.error("Choose a bank and enter a valid 10-digit account number")
    setVerifying(true)
    try {
      const response = await fetch("/api/monnify/resolve-bank", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ bankCode, accountNumber }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to verify bank account")
      toast.success(`${data.accountName} has been verified for payments`)
    } catch (error: any) {
      toast.error(error?.message || "Unable to verify bank account")
    } finally {
      setVerifying(false)
    }
  }

  return <RequireAuth><AuthNavbar /><main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl space-y-6">
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--primary)]">Payments</p><h1 className="mt-2 text-3xl font-black text-slate-950">{isTalent ? "Payouts and bank details" : "Project payment history"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{isTalent ? "Add a verified bank account. Approved project payments are sent directly to it." : "Review payments made for your active and completed projects. Each payment is linked to its workspace."}</p></div><div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800"><CreditCard className="mr-2 inline h-4 w-4" />Secure project payments</div></div></section>
    <div className={isTalent ? "grid gap-6 lg:grid-cols-[1fr_1.35fr]" : "grid gap-6"}>
      {isTalent && <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--primary)]"><Landmark className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">Payout account</h2><p className="text-xs text-slate-500">Required before a payment can be sent.</p></div></div>{payoutProfile?.bank ? <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 className="h-4 w-4" />Verified account</div><p className="mt-3 font-semibold text-slate-900">{payoutProfile.bank.accountName}</p><p className="text-sm text-slate-600">{payoutProfile.bank.accountNumber} · {payoutProfile.bank.bankName}</p></div> : <div className="mt-6 space-y-3"><label className="block text-sm font-semibold text-slate-800">Bank</label><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" value={bankCode} onChange={(event) => setBankCode(event.target.value)}><option value="">Select a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select><label className="block text-sm font-semibold text-slate-800">Account number</label><input value={accountNumber} maxLength={10} inputMode="numeric" onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="0123456789" /><button onClick={verifyAccount} disabled={verifying} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><RefreshCw className={verifying ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{verifying ? "Verifying..." : "Verify payout account"}</button></div>}</section>}
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Building2 className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">{isTalent ? "Recent project payments" : "Recent projects"}</h2><p className="text-xs text-slate-500">Latest five workspaces</p></div></div><div className="mt-5 space-y-3">{history.length ? history.map((workspace) => <a href={`/dashboard/workspaces/${workspace.id}`} key={workspace.id} className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{workspace.gigTitle || "Project workspace"}</p><p className="mt-1 text-xs text-slate-500">{workspace.payment?.status === "funded" ? "Payment confirmed" : "Awaiting project payment"}</p></div><div className="shrink-0 text-right"><p className="font-bold text-slate-900">{money(Number(workspace.payment?.amount || 0))}</p><p className="mt-1 text-xs font-semibold text-slate-500">{isTalent ? (workspace.payment?.payoutStatus || "Not sent") : (workspace.payment?.status || "Not started")}</p></div></a>) : <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No project payments to show yet.</p>}</div></section>
    </div>
  </div></main></RequireAuth>
}

export default function WalletPage() { return <PaymentPage /> }
