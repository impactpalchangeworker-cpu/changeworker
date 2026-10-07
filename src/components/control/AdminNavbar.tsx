"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  AlertTriangle, BarChart3, Bell, Briefcase, Building2, ChevronRight, FileSearch,
  FolderKanban, HandCoins, LayoutGrid, LifeBuoy, LogOut, Menu, MessageSquare,
  ShieldCheck, Star, UserRoundCheck, Users, X,
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AdminNotificationBell from "@/components/control/AdminNotificationBell"
import { logoutExpiredSession } from "@/lib/authSession"

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  { label: "Workspace", items: [
    { href: "/control/dashboard", label: "Overview", icon: LayoutGrid },
    { href: "/control/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/control/notifications", label: "Notifications", icon: Bell },
    { href: "/control/support", label: "Support inbox", icon: LifeBuoy },
  ] },
  { label: "People", items: [
    { href: "/control/users", label: "All users", icon: Users },
    { href: "/control/talents", label: "Talents", icon: UserRoundCheck },
    { href: "/control/clients", label: "Clients", icon: Building2 },
    { href: "/control/reviews", label: "Reviews", icon: Star },
  ] },
  { label: "Marketplace", items: [
    { href: "/control/gigs", label: "Gigs", icon: Briefcase },
    { href: "/control/proposals", label: "Proposals", icon: FileSearch },
    { href: "/control/workspaces", label: "Workspaces", icon: FolderKanban },
    { href: "/control/messages", label: "Messages", icon: MessageSquare },
    { href: "/control/disputes", label: "Disputes", icon: AlertTriangle },
  ] },
  { label: "Finance", items: [
    { href: "/control/transactions", label: "Transactions", icon: HandCoins },
    { href: "/control/payment-reconciliation", label: "Payment reconciliation", icon: ShieldCheck },
  ] },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  useEffect(() => {
    let alive = true
    const loadProfile = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        if (!alive) return
        const data = snap.data() as any
        setFullName(String(data?.fullName || data?.name || "Admin"))
        setPhotoUrl(String(data?.photoUrl || ""))
      } catch (error) { console.error("Admin profile read failed:", error) }
    }
    void loadProfile()
    return () => { alive = false }
  }, [user?.uid])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const initials = useMemo(() => {
    const parts = fullName.trim().split(" ").filter(Boolean)
    return `${parts[0]?.[0] || user?.email?.[0] || "A"}${parts[1]?.[0] || ""}`.toUpperCase()
  }, [fullName, user?.email])

  const handleLogout = async () => {
    try {
      await logoutExpiredSession()
      window.localStorage.removeItem("sm_role")
      toast.success("Admin session closed")
      router.push("/control/login")
    } catch (error) { console.error(error); toast.error("Logout failed") }
  }

  const navigation = (
    <nav className="control-nav-scroll" aria-label="Control navigation">
      {navGroups.map((group) => (
        <section key={group.label} className="control-nav-group">
          <p className="control-nav-label">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)
              return (
                <Link key={item.href} href={item.href} className={`control-nav-link ${active ? "control-nav-link-active" : ""}`}>
                  <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
                  <span>{item.label}</span>
                  {active ? <ChevronRight className="ml-auto" size={15} /> : null}
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )

  const profile = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="h-9 w-9 border border-orange-100">
        {photoUrl ? <AvatarImage src={photoUrl} alt="Admin avatar" /> : <AvatarFallback className="bg-orange-50 text-xs font-bold text-[var(--primary)]">{initials}</AvatarFallback>}
      </Avatar>
      <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{fullName || "Admin"}</p><p className="truncate text-xs text-slate-500">{user?.email || "Control account"}</p></div>
    </div>
  )

  return (
    <>
      <aside className="control-sidebar hidden lg:flex">
        <Link href="/control/dashboard" className="control-brand"><span className="control-brand-mark"><ShieldCheck size={20} /></span><span><strong>changeworker</strong><small>control centre</small></span></Link>
        {navigation}
        <div className="control-sidebar-footer"><div className="control-admin-profile">{profile}</div><button type="button" onClick={handleLogout} className="control-logout-button"><LogOut size={16} /> Sign out</button></div>
      </aside>
      <header className="control-mobile-bar lg:hidden">
        <Link href="/control/dashboard" className="flex items-center gap-2 text-slate-900"><span className="control-brand-mark h-9 w-9 rounded-xl"><ShieldCheck size={17} /></span><span className="text-sm font-extrabold tracking-tight">control</span></Link>
        <div className="flex items-center gap-2"><AdminNotificationBell /><button type="button" className="control-menu-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle control navigation">{mobileOpen ? <X size={19} /> : <Menu size={20} />}</button></div>
      </header>
      {mobileOpen ? <div className="control-mobile-panel lg:hidden"><div className="control-admin-profile border-b border-slate-100 pb-4">{profile}</div>{navigation}<button type="button" onClick={handleLogout} className="control-logout-button mt-3 w-full justify-center"><LogOut size={16} /> Sign out</button></div> : null}
    </>
  )
}
