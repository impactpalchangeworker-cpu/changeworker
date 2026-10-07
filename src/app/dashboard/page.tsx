"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  MapPin,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, animate } from "framer-motion"
import { Wallet } from "lucide-react"
import TalentCard, { TalentRow } from "@/components/talent/TalentCard"
import DashboardHelpAssistant from "@/components/help/DashboardHelpAssistant"
import FancyLoader from "@/components/ui/FancyLoader"
import { matchTalentsToClient } from "@/lib/matching"
import { fetchPublicTalents } from "@/lib/publicProfile"
import { matchGigsToTalent, Gig } from "@/lib/matching"
import { fetchPublicGigs } from "@/lib/publicGigs"

type Role = "talent" | "client"
type UserDoc = {
  role: Role
  profileComplete?: boolean
  dashboardWelcomeSeen?: boolean
  fullName?: string
  location?: string
  sdgTags?: string[]
  rating?: {
    avg?: number // e.g 4.7
    count?: number // e.g 12
  }
  talent?: { roleTitle?: string }
  client?: { orgName?: string }
  wallet?: { totalEarned?: number; totalDeposited?: number; totalSpent?: number }
}

type ActivityItem = {
  id: string
  type: "gig" | "proposal" | "workspace" | "thread" | "wallet"
  title: string
  description: string
  href: string
  createdAt?: any
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.35 },
  }),
}

