"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, animate } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import AdminSupportAssistant from "@/components/help/AdminSupportAssistant"
import {
  Users,
  Briefcase,
  FolderKanban,
  AlertTriangle,
  Wallet,
  BarChart3,
  Bell,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

type AdminDoc = {
  fullName?: string
  email?: string
}

type WellnessCheck = {
  key: string
  label: string
  status: "ok" | "warning" | "error"
  detail: string
}

type WellnessState = {
  status: "healthy" | "watch" | "degraded" | "error"
  checkedAt?: string
  checks: WellnessCheck[]
}

type QuickLink = {
  title: string
  desc: string
  href: string
  icon: React.ElementType
}

const quickLinks: QuickLink[] = [
  { title: "Review users", desc: "Check new accounts, verification, and role-level issues.", href: "/control/users", icon: Users },
  { title: "Manage talents", desc: "Handle KYC, profile quality, and delivery-side oversight.", href: "/control/talents", icon: Users },
  { title: "Manage clients", desc: "Review client organizations, gigs, and verification state.", href: "/control/clients", icon: Users },
  { title: "Monitor gigs", desc: "Inspect open opportunities, posting quality, and client activity.", href: "/control/gigs", icon: Briefcase },
  { title: "Review proposals", desc: "Follow submission quality and acceptance flow across gigs.", href: "/control/proposals", icon: Briefcase },
  { title: "Track workspaces", desc: "Follow active deliveries, approvals, and payout states.", href: "/control/workspaces", icon: FolderKanban },
  { title: "Read messages", desc: "Open thread-level conversation context for support and disputes.", href: "/control/messages", icon: Bell },
  { title: "Resolve disputes", desc: "Handle platform escalations tied to workspace history.", href: "/control/disputes", icon: AlertTriangle },
  { title: "Review transactions", desc: "Track project payments, talent payouts, and platform fee revenue.", href: "/control/transactions", icon: Wallet },
  { title: "Check reviews", desc: "Read peer reviews and reputation signals.", href: "/control/reviews", icon: BarChart3 },
  { title: "Analytics", desc: "Follow users, gigs, workspaces, volume, and revenue.", href: "/control/analytics", icon: BarChart3 },
  { title: "Notifications", desc: "Check admin alerts and linked operational records.", href: "/control/notifications", icon: Bell },
  { title: "Support inbox", desc: "Reply to dashboard help requests from talents and clients.", href: "/control/support", icon: Bell },
]

function formatNaira(value: number) {
  return `N${value.toLocaleString()}`
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<AdminDoc | null>(null)
  const [usersCount, setUsersCount] = useState(0)
  const [gigsCount, setGigsCount] = useState(0)
  const [workspacesCount, setWorkspacesCount] = useState(0)
  const [disputesCount, setDisputesCount] = useState(0)
  const [payoutQueue, setPayoutQueue] = useState(0)
  const [withdrawalQueue, setWithdrawalQueue] = useState(0)
  const [supportUnread, setSupportUnread] = useState(0)
  const [supportOpen, setSupportOpen] = useState(0)
  const [wellness, setWellness] = useState<WellnessState>({
    status: "watch",
    checks: [],
  })

  const loadWellness = async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/system-wellness", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (res.ok) {
        setWellness({
          status: data.status,
          checkedAt: data.checkedAt,
          checks: data.checks || [],
        })
      } else {
        setWellness({
          status: "error",
          checks: [
            {
              key: "system_wellness",
              label: "System wellness",
              status: "error",
              detail: data?.error || "Wellness check failed.",
            },
          ],
        })
      }
    } catch (error: any) {
      setWellness({
        status: "error",
        checks: [
          {
            key: "system_wellness",
            label: "System wellness",
            status: "error",
            detail: error?.message || "Wellness check failed.",
          },
        ],
      })
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return

      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid))
        setProfile((profileSnap.data() as AdminDoc) || null)

        const token = await user.getIdToken()
        const res = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const stats = await res.json()
          const nextUsers = Number(stats.users || 0)
          const nextGigs = Number(stats.gigs || 0)
          const nextWorkspaces = Number(stats.workspaces || 0)
          const nextDisputes = Number(stats.disputes || 0)
          const nextPayoutQueue = Number(stats.payoutQueue || 0)
          const nextWithdrawalQueue = Number(stats.withdrawalQueue || 0)
          const nextSupportUnread = Number(stats.supportUnread || 0)
          const nextSupportOpen = Number(stats.supportOpen || 0)

          animate(0, nextUsers, { duration: 0.7, onUpdate: (value) => setUsersCount(Math.round(value)) })
          animate(0, nextGigs, { duration: 0.8, onUpdate: (value) => setGigsCount(Math.round(value)) })
          animate(0, nextWorkspaces, {
            duration: 0.9,
            onUpdate: (value) => setWorkspacesCount(Math.round(value)),
          })
          animate(0, nextDisputes, {
            duration: 1,
            onUpdate: (value) => setDisputesCount(Math.round(value)),
          })
          animate(0, nextPayoutQueue, {
            duration: 0.75,
            onUpdate: (value) => setPayoutQueue(Math.round(value)),
          })
          animate(0, nextWithdrawalQueue, {
            duration: 0.8,
            onUpdate: (value) => setWithdrawalQueue(Math.round(value)),
          })
          animate(0, nextSupportUnread, {
            duration: 0.85,
            onUpdate: (value) => setSupportUnread(Math.round(value)),
          })
          animate(0, nextSupportOpen, {
            duration: 0.9,
            onUpdate: (value) => setSupportOpen(Math.round(value)),
          })
        }
      } catch (error) {
        console.error("Error loading stats:", error)
      }

      await loadWellness()
    }

    void run()
  }, [user?.uid, user])

  const adminName = useMemo(() => {
    return profile?.fullName?.split(" ")[0] || "Admin"
  }, [profile?.fullName])

  const wellnessTone = {
    healthy: {
      chip: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      title: "Healthy",
    },
    watch: {
      chip: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      title: "Watch",
    },
    degraded: {
      chip: "bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
      title: "Degraded",
    },
    error: {
      chip: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      title: "Error",
    },
  }[wellness.status]

  const keyChecks = wellness.checks.slice(0, 4)

  return (
    <div className="control-overview space-y-6">
      <AdminPageHeader
        eyebrow="Admin overview"
        title={`Welcome back, ${adminName}`}
        description="Stay on top of the operating flow across users, gigs, workspaces, disputes, notifications, and analytics."
        stats={[
          { label: "Users", value: usersCount },
          { label: "Gigs", value: gigsCount },
          { label: "Workspaces", value: workspacesCount },
          { label: "Open disputes", value: disputesCount },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Priority operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {quickLinks.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                >
                  <Link
                    href={item.href}
                    className="group block rounded-[1.5rem] border bg-[var(--secondary)] p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-gray-900 transition group-hover:text-[var(--primary)]">
                          {item.title}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-600">{item.desc}</p>
                      </div>
                      <ArrowRight size={18} className="text-gray-400 transition group-hover:text-[var(--primary)]" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Operations queues</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                {
                  href: "/control/transactions",
                  label: "Payout queue",
                  value: payoutQueue,
                  detail: "Workspace payout requests waiting for review or release.",
                },
                {
                  href: "/control/support",
                  label: "Unread support",
                  value: supportUnread,
                  detail: "Dashboard help chats that still need an admin response.",
                },
                {
                  href: "/control/support",
                  label: "Open support",
                  value: supportOpen,
                  detail: "Total active support conversations across client and talent users.",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl border bg-[var(--secondary)] px-4 py-4 transition hover:border-orange-200 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-3xl font-extrabold text-gray-900">{item.value}</div>
                    </div>
                    <ArrowRight size={18} className="text-gray-400" />
                  </div>
                  <div className="mt-2 text-sm leading-6 text-gray-600">{item.detail}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Platform health
                  </div>
                  <div className="text-xl font-extrabold text-gray-900">{wellnessTone.title}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void loadWellness()
                  }}
                  className="ml-auto rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                >
                  Refresh
                </button>
              </div>
              <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${wellnessTone.chip}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${wellnessTone.dot}`} />
                {wellnessTone.title}
              </div>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                This check reads the live admin environment and core services so admins can quickly see whether Firebase admin access, Firestore reads, notifications, and payment configuration are in a good state.
              </p>
              <div className="mt-4 space-y-2">
                {keyChecks.map((check) => (
                  <div key={check.key} className="rounded-2xl border bg-[var(--secondary)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">{check.label}</div>
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                          check.status === "ok"
                            ? "bg-emerald-50 text-emerald-700"
                            : check.status === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {check.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-6 text-gray-600">{check.detail}</div>
                  </div>
                ))}
              </div>
              {wellness.checkedAt ? (
                <div className="mt-3 text-xs text-gray-500">
                  Checked at {new Date(wellness.checkedAt).toLocaleString()}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Admin shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  href: "/control/notifications",
                  label: "Notifications",
                  detail: "See platform alerts and review queues.",
                  icon: Bell,
                },
                {
                  href: "/control/transactions",
                  label: "Transactions",
                  detail: `Follow platform money flow, workspace funding, and platform earnings from ${formatNaira(0)} upward.`,
                  icon: Wallet,
                },
                {
                  href: "/control/analytics",
                  label: "Analytics",
                  detail: "Check trend lines and operating metrics.",
                  icon: BarChart3,
                },
                {
                  href: "/control/messages",
                  label: "Messages",
                  detail: "Open thread-level conversation records.",
                  icon: Bell,
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 rounded-2xl border bg-[var(--secondary)] px-4 py-4 transition hover:border-orange-200 hover:bg-white"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[var(--primary)]">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.label}</div>
                      <div className="text-sm leading-6 text-gray-600">{item.detail}</div>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <AdminSupportAssistant />
    </div>
  )
}
