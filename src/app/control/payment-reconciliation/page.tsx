"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

 type ReconciliationCase = {
  id: string
  reference?: string
  kind?: string
  status?: string
  attempts?: number
  error?: string
  lastProviderStatus?: string
  updatedAt?: { seconds?: number }
}

export default function PaymentReconciliationPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<ReconciliationCase[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  const loadCases = async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/admin/payment-reconciliation", { headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Could not load reconciliation cases")
      setCases(data.cases || [])
    } catch (error: any) {
      toast.error(error?.message || "Could not load reconciliation cases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCases() }, [user])

  const resolveCase = async (caseId: string) => {
    if (!user) return
    setResolving(caseId)
    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/admin/payment-reconciliation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, note: "Confirmed manually by admin" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Could not resolve case")
      toast.success("Payment reconciliation resolved")
      await loadCases()
    } catch (error: any) {
      toast.error(error?.message || "Could not resolve case")
    } finally {
      setResolving(null)
    }
  }

  const openCases = cases.filter((item) => item.status !== "resolved")

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Finance monitoring"
        title="Payment reconciliation"
        description="Monitor project payments that did not receive a normal confirmation and resolve exceptional cases manually."
        stats={[
          { label: "Open cases", value: openCases.length },
          { label: "Total cases", value: cases.length },
          { label: "Retry policy", value: "3 checks" },
          { label: "First check", value: "5 min" },
        ]}
      />

      <div className="flex justify-end">
        <button type="button" onClick={() => void loadCases()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-orange-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        {loading ? <div className="p-6 text-sm text-gray-500">Loading reconciliation cases...</div> : cases.length === 0 ? <div className="p-6 text-sm text-gray-500">No reconciliation cases yet.</div> : (
          <div className="divide-y">
            {cases.map((item) => {
              const open = item.status !== "resolved"
              return (
                <div key={item.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {open ? <AlertTriangle size={17} className="text-amber-600" /> : <CheckCircle2 size={17} className="text-emerald-600" />}
                      <span className="font-extrabold text-gray-900">Project payment</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.status}</span>
                    </div>
                    <div className="mt-2 break-all text-sm text-gray-600">Reference: {item.reference || item.id}</div>
                    <div className="mt-1 text-xs text-gray-500">Attempts: {item.attempts || 0}{item.lastProviderStatus ? ` · Provider: ${item.lastProviderStatus}` : ""}{item.error ? ` · ${item.error}` : ""}</div>
                  </div>
                  {open ? <button type="button" disabled={resolving === item.id} onClick={() => void resolveCase(item.id)} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">{resolving === item.id ? "Resolving..." : "Resolve manually"}</button> : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
