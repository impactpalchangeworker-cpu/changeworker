"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import Link from "next/link"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import FancyLoader from "@/components/ui/FancyLoader"

import {
  Briefcase,
  Search,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Hourglass,
  MessageSquare,
} from "lucide-react"

type Workspace = {
  id: string
  threadId: string
  gigId: string
  status?: string
  clientUid: string
  talentUid: string
  createdAt?: any
  updatedAt?: any

  // optional denormalized fields (if you add later)
  gigTitle?: string
  clientName?: string
  talentName?: string
  clientSlug?: string | null
  talentSlug?: string | null
}

type Thread = {
  threadId: string
  gigId: string
  gigTitle: string
  clientUid: string
  clientName: string
  clientSlug?: string | null
  talentUid: string
  talentName: string
  talentSlug?: string | null
  updatedAt?: any
}

function badgeForStatus(status?: string) {
  const s = (status || "waiting_payment").toLowerCase()
  if (s.includes("waiting")) return { label: "Waiting payment", cls: "bg-orange-100 text-orange-900 border-orange-200", icon: Hourglass }
  if (s.includes("active")) return { label: "Active", cls: "bg-green-100 text-green-900 border-green-200", icon: CheckCircle2 }
  if (s.includes("completed")) return { label: "Completed", cls: "bg-gray-100 text-gray-800 border-gray-200", icon: CheckCircle2 }
  return { label: status || "Workspace", cls: "bg-gray-100 text-gray-800 border-gray-200", icon: CreditCard }
}

function tsToMs(x: any) {
  if (!x) return 0
  if (typeof x?.toMillis === "function") return x.toMillis()
  if (typeof x === "number") return x
  return 0
}

export default function WorkspacesPage() {
  const { user } = useAuth()
  const [q, setQ] = useState("")
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  // thread cache for fallback titles/names
  const [threadById, setThreadById] = useState<Record<string, Thread>>({})

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)

    // Firestore has no OR query; we watch two queries then merge.
    const qClient = query(
      collection(db, "workspaces"),
      where("clientUid", "==", user.uid),
      orderBy("updatedAt", "desc")
    )

    const qTalent = query(
      collection(db, "workspaces"),
      where("talentUid", "==", user.uid),
      orderBy("updatedAt", "desc")
    )

    const upsert = (incoming: Workspace[], source: "client" | "talent") => {
      setItems((prev) => {
        const map = new Map<string, Workspace>()
        for (const w of prev) map.set(w.id, w)
        for (const w of incoming) map.set(w.id, w)
        const merged = Array.from(map.values())
        merged.sort((a, b) => tsToMs(b.updatedAt) - tsToMs(a.updatedAt))
        return merged
      })
    }

    const unsubClient = onSnapshot(
      qClient,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Workspace[]
        upsert(rows, "client")
        setLoading(false)
      },
      (err) => {
        console.error("workspaces(client) snapshot error:", err)
        setLoading(false)
      }
    )

    const unsubTalent = onSnapshot(
      qTalent,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Workspace[]
        upsert(rows, "talent")
        setLoading(false)
      },
      (err) => {
        console.error("workspaces(talent) snapshot error:", err)
        setLoading(false)
      }
    )

    return () => {
      unsubClient()
      unsubTalent()
    }
  }, [user?.uid])

  // fetch missing thread metadata (gigTitle / names) for any workspace that lacks it
  useEffect(() => {
    if (!items.length) return
    const missing = items
      .filter((w) => !!w.threadId)
      .filter((w) => !w.gigTitle || !w.clientName || !w.talentName)
      .map((w) => w.threadId)

    const uniq = Array.from(new Set(missing)).filter((id) => !threadById[id])
    if (uniq.length === 0) return

    ;(async () => {
      try {
        const reads = await Promise.all(
          uniq.map(async (threadId) => {
            const snap = await getDoc(doc(db, "threads", threadId))
            return snap.exists() ? ({ threadId, ...(snap.data() as any) } as Thread) : null
          })
        )
        const next: Record<string, Thread> = {}
        for (const t of reads) if (t?.threadId) next[t.threadId] = t
        setThreadById((prev) => ({ ...prev, ...next }))
      } catch (e) {
        console.error("Failed to backfill thread metadata:", e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((w) => {
      const t = w.threadId ? threadById[w.threadId] : undefined
      const gigTitle = w.gigTitle || t?.gigTitle || ""
      const clientName = w.clientName || t?.clientName || ""
      const talentName = w.talentName || t?.talentName || ""
      const blob = `${gigTitle} ${clientName} ${talentName} ${w.status || ""}`.toLowerCase()
      return blob.includes(s)
    })
  }, [items, q, threadById])

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="dashboard-page min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="dashboard-page-shell max-w-7xl mx-auto px-4 py-6">
          <div className="dashboard-page-header flex items-end justify-between gap-4 rounded-2xl p-4 md:p-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Workspaces</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your active hiring workrooms.
              </p>
            </div>

            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search workspaces…"
                className="rounded-2xl pl-9"
              />
            </div>
          </div>

          <div className="mt-4 md:hidden">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workspaces…"
              className="rounded-2xl"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {loading && items.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600"><FancyLoader label="Loading workspaces..." compact /></CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">
                    No workspaces yet. Once an agreement is fully signed, a workspace appears here.
                  </CardContent>
                </Card>
              ) : (
                filtered.map((w, idx) => {
                  const t = w.threadId ? threadById[w.threadId] : undefined
                  const gigTitle = w.gigTitle || t?.gigTitle || "Gig workspace"
                  const clientName = w.clientName || t?.clientName || "Client"
                  const talentName = w.talentName || t?.talentName || "Talent"

                  const counterparty = user?.uid === w.clientUid ? talentName : clientName

                  const meta = badgeForStatus(w.status)
                  const Icon = meta.icon

                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.22 }}
                    >
                      <Link href={`/dashboard/workspaces/${w.id}`} className="block">
                        <Card className="rounded-2xl hover:shadow-md transition bg-white">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-extrabold truncate">{gigTitle}</div>
                                  <Badge className={`rounded-full border ${meta.cls}`}>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Icon size={14} />
                                      {meta.label}
                                    </span>
                                  </Badge>
                                </div>

                                <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-2">
                                  <Briefcase size={16} className="text-[var(--primary)]" />
                                  <span className="font-semibold">
                                    With: {counterparty}
                                  </span>
                                </div>

                                <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                  Project payment details and milestones will appear here once enabled.
                                </div>
                              </div>

                              <div className="shrink-0 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
                                <ArrowRight size={16} />
                                Open
                              </div>
                            </div>

                            {w.threadId && (
                              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <MessageSquare size={14} />
                                Chat available
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </div>

            <div className="hidden lg:block space-y-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">What is a workspace?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  A workspace is created after both parties sign the agreement. Payment + delivery tracking will live here.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