// gentle floating animation (subtle "alive" movement)
const floaty = {
  animate: {
    y: [0, -4, 0],
  },
  transition: {
    duration: 3.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
}

function toMillis(value: any) {
  if (!value) return 0
  if (typeof value?.toMillis === "function") return value.toMillis()
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  if (typeof value === "number") return value
  return 0
}

function sortByRecent<T extends { createdAt?: any; updatedAt?: any }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = toMillis(a.updatedAt || a.createdAt)
    const bTime = toMillis(b.updatedAt || b.createdAt)
    return bTime - aTime
  })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [welcomeSaving, setWelcomeSaving] = useState(false)
  const [walletTotal, setWalletTotal] = useState(0)
  const [clientWalletBalance, setClientWalletBalance] = useState(0)


  // Animated stats (count-up)
  const [statA, setStatA] = useState(0)
  const [statB, setStatB] = useState(0)
  const [statC, setStatC] = useState(0)

  // Rating count-up
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)

  // Suggested talents for clients
  const [suggestedTalents, setSuggestedTalents] = useState<TalentRow[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  // Suggested gigs for talents
  const [suggestedGigs, setSuggestedGigs] = useState<Gig[]>([])
  const [suggestedGigsLoading, setSuggestedGigsLoading] = useState(false)

  // Workspaces count
  const [workspacesCount, setWorkspacesCount] = useState(0)

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)

      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() as any) || null

      setProfile(data)
      setWelcomeOpen(data?.dashboardWelcomeSeen !== true)
      setLoading(false)

      const role: Role = data?.role

      const rAvg = Number(data?.rating?.avg || 0)
      const rCount = Number(data?.rating?.count || 0)

      let activeProposals = 0
      let openGigs = 0
      let messages = 0
      let workspaces = 0
      let suggestedCount = 0

      const [threadsResult, workspacesResult, walletResult, gigsResult, proposalsIndexResult, walletTxResult] =
        await Promise.allSettled([
          getDocs(query(collection(db, "threads"), where("participants", "array-contains", user.uid))),
          getDocs(
            query(
              collection(db, "workspaces"),
              where(role === "talent" ? "talentUid" : "clientUid", "==", user.uid)
            )
          ),
          getDoc(doc(db, "wallets", user.uid)),
          role === "client"
            ? getDocs(query(collection(db, "gigs"), where("clientUid", "==", user.uid)))
            : Promise.resolve(null),
          role === "talent"
            ? getDocs(collection(db, "users", user.uid, "proposals"))
            : Promise.resolve(null),
          getDocs(collection(db, "wallets", user.uid, "transactions")),
        ])

      const threadsDocs = threadsResult.status === "fulfilled" ? threadsResult.value.docs : []
      const workspaceDocs = workspacesResult.status === "fulfilled" ? workspacesResult.value.docs : []
      const walletDoc = walletResult.status === "fulfilled" ? walletResult.value : null
      const gigsDocs = gigsResult.status === "fulfilled" && gigsResult.value ? gigsResult.value.docs : []
      const proposalIndexDocs =
        proposalsIndexResult.status === "fulfilled" && proposalsIndexResult.value ? proposalsIndexResult.value.docs : []
      const walletTxDocs = walletTxResult.status === "fulfilled" ? walletTxResult.value.docs : []

      messages = threadsDocs.length
      workspaces = workspaceDocs.length
      openGigs = gigsDocs.filter((gigDoc) => String(gigDoc.data()?.status || "").toLowerCase() === "open").length

      // Fetch wallet total from wallets collection
      const walletData = walletDoc?.exists() ? walletDoc.data() : null
      const earned =
        Number(walletData?.totalEarned || 0) ||
        Number(walletData?.availableBalance || 0) +
          Number(walletData?.pendingBalance || 0) +
          Number(walletData?.totalWithdrawn || 0) ||
        Number(data?.wallet?.totalEarned || 0)
      const funded =
        Number(walletData?.totalFundingReceived ?? (Number(walletData?.totalLoaded || 0) + Number(walletData?.totalSpent || 0))) ||
        workspaceDocs.reduce((sum, docSnap) => sum + Number(docSnap.data()?.payment?.amount || 0), 0) ||
        Number(data?.wallet?.totalSpent || data?.wallet?.totalDeposited || 0)
      setClientWalletBalance(Number(walletData?.availableBalance || 0))
      const total = role === "client" ? funded : earned
      animate(0, total, {
        duration: 0.9,
        onUpdate: (v) => setWalletTotal(Math.round(v)),
      })

      animate(0, rAvg, {
        duration: 0.9,
        onUpdate: (v) => setAvgRating(Number(v.toFixed(1))),
      })

      // Fetch suggested talents for clients
      if (role === "client") {
        setSuggestedLoading(true)
        try {
          const allTalents = await fetchPublicTalents(20)
          const clientCriteria = {
            uid: user?.uid || "",
            fullName: data?.client?.orgName || data?.fullName || "",
            skills: data?.orgProfile?.categories || data?.categories || [],
            categories: data?.orgProfile?.categories || data?.categories || [],
            sdgTags: data?.sdgTags || [],
            workMode: data?.workMode || "",
            location: data?.location || "",
          }
          const matched = matchTalentsToClient(allTalents, clientCriteria)
          suggestedCount = matched.length
          const talentRows: TalentRow[] = matched.slice(0, 8).map((t) => ({
            uid: t.uid,
            slug: t.slug,
            fullName: t.fullName,
            location: t.location,
            roleTitle: t.roleTitle,
            photoURL: t.photoURL,
            hourlyRate: t.hourlyRate,
            skills: t.skills,
            rating: t.rating,
            verification: t.verification,
            workMode: t.workMode,
          }))
          setSuggestedTalents(talentRows)
        } catch (error) {
          console.error("Failed to fetch suggested talents:", error)
        } finally {
          setSuggestedLoading(false)
        }
      }

      // Fetch suggested gigs for talents
      if (role === "talent") {
        setSuggestedGigsLoading(true)
        try {
          const allGigs = await fetchPublicGigs(20)
          const talentCriteria = {
            uid: user?.uid || "",
            fullName: data?.fullName || "",
            skills: data?.talent?.skills || [],
            categories: data?.talent?.skills || [], // Use skills as categories fallback
            sdgTags: data?.sdgTags || [],
            workMode: data?.talent?.workMode || "",
            location: data?.location || "",
          }
          const matched = matchGigsToTalent(allGigs, talentCriteria)
          suggestedCount = matched.length
          setSuggestedGigs(matched.slice(0, 8))
        } catch (error) {
          console.error("Failed to fetch suggested gigs:", error)
        } finally {
          setSuggestedGigsLoading(false)
        }
      }

      if (role === "talent" && proposalIndexDocs.length) {
        const proposalStatuses = await Promise.all(
          proposalIndexDocs.map(async (proposalDoc) => {
            try {
              const proposalSnap = await getDoc(doc(db, "gigs", proposalDoc.id, "proposals", user.uid))
              return String(proposalSnap.data()?.status || "submitted").toLowerCase()
            } catch {
              return "submitted"
            }
          })
        )
        activeProposals = proposalStatuses.filter((status) =>
          ["submitted", "shortlisted", "accepted"].includes(status)
        ).length
      }

      const aTarget = suggestedCount
      const bTarget = role === "talent" ? activeProposals : openGigs
      const cTarget = messages

      animate(0, aTarget, { duration: 0.8, onUpdate: (v) => setStatA(Math.round(v)) })
      animate(0, bTarget, { duration: 0.9, onUpdate: (v) => setStatB(Math.round(v)) })
      animate(0, cTarget, { duration: 1.0, onUpdate: (v) => setStatC(Math.round(v)) })

      // Workspaces count
      animate(0, workspaces, { duration: 0.8, onUpdate: (v) => setWorkspacesCount(Math.round(v)) })

      // Fetch recent activities
      try {
        if (role === "talent") {
          const proposalActivities: ActivityItem[] = proposalIndexDocs.map((proposalDoc) => ({
            id: proposalDoc.id,
            type: "proposal",
            title: (proposalDoc.data() as any)?.title || "Proposal updated",
            description: `Proposal status: ${String((proposalDoc.data() as any)?.status || "submitted")}`,
            href: `/dashboard/proposals/${proposalDoc.id}`,
            createdAt: (proposalDoc.data() as any)?.updatedAt || (proposalDoc.data() as any)?.createdAt,
          }))

          const workspaceActivities: ActivityItem[] = workspaceDocs.map((workspaceDoc) => {
            const workspace = workspaceDoc.data() as any
            return {
              id: workspaceDoc.id,
              type: "workspace",
              title: workspace.gigTitle || "Workspace updated",
              description: `Workspace status: ${workspace.status || "active"}`,
              href: `/dashboard/workspaces/${workspaceDoc.id}`,
              createdAt: workspace.updatedAt || workspace.createdAt,
            }
          })

          const threadActivities: ActivityItem[] = threadsDocs.map((threadDoc) => {
            const thread = threadDoc.data() as any
            return {
              id: threadDoc.id,
              type: "thread",
              title: thread.gigTitle || "New conversation activity",
              description: thread.lastMessageText || `Conversation with ${thread.clientName || "client"}`,
              href: `/dashboard/messages/${thread.threadId || threadDoc.id}`,
              createdAt: thread.updatedAt || thread.lastMessageAt,
            }
          })

          const walletActivities: ActivityItem[] = walletTxDocs.map((txDoc) => {
            const tx = txDoc.data() as any
            return {
              id: txDoc.id,
              type: "wallet",
              title: tx.reason ? `Wallet ${String(tx.reason).replace(/_/g, " ")}` : "Wallet update",
              description: `₦${Number(tx.amount || 0).toLocaleString()} • ${tx.status || "pending"}`,
              href: "/dashboard/wallet",
              createdAt: tx.createdAt || tx.updatedAt,
            }
          })

          setRecentActivities(sortByRecent([...proposalActivities, ...workspaceActivities, ...threadActivities, ...walletActivities]).slice(0, 6))
        } else {
          const gigActivities: ActivityItem[] = gigsDocs.map((gigDoc) => {
            const gig = gigDoc.data() as any
            return {
              id: gigDoc.id,
              type: "gig",
              title: gig.title || "Gig updated",
              description: `Gig status: ${gig.status || "draft"}`,
              href: `/dashboard/gigs/${gigDoc.id}`,
              createdAt: gig.updatedAt || gig.createdAt,
            }
          })

          const workspaceActivities: ActivityItem[] = workspaceDocs.map((workspaceDoc) => {
            const workspace = workspaceDoc.data() as any
            return {
              id: workspaceDoc.id,
              type: "workspace",
              title: workspace.gigTitle || "Workspace updated",
              description: `Workspace status: ${workspace.status || "active"}`,
              href: `/dashboard/workspaces/${workspaceDoc.id}`,
              createdAt: workspace.updatedAt || workspace.createdAt,
            }
          })

          const threadActivities: ActivityItem[] = threadsDocs.map((threadDoc) => {
            const thread = threadDoc.data() as any
            return {
              id: threadDoc.id,
              type: "thread",
              title: thread.gigTitle || "Conversation updated",
              description: thread.lastMessageText || `Conversation with ${thread.talentName || "talent"}`,
              href: `/dashboard/messages/${thread.threadId || threadDoc.id}`,
              createdAt: thread.updatedAt || thread.lastMessageAt,
            }
          })

          const walletActivities: ActivityItem[] = walletTxDocs.map((txDoc) => {
            const tx = txDoc.data() as any
            return {
              id: txDoc.id,
              type: "wallet",
              title: tx.reason ? `Payment ${String(tx.reason).replace(/_/g, " ")}` : "Wallet update",
              description: `₦${Number(tx.amount || 0).toLocaleString()} • ${tx.status || "pending"}`,
              href: "/dashboard/wallet",
              createdAt: tx.createdAt || tx.updatedAt,
            }
          })

          setRecentActivities(sortByRecent([...gigActivities, ...workspaceActivities, ...threadActivities, ...walletActivities]).slice(0, 6))
        }
      } catch (error) {
        console.error('Error in recent activities:', error)
        setRecentActivities([])
      }

      animate(0, rCount, {
        duration: 0.9,
        onUpdate: (v) => setRatingCount(Math.round(v)),
      })
    }

    run()
  }, [user?.uid])

  const headline = useMemo(() => {
    if (!profile) return "Dashboard"
    if (profile.role === "talent") {
      return `Welcome, ${profile.fullName?.split(" ")[0] || "Talent"}`
    }
    return `Welcome, ${profile.client?.orgName || profile.fullName || "Organization"}`
  }, [profile])

  const sub = useMemo(() => {
    if (!profile) return "Your impact workspace"
    if (profile.role === "talent") {
      return "Find impact gigs, send proposals, and grow your profile."
    }
    return "Post gigs, shortlist talent, and manage your hiring pipeline."
  }, [profile])

  const primaryActions = useMemo(() => {
    if (profile?.role === "client") {
      return [
        {
          title: "Post a gig",
          desc: "Create a new SDG-aligned role and start receiving proposals.",
          href: "/dashboard/post-gig",
          icon: PlusCircle,
        },
        {
          title: "Search talent",
          desc: "Find talent by SDGs, skills, and location.",
          href: "/search?type=talent",
          icon: Search,
        },
        {
          title: "Saved talent",
          desc: "View the talent you've bookmarked.",
          href: "/dashboard/saved-talents",
          icon: Users,
        },
        {
          title: "Workspaces",
          desc: "Manage your active projects and collaborations.",
          href: "/dashboard/workspaces",
          icon: FolderOpen,
        },
        {
          title: "Messages",
          desc: "Communicate with talent and teams.",
          href: "/dashboard/messages",
          icon: MessageSquare,
        },
        {
          title: "Gigs",
          desc: "View and manage your posted gigs.",
          href: "/dashboard/gigs",
          icon: Briefcase,
        },
      ]
    }
    return [
      {
        title: "Find work",
        desc: "Browse gigs aligned with your SDG focus.",
        href: "/dashboard/find-work",
        icon: Search,
      },
      {
        title: "Workspaces",
        desc: "Access your active project workspaces.",
        href: "/dashboard/workspaces",
        icon: FolderOpen,
      },
      {
        title: "Messages",
        desc: "Check communications from clients.",
        href: "/dashboard/messages",
        icon: MessageSquare,
      },
      {
        title: "Proposals",
        desc: "Track your submitted proposals.",
        href: "/dashboard/proposals",
        icon: TrendingUp,
      },
    ]
  }, [profile?.role])

  const role = profile?.role || "talent"

  const proceedToProfile = async () => {
    if (!user?.uid || welcomeSaving) return
    setWelcomeSaving(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { dashboardWelcomeSeen: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
      setWelcomeOpen(false)
      router.push("/dashboard/profile")
    } catch (error) {
      console.error("welcome modal state save failed", error)
      setWelcomeOpen(false)
      router.push("/dashboard/profile")
    } finally {
      setWelcomeSaving(false)
    }
  }

  return (
    <RequireAuth>
      <AuthNavbar />

      {welcomeOpen ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Welcome to changeworker</div>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              {role === "talent" ? "Find work that fits you" : "Find the right people for your work"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {role === "talent"
                ? "Changeworker helps you find meaningful projects, talk with clients, and get paid securely."
                : "Changeworker helps you find trusted talent, manage projects, and keep payments organised. We'll guide you through each step."
              }
            </p>
            <div className="mt-6 space-y-4">
              {(role === "talent"
                ? [
                    ["Complete your profile", "Tell clients about your skills, experience, and the kind of work you want."],
                    ["Find suitable work", "Browse opportunities that match your interests and apply when you are ready."],
                    ["Work and get paid", "Use your workspace to communicate, deliver your work, and receive payment securely."],
                  ]
                : [
                    ["Complete your profile", "Tell talent about your organisation, your work, and the impact you care about."],
                    ["Post and find talent", "Share a clear project brief or search for people with the skills you need."],
                    ["Work and pay securely", "Use your workspace to manage the project, review work, and handle payment safely."],
                  ]
              ).map(([title, description], index) => (
                <div key={title} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-[var(--primary)]">{index + 1}</div>
                  <div>
                    <div className="font-bold text-gray-900">{title}</div>
                    <div className="mt-1 text-sm leading-5 text-gray-600">{description}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void proceedToProfile()}
              disabled={welcomeSaving}
              className="mt-7 w-full rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {welcomeSaving ? "Opening your profile..." : "Proceed to complete profile to continue"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="dashboard-page bg-transparent min-h-[calc(100vh-64px)]">
        <div className="section-shell mx-auto max-w-[90rem] px-4 py-8 lg:px-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={0}
            className="dashboard-page-header surface-panel flex items-start justify-between gap-4 px-6 py-5 md:px-8 md:py-6"
          >
            <div className="min-w-0">
              <div className="section-eyebrow text-xs font-semibold">Dashboard</div>
              <h1 className="section-title text-3xl md:text-4xl font-extrabold tracking-tight">
                {headline}
              </h1>
              <p className="muted-copy mt-2 max-w-2xl">{sub}</p>
            </div>

            {/* Alive badge (pulse ring) */}
            <div className="dashboard-kicker hidden md:flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full border bg-white relative shadow-sm">
              <motion.span
                aria-hidden
                className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-[var(--primary)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <ShieldCheck size={16} className="text-[var(--primary)]" />
              <span className="text-gray-700">SDG-first marketplace • Nigeria</span>
            </div>
          </motion.div>

          {!profile?.profileComplete ? (
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={1.5}
              className="mt-4"
            >
              <Link href="/dashboard/profile" className="group flex items-center justify-between gap-4 rounded-3xl border-2 border-orange-200 bg-orange-50 px-5 py-4 transition hover:border-[var(--primary)] hover:bg-orange-100 md:px-6">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Your first step</div>
                  <div className="mt-1 text-lg font-extrabold text-gray-900">Complete your profile before you continue</div>
                  <div className="mt-1 text-sm text-gray-700">Add your details so we can show you the right opportunities and people.</div>
                </div>
                <ArrowRight className="shrink-0 text-[var(--primary)] transition group-hover:translate-x-1" size={22} />
              </Link>
            </motion.div>
          ) : null}

          {/* Trust strip */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mt-4"
          >
            <div className="dashboard-card surface-panel-soft px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
              <motion.div
                className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center"
                {...floaty}
              >
                <ShieldCheck className="text-gray-500" size={18} />
              </motion.div>

              <div className="flex-1">
                <span className="font-extrabold text-gray-900">Impact-first matching</span>{" "}
              </div>

            </div>
          </motion.div>

          

          {/* Stat cards + Ratings card + Workspaces */}
          <motion.div
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            {role === "talent" ? (
              <>
                <StatCard
                  i={0}
                  icon={<Briefcase className="text-[var(--primary)]" size={18} />}
                  title="Recommended gigs"
                  value={statA}
                  hint="Based on your SDG focus"
                  href="/dashboard/find-work"
                />
                <StatCard
                  i={1}
                  icon={<TrendingUp className="text-[var(--primary)]" size={18} />}
                  title="Active proposals"
                  value={statB}
                  hint="Track your applications"
                  href="/dashboard/proposals"
                />
                <StatCard
                  i={2}
                  icon={<MessageSquare className="text-[var(--primary)]" size={18} />}
                  title="Messages"
                  value={statC}
                  hint="Client conversations"
                  href="/dashboard/messages"
                />
              </>
            ) : (
              <>
                <StatCard
                  i={0}
                  icon={<Users className="text-[var(--primary)]" size={18} />}
                  title="Suggested talent"
                  value={statA}
                  hint="Matches your SDG needs"
                  href="/dashboard/find-talent"
                />
                <StatCard
                  i={1}
                  icon={<Briefcase className="text-[var(--primary)]" size={18} />}
                  title="Open gigs"
                  value={statB}
                  hint="Roles you’re hiring for"
                  href="/dashboard/gigs"
                />
                <StatCard
                  i={2}
                  icon={<MessageSquare className="text-[var(--primary)]" size={18} />}
                  title="Messages"
                  value={statC}
                  hint="Talent conversations"
                  href="/dashboard/messages"
                />
              </>
            )}

            {/* Ratings card */}
            <RatingsCard
              i={3}
              role={role}
              avg={avgRating}
              count={ratingCount}
            />

            {/* Workspaces card */}
            <StatCard
              i={4}
              icon={<FolderOpen className="text-[var(--primary)]" size={18} />}
              title="Workspaces"
              value={workspacesCount}
              hint="Active projects"
              href="/dashboard/workspaces"
            />
          </motion.div>

          {/* Quick actions + SDGs */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick actions */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2}
              className="lg:col-span-2"
            >
              <Card className="surface-panel rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">
                    Quick actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {primaryActions.map((a) => {
                    const Icon = a.icon
                    return (
                      <motion.div
                        key={a.title}
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 240, damping: 18 }}
                      >
                        <Link
                          href={a.href}
                          className="action-tile group block rounded-3xl border bg-white p-5 hover:bg-white transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                              <Icon className="text-[var(--primary)]" size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="font-extrabold text-gray-900 group-hover:text-[var(--primary)] transition">
                                {a.title}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {a.desc}
                              </div>
                            </div>
                            <ArrowRight
                              className="text-gray-400 group-hover:text-[var(--primary)] transition"
                              size={18}
                            />
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
  variants={fadeUp}
  custom={5}
  whileHover={{ y: -4 }}
  transition={{ type: "spring", stiffness: 240, damping: 18 }}
>
  <Card className="stat-tile rounded-3xl border-0 hover:shadow-md transition">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <motion.div
          className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wallet className="text-[var(--primary)]" size={18} />
        </motion.div>

        <div className="text-right">
          <div className="text-2xl font-extrabold">
            ₦{walletTotal.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-gray-500">
            {role === "client" ? "Project payments" : "Project earnings"}
          </div>
        </div>
      </div>

      <div className="mt-3 font-extrabold">Payments</div>
        <div className="text-sm text-gray-600 mt-1">
          {role === "client"
          ? "Track confirmed payments for your projects."
          : "Approved project payments are sent to your verified bank account."}
        </div>

      {role === "client" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
          <div><div className="font-semibold text-gray-500">Latest project</div><div className="mt-1 font-extrabold text-gray-900">₦{clientWalletBalance.toLocaleString()}</div></div>
          <div><div className="font-semibold text-gray-500">Total paid</div><div className="mt-1 font-extrabold text-gray-900">₦{walletTotal.toLocaleString()}</div></div>
        </div>
      ) : null}

      <div className="mt-4">
        <Link
          href="/dashboard/wallet"
          className="text-sm font-extrabold text-[var(--primary)] hover:underline"
        >
          View payments →
        </Link>
      </div>
    </CardContent>
  </Card>
</motion.div>



          </div> {/* end quick actions + wallet grid */}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SDG Focus (alive movement) */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3}
            >
              <motion.div {...floaty}>
                <Card className="surface-panel rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      SDG focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {(profile?.sdgTags || []).slice(0, 10).map((t) => (
                      <motion.span
                        key={t}
                        whileHover={{ scale: 1.03 }}
                        className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition cursor-default"
                      >
                        {t}
                      </motion.span>
                    ))}
                    {!profile?.sdgTags?.length && (
                      <div className="text-sm text-gray-600">
                        No SDGs selected yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Suggested talents for clients */}
            {profile?.role === "client" && suggestedTalents.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={4}
              >
                <Card className="surface-panel rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                      <Users size={18} className="text-[var(--primary)]" />
                      Suggested talent
                    </CardTitle>
                    <div className="text-xs text-gray-500 font-semibold">
                      Matches based on gig needs
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestedLoading ? (
                      <FancyLoader label="Loading suggestions..." compact />
                    ) : (
                      <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                          {suggestedTalents.map((t, idx) => (
                            <div key={t.uid} className="w-80 flex-shrink-0">
                              <TalentCard t={t} idx={idx} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Link
                        href="/dashboard/find-talent"
                        className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                      >
                        Browse all categories →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          {/* Suggested gigs carousel for talents */}
          {profile?.role === "talent" && suggestedGigs.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={4}
            >
              <Card className="surface-panel rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Briefcase size={18} className="text-[var(--primary)]" />
                    Suggested gigs
                  </CardTitle>
                  <div className="text-xs text-gray-500 font-semibold">
                    Matches based on your skills and SDG focus
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestedGigsLoading ? (
                    <FancyLoader label="Loading suggestions..." compact />
                  ) : (
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4 min-w-max">
                        {suggestedGigs.map((gig, idx) => (
                          <div key={gig.id} className="w-80 flex-shrink-0">
                            <Link href={`/dashboard/find-work/${gig.id}`} className="block">
                              <Card className="action-tile rounded-3xl hover:shadow-md transition bg-white border">
                                <CardContent className="p-5">
                                  <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)]">
                                      <Briefcase size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-extrabold text-gray-900 truncate">{gig.title}</div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        {gig.category?.group} → {gig.category?.item}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                                        <span className="inline-flex items-center gap-1">
                                          <MapPin size={14} />
                                          {gig.workMode === "Remote" ? "Remote" : gig.location || "-"}
                                        </span>
                                        <span className="mx-1">•</span>
                                        <span>
                                          {gig.budgetType === "hourly" 
                                            ? `₦${gig.hourlyRate?.toLocaleString()}/hr` 
                                            : `₦${gig.fixedBudget?.toLocaleString()} fixed`}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {(gig.requiredSkills || []).slice(0, 3).map((skill) => (
                                          <span
                                            key={skill}
                                            className="text-xs font-semibold px-2 py-1 rounded-full border bg-gray-50"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Link
                      href="/dashboard/find-work"
                      className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                    >
                      View all gigs →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          </div>

          {/* Recent activity placeholder */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={4}
            className="mt-6"
          >
            <Card className="surface-panel rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {recentActivities.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      No activity yet - once you apply to gigs / post gigs, you’ll see them here.
                    </div>
                    <span className="hidden md:inline text-xs font-semibold text-gray-500">
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 5).map((activity, index) => (
                      <Link
                        key={activity.id}
                        href={activity.href}
                        className="block"
                      >
                        <Card className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {activity.type === "workspace" ? (
                              <FolderOpen size={20} className="text-[var(--primary)]" />
                            ) : activity.type === "proposal" ? (
                              <TrendingUp size={20} className="text-[var(--primary)]" />
                            ) : activity.type === "thread" ? (
                              <MessageSquare size={20} className="text-[var(--primary)]" />
                            ) : activity.type === "wallet" ? (
                              <Wallet size={20} className="text-[var(--primary)]" />
                            ) : (
                              <Briefcase size={20} className="text-[var(--primary)]" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {(activity.createdAt?.toDate?.() || (activity.createdAt instanceof Date ? activity.createdAt : null))?.toLocaleDateString() || "Recent"}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={5}
            className="mt-6"
          >
            <DashboardHelpAssistant role={role} />
          </motion.div>
        </div>
      </div>
    </RequireAuth>
  )
}

function StatCard({
  i,
  icon,
  title,
  value,
  hint,
  href,
}: {
  i: number
  icon: React.ReactNode
  title: string
  value: number
  hint: string
  href?: string
}) {
  const card = (
    <motion.div variants={fadeUp} custom={i + 1} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
      <Card className="stat-tile h-full rounded-3xl border-0 hover:shadow-md transition">
        <CardContent className="flex h-full min-h-[176px] flex-col p-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
              animate={{ rotate: [0, 2, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {icon}
            </motion.div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>
          <div className="mt-3 font-extrabold">{title}</div>
          <div className="mt-auto pt-2 text-sm text-gray-600">{hint}</div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return href ? <Link href={href} className="block h-full">{card}</Link> : card
}

function RatingsCard({
  i,
  role,
  avg,
  count,
}: {
  i: number
  role: "talent" | "client"
  avg: number
  count: number
}) {
  const title = role === "talent" ? "My rating" : "Client rating"

  const fullStars = Math.floor(avg)
  const hasHalf = avg - fullStars >= 0.5

  return (
    <motion.div variants={fadeUp} custom={i + 1} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
      <Link href="/dashboard/profile" className="block h-full">
      <Card className="stat-tile h-full rounded-3xl border-0 hover:shadow-md transition">
        <CardContent className="flex h-full min-h-[176px] flex-col p-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="text-[var(--primary)]" size={18} />
            </motion.div>

            <div className="text-right">
              <div className="text-2xl font-extrabold">
                {avg ? avg.toFixed(1) : "-"}
              </div>
              <div className="text-xs font-semibold text-gray-500">
                {count ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
              </div>
            </div>
          </div>

          <div className="mt-3 font-extrabold">{title}</div>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= fullStars || (n === fullStars + 1 && hasHalf)
              return (
                <motion.span
                  key={n}
                  animate={active ? { y: [0, -1.5, 0] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: n * 0.05 }}
                  className="inline-flex"
                >
                  <Star
                    size={16}
                    className={active ? "text-[var(--primary)]" : "text-gray-300"}
                    fill={active ? "currentColor" : "none"}
                  />
                </motion.span>
              )
            })}
          </div>

          <div className="mt-auto pt-2 text-sm text-gray-600">
            Ratings will update after completed gigs.
          </div>
        </CardContent>
      </Card>
      </Link>
    </motion.div>
  )
}
