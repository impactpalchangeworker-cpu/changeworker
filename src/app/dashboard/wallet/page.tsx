"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { db } from "@/lib/firebase"
import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore"
import toast from "react-hot-toast"
import { ArrowDownToLine, Building2, CheckCircle2, CreditCard, Landmark, Pencil, RefreshCw, WalletCards } from "lucide-react"

type Bank = { name: string; code: string }
type PayoutProfile = { bank?: { accountNumber?: string; accountName?: string; bankCode?: string; bankName?: string } }

function money(value: number) {
  return value.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
}

function PaymentPage() {
  const { user } = useAuth()
  const { role } = useUserRole()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTalent = role === "talent"
  const [wallet, setWallet] = useState<any>(null)
  const [payoutProfile, setPayoutProfile] = useState<PayoutProfile | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [editingBank, setEditingBank] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [topupAmount, setTopupAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [walletAction, setWalletAction] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(doc(db, "payoutProfiles", user.uid), (snapshot) => setPayoutProfile(snapshot.exists() ? snapshot.data() as PayoutProfile : null))
    const unsubscribeWallet = onSnapshot(doc(db, "wallets", user.uid), (snapshot) => setWallet(snapshot.exists() ? snapshot.data() : null))
    fetch("/api/paystack/banks").then((response) => response.json()).then((data) => setBanks(data.banks || [])).catch(() => toast.error("Unable to load banks"))
    const field = isTalent ? "talentUid" : "clientUid"
    getDocs(query(collection(db, "workspaces"), where(field, "==", user.uid), orderBy("updatedAt", "desc"))).then((snapshot) => setHistory(snapshot.docs.slice(0, 5).map((item) => ({ id: item.id, ...item.data() })))).catch(() => setHistory([]))
    return () => { unsubscribe(); unsubscribeWallet() }
  }, [isTalent, user])

  useEffect(() => {
    const reference = searchParams.get("reference")
    if (!user || searchParams.get("topup") !== "1" || !reference) return
    user.getIdToken().then((token) => fetch("/api/paystack/wallet-topup/verify", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reference }) })).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to confirm wallet top-up")
      toast.success(data.credited ? "Wallet funded successfully" : "Wallet top-up already confirmed")
      router.replace("/dashboard/wallet")
    }).catch((error) => toast.error(error.message || "Unable to confirm wallet top-up"))
  }, [router, searchParams, user])

  const topUpWallet = async () => {
    const amount = Number(topupAmount)
    if (amount < 10000) return toast.error("Minimum top-up is NGN 10,000")
    setWalletAction(true)
    try {
      const response = await fetch("/api/paystack/wallet-topup", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user?.getIdToken()}` }, body: JSON.stringify({ amount }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to initialize top-up")
      window.location.href = data.authorizationUrl
    } catch (error: any) { toast.error(error.message || "Unable to initialize top-up") } finally { setWalletAction(false) }
  }

  const withdraw = async () => {
    const amount = Number(withdrawAmount)
    if (amount < 1000) return toast.error("Minimum withdrawal is NGN 1,000")
    if (amount > Number(wallet?.availableBalance || 0)) return toast.error("Insufficient wallet balance")
    setWalletAction(true)
    try {
      const response = await fetch("/api/paystack/withdraw", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user?.getIdToken()}` }, body: JSON.stringify({ amount }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to initiate withdrawal")
      toast.success("Withdrawal initiated")
      setWithdrawAmount("")
    } catch (error: any) { toast.error(error.message || "Unable to initiate withdrawal") } finally { setWalletAction(false) }
  }

  const verifyAccount = async () => {
    if (!user || !bankCode || !/^\d{10}$/.test(accountNumber)) return toast.error("Choose a bank and enter a valid 10-digit account number")
    setVerifying(true)
    try {
      const response = await fetch("/api/paystack/resolve-bank", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ bankCode, accountNumber }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to verify bank account")
      toast.success(`${data.accountName} has been verified for payments`)
      setEditingBank(false)
    } catch (error: any) {
      toast.error(error?.message || "Unable to verify bank account")
    } finally {
      setVerifying(false)
    }
  }

  const startEditingBank = () => {
    setBankCode(payoutProfile?.bank?.bankCode || "")
    setAccountNumber(payoutProfile?.bank?.accountNumber || "")
    setEditingBank(true)
  }

  const cancelEditingBank = () => {
    setBankCode("")
    setAccountNumber("")
    setEditingBank(false)
  }

  return <RequireAuth><AuthNavbar /><main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl space-y-6">
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--primary)]">Payments</p><h1 className="mt-2 text-3xl font-black text-slate-950">{isTalent ? "Payouts and bank details" : "Payments and refund details"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{isTalent ? "Add a verified bank account. Approved project payments are sent directly to it." : "Review project payments and add a verified bank account for any approved refund."}</p></div><div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800"><CreditCard className="mr-2 inline h-4 w-4" />Secure project payments</div></div></section>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--primary)]"><WalletCards className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">{isTalent ? "Earnings wallet" : "Client payment tracker"}</h2><p className="text-xs text-slate-500">{isTalent ? "Confirmed project earnings arrive here before withdrawal." : "Track payments made across your workspaces."}</p></div></div><p className="mt-5 text-3xl font-black text-slate-950">{money(Number(wallet?.availableBalance || 0))}</p><p className="mt-1 text-xs text-slate-500">{isTalent ? "Available to withdraw" : "Recorded wallet balance"}</p>{isTalent && <div className="mt-5 space-y-3"><input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Amount to withdraw" /><button onClick={withdraw} disabled={walletAction} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><ArrowDownToLine className="h-4 w-4" />{walletAction ? "Processing..." : "Withdraw to bank"}</button></div>}</section>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--primary)]"><Landmark className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">{isTalent ? "Payout account" : "Refund account"}</h2><p className="text-xs text-slate-500">{isTalent ? "Required before a payment can be sent." : "Required before a dispute refund can be sent."}</p></div></div>{payoutProfile?.bank && !editingBank ? <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 className="h-4 w-4" />Verified account</div><button type="button" onClick={startEditingBank} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"><Pencil className="h-3.5 w-3.5" />Edit</button></div><p className="mt-3 font-semibold text-slate-900">{payoutProfile.bank.accountName}</p><p className="text-sm text-slate-600">{payoutProfile.bank.accountNumber} · {payoutProfile.bank.bankName}</p></div> : <div className="mt-6 space-y-3"><div className="flex items-center justify-between gap-3"><label className="block text-sm font-semibold text-slate-800">Bank</label>{payoutProfile?.bank && <button type="button" onClick={cancelEditingBank} className="text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>}</div><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" value={bankCode} onChange={(event) => setBankCode(event.target.value)}><option value="">Select a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select><label className="block text-sm font-semibold text-slate-800">Account number</label><input value={accountNumber} maxLength={10} inputMode="numeric" onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="0123456789" /><p className="text-xs leading-5 text-slate-500">Your existing account stays active until the new details are verified.</p><button onClick={verifyAccount} disabled={verifying} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><RefreshCw className={verifying ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{verifying ? "Verifying..." : payoutProfile?.bank ? "Verify new account" : "Verify account"}</button></div>}</section>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Building2 className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">{isTalent ? "Recent project payments" : "Recent projects"}</h2><p className="text-xs text-slate-500">Latest five workspaces</p></div></div><div className="mt-5 space-y-3">{history.length ? history.map((workspace) => <a href={`/dashboard/workspaces/${workspace.id}`} key={workspace.id} className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{workspace.gigTitle || "Project workspace"}</p><p className="mt-1 text-xs text-slate-500">{workspace.payment?.status === "funded" ? "Payment confirmed" : "Awaiting project payment"}</p></div><div className="shrink-0 text-right"><p className="font-bold text-slate-900">{money(Number(workspace.payment?.amount || 0))}</p><p className="mt-1 text-xs font-semibold text-slate-500">{isTalent ? (workspace.payment?.payoutStatus || "Not sent") : (workspace.payment?.status || "Not started")}</p></div></a>) : <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No project payments to show yet.</p>}</div></section>
    </div>
  </div></main></RequireAuth>
}

export default function WalletPage() { return <PaymentPage /> }
