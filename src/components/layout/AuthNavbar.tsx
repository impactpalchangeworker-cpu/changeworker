"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  Menu,
  X,
  Search,
  Briefcase,
  Users,
  MessageSquare,
  LayoutGrid,
  PlusCircle,
  Wallet,
  LayoutDashboard,
} from "lucide-react"
import { db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { doc, getDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationBell from "@/components/NotificationBell"
import { cacheAuthProfile, getCachedAuthProfile, logoutExpiredSession } from "@/lib/authSession"


type Role = "talent" | "client" | null

export default function AuthNavbar() {
  const { user } = useAuth()
  const { role, loadingRole } = useUserRole()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cachedProfile = typeof window !== "undefined" ? getCachedAuthProfile() : { fullName: "", photoUrl: "" }
  const [fullName, setFullName] = useState<string>(cachedProfile.fullName)
  const [photoUrl, setPhotoUrl] = useState<string>(cachedProfile.photoUrl)

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data() as any
        if (!alive) return
        const nextName = String(data?.fullName || data?.client?.orgName || user?.displayName || user?.email || "")
        const nextPhoto = String(data?.photoUrl || "")
        setFullName(nextName)
        setPhotoUrl(nextPhoto) // we’ll set later on profile page
        cacheAuthProfile({ fullName: nextName, photoUrl: nextPhoto })
      }  catch (e) {
  console.error("AuthNavbar users/{uid} read failed:", e)
}

    }

    run()
    return () => {
      alive = false
    }
  }, [user?.uid])

  const navItem =
    "text-sm font-semibold text-black hover:text-[var(--primary)] transition"

  const handleLogout = async () => {
    try {
      await logoutExpiredSession()
      window.localStorage.removeItem("sm_role")
      toast.success("Logged out")
      router.replace("/login")
      router.refresh()
    } catch {
      toast.error("Logout failed")
    }
  }

  const links = useMemo(() => {
    if (loadingRole || !role) {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
      ]
    }

    if (role === "talent") {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/find-work", label: "Find Work", icon: Briefcase },
        { href: "/dashboard/proposals", label: "Proposals", icon: PlusCircle },
        { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
      ]
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/find-talent", label: "Hire Talent", icon: Users },
      { href: "/dashboard/post-gig", label: "Post a Gig", icon: PlusCircle },
      { href: "/dashboard/gigs", label: "Gigs", icon: Briefcase },
      { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
    ]
  }, [role, loadingRole])

  const utilityLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/wallet", label: "Payments", icon: Wallet },
  ]

  const searchType = role === "client" ? "talent" : "job"
  const searchPlaceholder =
    role === "client"
      ? "Search talent (skills, SDGs...)"
      : "Search gigs (role, SDGs...)"

  const initials = useMemo(() => {
    const name = fullName.trim()
    if (name) {
      const parts = name.split(" ").filter(Boolean)
      const first = parts[0]?.[0] || ""
      const second = parts[1]?.[0] || ""
      return (first + second).toUpperCase() || first.toUpperCase()
    }
    const fallback = user?.email?.[0] || "A"
    return fallback.toUpperCase()
  }, [fullName, user?.email])

  return (
    <>
    <header className="!fixed inset-x-0 top-0 !z-[1000] border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold text-[var(--primary)]"
          >
            <img src="/logo.png" alt="Changeworker" className="h-13 w-13" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 min-w-0">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`${navItem} whitespace-nowrap`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT (DESKTOP) */}
        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("q") || "").trim()
              if (!q) return
              router.push(`/search?type=${searchType}&q=${encodeURIComponent(q)}`)
            }}
            className="hidden items-center overflow-hidden rounded-xl border bg-white md:flex lg:w-[clamp(170px,18vw,260px)]"
          >
            <div className="px-3 text-gray-500">
              <Search size={16} />
            </div>
              <input
                name="q"
                placeholder={searchPlaceholder}
                className="w-[clamp(170px,18vw,260px)] min-w-0 bg-transparent px-2 py-2 text-sm outline-none"
              />
          </form>

          <div className="flex items-center gap-1">
            {utilityLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon size={18} />
                </Link>
              )
            })}
          </div>

          <NotificationBell />

          <Link href="/dashboard/profile" className="hidden items-center gap-2 xl:flex">
            <Avatar className="h-9 w-9">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <span className={navItem}>
              {fullName ? fullName.split(" ")[0] : "Account"}
            </span>
          </Link>

          <button onClick={handleLogout} className={`${navItem} whitespace-nowrap`}>
            Logout
          </button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden shrink-0"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-6 py-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto overflow-x-hidden overscroll-contain">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("q") || "").trim()
              if (!q) return
              router.push(`/search?type=${searchType}&q=${encodeURIComponent(q)}`)
              setMobileOpen(false)
            }}
            className="flex items-center border rounded-md overflow-hidden"
          >
            <div className="px-3 text-gray-500">
              <Search size={16} />
            </div>
            <input
              name="q"
              placeholder={searchPlaceholder}
              className="px-2 py-2 text-sm outline-none w-full"
            />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {utilityLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                </Link>
              )
            })}
            <div className="shrink-0">
              <NotificationBell />
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent transition hover:border-orange-200 hover:bg-orange-50"
              aria-label="Profile"
              title="Profile"
              onClick={() => setMobileOpen(false)}
            >
              <Avatar className="h-8 w-8">
                {photoUrl ? (
                  <AvatarImage src={photoUrl} alt="Profile" />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )}
              </Avatar>
            </Link>
          </div>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 font-semibold text-black hover:text-[var(--primary)] hover:bg-orange-50 transition"
            onClick={() => setMobileOpen(false)}
          >
            <Avatar className="h-9 w-9">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="leading-tight">
              <div className="font-extrabold">
                {fullName ? fullName.split(" ")[0] : "Account"}
              </div>
              <div className="text-xs text-gray-600">{user?.email}</div>
            </div>
          </Link>

          <div className="space-y-2">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 font-semibold text-black hover:text-[var(--primary)] hover:bg-orange-50 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  {l.label}
                </Link>
              )
            })}
          </div>

          <div className="pt-2 w-full">
            <Button
              onClick={() => {
                setMobileOpen(false)
                handleLogout()
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
    <div aria-hidden className="h-[73px]" />
    </>
  )
}
