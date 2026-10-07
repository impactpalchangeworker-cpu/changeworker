"use client"

import { lazy, Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
const TestCarousel = lazy(() => import("@/components/TestCarousel"))
import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { fetchPlatformStats } from "@/lib/platformStats"
import {
  FiBriefcase, FiUsers, FiShield, FiZap, FiRepeat,
  FiArrowRight, FiCheck, FiStar, FiChevronDown, FiMail,
  FiMapPin, FiTrendingUp, FiCheckCircle, FiHeart,
  FiBookmark, FiLayers, FiEdit3, FiSend,
  FiFileText, FiBell, FiMessageSquare
} from "react-icons/fi"
import { RiTeamLine } from "react-icons/ri"
import { TbBuildingCommunity } from "react-icons/tb"
import Footer from "@/components/layout/Footer"

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let t0: number | null = null
    const tick = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target))
      if (p < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration, start])
  return count
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return y
}

const SDGS_DISPLAY = [
  { label: "Climate Action", color: "#3F7E44", count: 38 },
  { label: "Decent Work", color: "#A21942", count: 29 },
  { label: "Quality Education", color: "#C5192D", count: 42 },
  { label: "Good Health", color: "#4C9F38", count: 31 },
  { label: "Gender Equality", color: "#FF3A21", count: 27 },
  { label: "Clean Water", color: "#26BDE2", count: 18 },
  { label: "Affordable Energy", color: "#FCC30B", count: 24 },
  { label: "Industry & Innovation", color: "#FD6925", count: 22 },
  { label: "Reduced Inequalities", color: "#DD1367", count: 19 },
  { label: "Sustainable Cities", color: "#FD9D24", count: 16 },
  { label: "Peace & Justice", color: "#00689D", count: 14 },
  { label: "Partnerships", color: "#19486A", count: 11 },
]

const HERO_IMG = "/images/4.jpeg"
const MISSION_IMG = "/images/5.jpeg"
const TALENT_IMG_1 = "https://images.pexels.com/photos/3778603/pexels-photo-3778603.jpeg?auto=compress&cs=tinysrgb&w=400"
const TALENT_IMG_2 = "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400"
const TALENT_IMG_3 = "https://images.pexels.com/photos/3807571/pexels-photo-3807571.jpeg?auto=compress&cs=tinysrgb&w=400"
const TALENT_IMG_4 = "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400"
const CTA_IMG = "/images/6.jpeg?auto=compress&cs=tinysrgb&w=1200"

const FEATURES = [
  { icon: FiZap, title: "Instant matching", body: "Post a gig and our engine immediately surfaces the most relevant vetted talent. No waiting, no manual delay.", num: "01" },
  { icon: FiShield, title: "Clear project payments", body: "Clients fund the workspace before work begins. Talent receive work earnings after final deliverables are approved. We do not hold payments in wallets.", num: "02" },
  { icon: FiCheckCircle, title: "Verified talent only", body: "Every freelancer is personally vetted - identity, skills, and sector track record confirmed before appearing.", num: "03" },
  { icon: TbBuildingCommunity, title: "Nigeria-native", body: "Naira pricing, local payment processing, and a team that deeply understands Nigerian civil society.", num: "04" },
  { icon: FiRepeat, title: "Save & rehire", body: "Bookmark talent you love and return to them for future gigs without starting a new search.", num: "05" },
  { icon: FiHeart, title: "Fair pay enforced", body: "We set minimum rate floors. 'For the mission' is never a substitute for fair professional pay.", num: "06" },
]

const PROFILES = [
  { name: "Adaeze N.", title: "Grant Writing Specialist", location: "Lagos", skills: ["Grant Writing", "Proposals", "Fundraising"], rate: "₦80k/gig", rating: 4.9, reviews: 23, available: true, img: TALENT_IMG_1 },
  { name: "Emeka T.", title: "M&E Specialist", location: "Abuja", skills: ["M&E", "MEAL", "Data Analysis"], rate: "₦120k/gig", rating: 5.0, reviews: 18, available: true, img: TALENT_IMG_2 },
  { name: "Kemi A.", title: "Communications Lead", location: "Port Harcourt", skills: ["Communications", "Content", "Strategy"], rate: "₦70k/gig", rating: 4.8, reviews: 31, available: false, img: TALENT_IMG_3 },
  { name: "Tunde B.", title: "Project Manager", location: "Ibadan", skills: ["Project Mgmt", "PMO", "Capacity Building"], rate: "₦150k/gig", rating: 4.9, reviews: 15, available: true, img: TALENT_IMG_4 },
]

const FAQS = [
  { q: "How are freelancers vetted?", a: "Graduates of our Skills For Impact skills development program and verified users sign up as talents. Every profile is manually reviewed before going live." },
  { q: "What does the 10% commission cover?", a: "The fee supports our Skills For Impact training program which equips youths with skills for the social impact sector - and covers payment processing, matching, and platform support." },
  { q: "How quickly will I get matched?", a: "Matching starts the instant a gig is posted. Clients see a curated shortlist of relevant talent within seconds of publishing." },
  { q: "What if I'm not satisfied?", a: "Workspaces support milestone review, final approval, and dispute creation so both sides have a documented process if work needs clarification or resolution." },
  { q: "Can I hire the same freelancer again?", a: "Yes. You can save talent profiles and return to them for new gigs without starting a new search." },
  { q: "What skills are available?", a: "Currently: Grant Writing, M&E/MEAL, Project Management, Communications, Fundraising, Research, Data Analysis, Capacity Building, Strategic Planning, and Proposal Writing." },
]

const STEPS_ORG = [
  { icon: FiEdit3, num: "01", label: "Post a gig", desc: "Describe the work, set your budget, tag relevant SDGs - done in 5 minutes." },
  { icon: FiZap, num: "02", label: "Get matched", desc: "Instant matching surfaces vetted talent the moment your gig goes live." },
  { icon: FiUsers, num: "03", label: "Choose & agree", desc: "Review profiles, discuss scope, agree on terms inside the platform." },
  { icon: FiCheckCircle, num: "04", label: "Deliver & complete", desc: "Work is delivered through the workspace. Approve final deliverables and the talent receives their work earnings." },
]

const STEPS_FL = [
  { icon: FiLayers, num: "01", label: "Build your profile", desc: "Showcase skills, SDG focus, sector experience, and your portfolio." },
  { icon: FiBell, num: "02", label: "Get auto-matched", desc: "Relevant gigs surface to you the moment they're posted. No bidding." },
  { icon: FiMessageSquare, num: "03", label: "Discuss & start", desc: "The client funds the workspace. You begin work with a clear payment process in place." },
  { icon: FiTrendingUp, num: "04", label: "Deliver & earn", desc: "Submit work, get approved, receive your work earnings. Build your reputation." },
]

/* ═══ PRELOADER ══════════════════════════════════════════════ */
function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<"counting" | "reveal" | "exit">("counting")

  useEffect(() => {
    let cur = 0
    const speeds = [15, 35, 10, 55]
    const caps = [40, 70, 90, 100]

    const tick = () => {
      cur = Math.min(cur + 1, 100)
      setPct(cur)

      const seg = caps.findIndex((c) => cur <= c)
      if (cur < 100) {
        setTimeout(tick, speeds[seg] || 15)
      } else {
        setPhase("reveal")
        setTimeout(() => {
          setPhase("exit")
          setTimeout(onDone, 750)
        }, 900)
      }
    }

    setTimeout(tick, 300)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060912] overflow-hidden"
      style={{
        transition:
          phase === "exit"
            ? "opacity .75s ease, transform .75s cubic-bezier(.76,0,.24,1)"
            : "none",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div
        className="absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "pulse 3s ease-in-out infinite" }}
      />

      <div
        className="mb-12 flex flex-col items-center gap-5"
        style={{
          transition:
            phase === "reveal"
              ? "transform .6s cubic-bezier(.34,1.56,.64,1)"
              : "none",
          transform: phase === "reveal" ? "scale(1.08)" : "scale(1)",
        }}
      >
        <div className="relative w-28 h-28 flex items-center justify-center">
  <svg
    viewBox="0 0 178 152"
    className="w-full h-full"
    style={{ filter: "drop-shadow(0 0 20px rgba(249,115,22,.28))" }}
  >
    <defs>
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8DF69" />
        <stop offset="100%" stopColor="#EFD45C" />
      </linearGradient>

      <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F39A42" />
        <stop offset="100%" stopColor="#EC8A2F" />
      </linearGradient>

      <clipPath id="leftReveal">
        <rect x="0" y="0" width={(89 * Math.min(pct, 55)) / 55} height="152" />
      </clipPath>

      <clipPath id="rightReveal">
        <rect
          x={178 - (89 * Math.max(0, Math.min(pct - 18, 55))) / 55}
          y="0"
          width={(89 * Math.max(0, Math.min(pct - 18, 55))) / 55}
          height="152"
        />
      </clipPath>
    </defs>

    <g clipPath="url(#leftReveal)">
      <path
        d="
          M 10 48
          C 22 48, 34 48, 44 53
          C 55 58, 63 69, 72 83
          C 79 95, 84 95, 88 92
          C 90 90, 92 89, 95 92
          L 83 104
          C 77 112, 71 119, 63 121
          C 53 123, 44 118, 36 109
          C 29 100, 24 89, 19 79
          C 14 69, 9 58, 4 51
          Z
        "
        fill="url(#wingGrad)"
      />
    </g>

    <g clipPath="url(#rightReveal)">
      <path
        d="
          M 168 48
          C 156 48, 144 48, 134 53
          C 123 58, 115 69, 106 83
          C 99 95, 94 95, 90 92
          C 88 90, 86 89, 83 92
          L 95 104
          C 101 112, 107 119, 115 121
          C 125 123, 134 118, 142 109
          C 149 100, 154 89, 159 79
          C 164 69, 169 58, 174 51
          Z
        "
        fill="url(#wingGrad)"
      />
    </g>

    {pct > 48 && (
      <circle
        cx="89"
        cy="82"
        r="14"
        fill="url(#dotGrad)"
        style={{
          animation: "fadeInScale .35s cubic-bezier(.34,1.56,.64,1) both",
        }}
      />
    )}
  </svg>
</div>

        <p className="font-display font-black text-4xl text-white tracking-tight">
          changeworker
        </p>
        <p className="font-display font-light text-white/30 text-xs tracking-[.25em] uppercase">
          Flexible talents. Meaningful work.
        </p>
      </div>

      <div className="w-80">
        <div className="h-px bg-white/8 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${pct}%`, boxShadow: "0 0 14px rgba(249,115,22,.9)" }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-white/20 text-[11px]">Initializing platform</span>
          <span className="font-mono text-orange-400 text-[11px] font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ faq, idx, inView }: { faq: typeof FAQS[0]; idx: number; inView: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b border-gray-200 ${inView ? "up" : "opacity-0"}`}
      style={{ "--d": `${idx * .055}s` } as React.CSSProperties}>
      <button className="w-full flex items-center justify-between py-5 text-left group" onClick={() => setOpen(o => !o)}>
        <span className="font-semibold text-[#111] text-sm md:text-base pr-8" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{faq.q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${open ? "bg-[#F97316] border-[#F97316]" : "border-gray-200 group-hover:border-gray-400"}`}
          style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <FiChevronDown size={13} style={{ color: open ? "white" : "#9CA3AF" }} />
        </span>
      </button>
      <div style={{ maxHeight: open ? "220px" : "0", transition: "max-height .4s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
        <p className="pb-5 text-gray-500 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans',sans-serif" }}>{faq.a}</p>
      </div>
    </div>
  )
}

function StatNum({ val, suf, label, delay, start, dark }: { val: number; suf: string; label: string; delay: string; start: boolean; dark?: boolean }) {
  const n = useCounter(val, 1800, start)
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`font-black text-4xl lg:text-5xl ${dark ? "text-white" : "text-[#111]"}`} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {n}{suf}
      </span>
      <span className={`text-sm ${dark ? "text-white/50" : "text-gray-400"}`} style={{ fontFamily: "'DM Sans',sans-serif" }}>{label}</span>
    </div>
  )
}

function ProfileCard({ p, idx, inView }: { p: any; idx: number; inView: boolean }) {
  const [saved, setSaved] = useState(false)
  const isReal = p.id !== undefined
  const name = isReal ? (p.fullName || p.displayName || "Anonymous") : p.name
  const title = isReal ? (p.talent?.roleTitle || p.headline || "Freelancer") : p.title
  const location = isReal ? (p.location || "Nigeria") : p.location
  const skills = isReal ? (p.talent?.skills || p.skills || []) : p.skills
  const rate = isReal ? (p.publicProfile?.hourlyRate ? `₦${p.publicProfile.hourlyRate.toLocaleString()}/hr` : "Rate on request") : p.rate
  const rating = isReal ? (p.rating || 0) : p.rating
  const reviews = isReal ? (p.reviewCount || 0) : p.reviews
  const available = isReal ? (p.available !== false) : p.available
  const photoUrl = isReal ? p.publicProfile?.photoURL : p.img
  const impactPalBadge = isReal && Boolean(p.impactPalBadge)

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-[#F3F4F6] border border-transparent hover:border-gray-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${inView ? "up" : "opacity-0"}`}
      style={{ "--d": `${.05 + idx * .09}s` } as React.CSSProperties}>
      <div className="relative h-44 overflow-hidden bg-gray-200">
        {photoUrl ? (
          <img src={photoUrl} alt={name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F3F4F6,#E5E7EB)" }}>
            <span className="text-5xl font-black text-gray-300" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{name[0]}</span>
          </div>
        )}
        {available && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-emerald-600 text-[10px] font-bold backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Available
          </span>
        )}
        {impactPalBadge && (
          <span className="absolute bottom-3 left-3 rounded-full border border-orange-200 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#F97316] backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Impactpal
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
          className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
          <FiBookmark size={12} style={{ color: saved ? "#F97316" : "#9CA3AF", fill: saved ? "#F97316" : "none" }} />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <p className="font-bold text-[#111] text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{name}</p>
          <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: "'DM Sans',sans-serif" }}>{title}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <span className="flex items-center gap-1"><FiMapPin size={9} />{location}</span>
          {rating > 0 && <span className="flex items-center gap-1"><FiStar size={9} style={{ color: "#F97316", fill: "#F97316" }} />{rating.toFixed(1)} <span className="text-gray-300">({reviews})</span></span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 3).map((s: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500" style={{ fontFamily: "'DM Sans',sans-serif" }}>{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-[#111]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{rate}</span>
          <Link href={`/talent/${p.uid || p.id || idx}`}
            className="text-xs font-bold text-[#F97316] flex items-center gap-1 hover:gap-2 transition-all no-underline"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            View <FiArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [loaded] = useState(true)
  const [tab, setTab] = useState<"org" | "freelancer">("org")
  const [activeStep, setActiveStep] = useState(0)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const [stats, setStats] = useState({ freelancers: 0, clients: 0, projects: 0, satisfaction: 98 })
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([])
  const [sdgData, setSdgData] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])

  const { user } = useAuth()

  const heroRef = useInView(0.05)
  const missionRef = useInView(0.06)
  const statsRef = useInView(0.1)
  const featRef = useInView(0.06)
  const processRef = useInView(0.08)
  const profilesRef = useInView(0.06)
  const sdgRef = useInView(0.06)
  const testiRef = useInView(0.06)
  const splitRef = useInView(0.05)
  const compRef = useInView(0.06)
  const faqRef = useInView(0.06)
  const ctaRef = useInView(0.08)

  const fireConfetti = useCallback(async () => {
    try { const c = (await import("canvas-confetti")).default; c({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#F97316", "#EA580C", "#FCD34D", "#fff"] }) } catch {}
  }, [])
  const handleEmailSubmit = () => { if (!email) return; setSubmitted(true); fireConfetti() }
  const handlePostProject = () => { window.location.href = user ? "/dashboard/post-gig" : "/login" }
  const handleCreateProfile = () => { window.location.href = user ? "/dashboard/profile" : "/signup" }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { collection, getDocs, query, where, limit, orderBy } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const { SDGS } = await import("@/data/sdgs")
        const platformStats = await fetchPlatformStats()
        let profiles: any[] = [], sdgArr: any[] = []
        try {
          const snap = await getDocs(collection(db, "publicProfiles"))
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
          profiles = all
            .filter((u: any) => u.role === "talent" && u.profileComplete === true && u.impactPalBadge === true)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
          const talents = all.filter((u: any) => u.role === "talent")
          const cnts: Record<string, number> = {}
          SDGS.forEach((s: string) => cnts[s] = 0)
          talents.forEach((t: any) => { (t.sdgTags || []).forEach((s: string) => { if (cnts[s] !== undefined) cnts[s]++ }) })
          sdgArr = SDGS.map((sdg: string, i: number) => ({ label: sdg, count: cnts[sdg] || 0, color: SDGS_DISPLAY[i % SDGS_DISPLAY.length]?.color || "#F97316" })).filter((s: any) => s.count > 0).slice(0, 12)
        } catch (e) { console.error(e) }
        try {
          const rq = query(collection(db, "platform_reviews"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(5))
          const rs = await getDocs(rq)
          setTestimonials(rs.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (e) { console.error(e) }
        setStats({ freelancers: platformStats.freelancers, clients: platformStats.clients, projects: platformStats.projects, satisfaction: platformStats.satisfaction })
        setSdgData(sdgArr)
        setFeaturedProfiles(profiles)
      } catch (e) { console.error(e) }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (!processRef.inView) return
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 2200)
    return () => clearInterval(t)
  }, [processRef.inView])

  const steps = tab === "org" ? STEPS_ORG : STEPS_FL
  const displaySdgs = sdgData.length > 0 ? sdgData : SDGS_DISPLAY

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        :root{
          --orange:#F97316; --orange-dk:#EA580C; --orange-lt:#FFF7ED;
          --black:#111111; --off:#F5F5F5; --border:#E8E8E8;
          --text:#6B7280;
          --fh:'Plus Jakarta Sans',sans-serif;
          --fb:'DM Sans',sans-serif;
        }
        body{font-family:var(--fb);background:white;color:var(--black)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:var(--orange);border-radius:4px}

        @keyframes up    {from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marq  {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes ping  {0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}
        @keyframes float {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes float3{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes shimB {0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes slide {from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
        @keyframes fadeI {from{opacity:0}to{opacity:1}}
        @keyframes scIn  {from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}

        .up{opacity:0;animation:up .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .sc{opacity:0;animation:scIn .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}

        .hd{font-family:var(--fh);font-weight:900;line-height:1.08;color:var(--black)}
        .lbl{font-family:var(--fh);font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange)}
        .bd{font-family:var(--fb);color:var(--text);line-height:1.75}

        .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--orange);color:white;font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:none;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;text-decoration:none}
        .btn-p:hover{background:var(--orange-dk);transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,.28)}
        .btn-o{display:inline-flex;align-items:center;gap:8px;background:white;color:var(--black);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid var(--border);cursor:pointer;transition:border-color .2s,transform .15s;text-decoration:none}
        .btn-o:hover{border-color:#aaa;transform:translateY(-1px)}
        .btn-o-dark{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.65);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid rgba(255,255,255,.18);cursor:pointer;transition:border-color .2s,color .2s;text-decoration:none}
        .btn-o-dark:hover{border-color:rgba(255,255,255,.5);color:white}

        .card{background:#F3F4F6;border:1.5px solid transparent;border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card:hover{border-color:var(--border);box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-3px)}
        .card-w{background:white;border:1.5px solid var(--border);border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card-w:hover{border-color:#ccc;box-shadow:0 8px 28px rgba(0,0,0,.07);transform:translateY(-3px)}

        .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:11px;font-family:var(--fh);font-weight:600}

        .la{display:inline-flex;align-items:center;gap:5px;font-family:var(--fh);font-weight:700;font-size:.875rem;color:var(--orange);transition:gap .18s;cursor:pointer;text-decoration:none}
        .la:hover{gap:9px}

        .img-cover{object-fit:cover;width:100%;height:100%}
        .img-scrim{background:linear-gradient(to top,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 50%,transparent 100%)}
        .img-scrim-r{background:linear-gradient(to right,rgba(0,0,0,.6) 0%,rgba(0,0,0,.15) 60%,transparent 100%)}
      `}</style>

      {/* {!loaded && <Preloader onDone={() => setLoaded(true)} />} */}

      <div style={{ opacity: loaded ? 1 : 0, transition: "opacity .4s ease .1s" }}>
        <Navbar />

        <section ref={heroRef.ref} className="relative overflow-hidden min-h-[90svh] flex items-center">
          <img src={HERO_IMG} alt="" aria-hidden
            className="absolute inset-0 img-cover"
            style={{ objectPosition: "center 30%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(10,10,10,.70)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(100deg,rgba(10,10,10,.82) 0%,rgba(10,10,10,.55) 50%,rgba(10,10,10,.2) 100%)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom left,rgba(249,115,22,.18) 0%,transparent 70%)" }} />

          <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-24 w-full">
            <div className="max-w-2xl">
              <div className={`mb-7 ${heroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".1s" } as React.CSSProperties}>
                <h1 className="text-white font-black text-5xl lg:text-[68px] xl:text-[76px] leading-[1.02] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Flexible talents.<br />
                  <span style={{ color: "#F97316" }}>Meaningful work.</span>
                </h1>
              </div>

              <div className={`mb-8 ${heroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".24s" } as React.CSSProperties}>
                <p className="text-white text-lg leading-relaxed max-w-lg" style={{ fontFamily: "'DM Sans',sans-serif" }}>
Nigerian Social impact organizations and social enterprises do critical work on tight resources. Changeworker gives you access to skilled, vetted professionals who understand the sector, without the overhead of a full-time hire.
Pay for what you need. Get work that counts.                </p>
              </div>

              <div className={`flex flex-wrap gap-3 mb-10 ${heroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".36s" } as React.CSSProperties}>
                <Link href="/hire" className="btn-p" style={{ padding: "1rem 2.2rem", fontSize: "1rem" }}>
                  Hire talent <FiArrowRight size={16} />
                </Link>
                <Link href="/jobs" className="btn-o-dark" style={{ padding: "1rem 2.2rem", fontSize: "1rem" }}>
                  Find work
                </Link>
              </div>

              <div className={`flex flex-wrap gap-5 ${heroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".48s" } as React.CSSProperties}>
                {["Verified profiles", "Instant matching", "Naira pricing", "Clear project payments"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <FiCheckCircle size={12} style={{ color: "#F97316" }} />
                    <span className="text-white text-xs" style={{ fontFamily: "'DM Sans',sans-serif" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-10 right-6 lg:right-12 hidden lg:flex flex-col gap-3 w-64">
              <div className="card-w p-4" style={{ animation: "float 6s ease-in-out infinite" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="pill bg-orange-50 text-[#F97316] border border-orange-100 text-[10px]">New gig</span>
                  <span className="font-black text-sm text-[#F97316]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>₦150k</span>
                </div>
                <p className="font-bold text-[#111] text-xs mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>M&E Specialist Needed</p>
                <p className="text-gray-400 text-[10px] leading-relaxed mb-3" style={{ fontFamily: "'DM Sans',sans-serif" }}>2-month remote · Environmental NGO, Lagos</p>
                <button className="w-full bg-[#F97316] text-white text-[10px] font-bold py-2 rounded-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>View gig →</button>
              </div>

              <div className="card-w p-4" style={{ animation: "float2 7.5s ease-in-out .8s infinite" }}>
                <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, i) => <FiStar key={i} size={9} style={{ color: "#F97316", fill: "#F97316" }} />)}</div>
                <p className="text-gray-600 text-[11px] italic leading-relaxed mb-2" style={{ fontFamily: "'DM Sans',sans-serif" }}>"Found the perfect grant writer in minutes."</p>
                <p className="text-gray-400 text-[10px] font-semibold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Chioma O. · Exec Director</p>
              </div>
            </div>
          </div>
        </section>

        <div className="relative py-4 overflow-hidden border-y border-gray-100 bg-white">
          <div className="flex w-max gap-3" style={{ animation: "marq 32s linear infinite" }}>
            {[...Array(4)].flatMap(() => [
              "Grant Writing", "M&E / MEAL", "Project Management", "Fundraising",
              "Communications", "Research", "Data Analysis", "Capacity Building",
              "Strategic Planning", "Proposal Writing", "Climate Action", "Civic Tech"
            ]).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 text-gray-500 text-sm whitespace-nowrap" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F97316" }} />{s}
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>

        <section ref={missionRef.ref} className="relative overflow-hidden bg-[#111] py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className={`lbl mb-5 text-orange-400 ${missionRef.inView ? "up" : "opacity-0"}`} style={{ "--d": "0s" } as React.CSSProperties}>Our mission</p>
                <h2 className={`font-black text-4xl lg:text-5xl text-white leading-[1.08] mb-7 ${missionRef.inView ? "up" : "opacity-0"}`} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", "--d": ".1s" } as React.CSSProperties}>
                  Building Africa's<br />workforce for<br /><span style={{ color: "#F97316" }}>social impact.</span>
                </h2>
                <p className={`text-white/50 text-base leading-relaxed mb-8 max-w-md ${missionRef.inView ? "up" : "opacity-0"}`} style={{ fontFamily: "'DM Sans',sans-serif", "--d": ".2s" } as React.CSSProperties}>
                  Social impact organizations shouldn't choose between mission and capability. Skilled professionals shouldn't choose between purpose and income. We built changeworker so nobody has to choose.
                </p>
                {/* <div className={`grid grid-cols-3 gap-6 ${missionRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".32s" } as React.CSSProperties}>
                  {statsRef.inView && <>
                    <StatNum val={stats.freelancers} suf="+" label="Talent profiles" delay="0s" start dark />
                    <StatNum val={stats.clients} suf="+" label="Client profiles" delay=".08s" start dark />
                    <StatNum val={stats.projects} suf="+" label="Published gigs" delay=".16s" start dark />
                  </>}
                  {!statsRef.inView && [
                    [stats.freelancers || 200, "+", "Talent profiles"],
                    [stats.clients || 50, "+", "Client profiles"],
                    [stats.projects || 80, "+", "Published gigs"],
                  ].map(([v, s, l]) => (
                    <div key={l as string}>
                      <p className="font-black text-3xl text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v}{s}</p>
                      <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: "'DM Sans',sans-serif" }}>{l}</p>
                    </div>
                  ))}
                </div> */}
              </div>

              <div className={`relative rounded-2xl overflow-hidden h-80 lg:h-[420px] ${missionRef.inView ? "sc" : "opacity-0"}`} style={{ "--d": ".1s" } as React.CSSProperties}>
                <img src={MISSION_IMG} alt="Impact work in Nigeria" className="img-cover" style={{ objectPosition: "center 20%" }} />
                <div className="absolute inset-0 img-scrim" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="pill bg-white/10 text-white border border-white/15 backdrop-blur-sm text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    Impact work happening across Nigeria
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <section ref={splitIntroRef.ref} className="bg-white pb-14 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 ${splitIntroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".04s" } as React.CSSProperties}>
                <span className="pill bg-orange-100 text-[#F97316] border border-orange-200 mb-4 text-[11px]">
                  <FiBriefcase size={10} /> For organizations
                </span>
                <h3 className="hd text-2xl mb-2">Hire vetted talent fast</h3>
                <p className="bd text-sm mb-5">Bring in the right specialist for a project window without long-term overhead.</p>
                <button onClick={handlePostProject} className="btn-p">Post a gig <FiArrowRight size={14} /></button>
              </div>

              <div className={`rounded-3xl border border-gray-200 bg-[#111] p-6 ${splitIntroRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".12s" } as React.CSSProperties}>
                <span className="pill bg-white/10 text-white border border-white/15 mb-4 text-[11px]">
                  <FiUsers size={10} /> For freelancers
                </span>
                <h3 className="font-black text-2xl text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Get impact gigs that pay fairly</h3>
                <p className="text-white/65 text-sm mb-5" style={{ fontFamily: "'DM Sans',sans-serif" }}>Show your skills, get matched quickly, and build credibility through real mission-driven work.</p>
                <button onClick={handleCreateProfile} className="btn-p">Create your profile <FiArrowRight size={14} /></button>
              </div>
            </div>
          </div>
        </section> */}

        {/* <section ref={statsRef.ref} className="py-16 bg-[#F5F5F5] border-y border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {statsRef.inView && <>
                <StatNum val={stats.freelancers} suf="+" label="Talent profiles" delay=".05s" start />
                <StatNum val={stats.clients} suf="+" label="Client profiles" delay=".13s" start />
                <StatNum val={stats.projects} suf="+" label="Published gigs" delay=".21s" start />
                <StatNum val={stats.satisfaction} suf="%" label="Satisfaction rate" delay=".29s" start />
              </>}
            </div>
          </div>
        </section> */}

        <section ref={featRef.ref} className="py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`mb-12 ${featRef.inView ? "up" : "opacity-0"}`}>
              <p className="lbl mb-3">Why changeworker</p>
              <h2 className="hd text-4xl lg:text-5xl max-w-lg">
                Built for<br /><span style={{ color: "#F97316" }}>impact work.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`card md:row-span-2 p-8 flex flex-col justify-between min-h-[340px] ${featRef.inView ? "up" : "opacity-0"}`}
                style={{ "--d": ".08s", background: "#111" } as React.CSSProperties}>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#F97316]/20 flex items-center justify-center mb-6">
                    <FiZap size={22} style={{ color: "#F97316" }} />
                  </div>
                  <h3 className="font-black text-white text-xl mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Instant matching</h3>
                  <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                    Post a gig and our matching engine immediately surfaces the most relevant vetted talent. No waiting period. No manual delay. Talent appear in your shortlist within seconds of posting.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" style={{ animation: "ping 1.5s cubic-bezier(0,0,.2,1) infinite", opacity: 0.75 }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 absolute" />
                  <span className="text-white/40 text-xs" style={{ fontFamily: "'DM Sans',sans-serif" }}>Matching happens in real time</span>
                </div>
              </div>

              <div className={`card p-6 ${featRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <FiShield size={18} style={{ color: "#F97316" }} />
                </div>
                <h3 className="font-bold text-[#111] text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Clear project payments</h3>
                <p className="bd text-sm">Clients fund the workspace before work begins. Talent receive work earnings after final deliverables are approved. changeworker does not hold payments in wallets for organizations or talent; payments are direct.</p>
              </div>

              <div className={`card p-6 ${featRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".22s" } as React.CSSProperties}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <FiCheckCircle size={18} style={{ color: "#F97316" }} />
                </div>
                <h3 className="font-bold text-[#111] text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Verified talent only</h3>
                <p className="bd text-sm">Graduates of our Skills For Impact skills development program and verified users sign up  as talents.</p>
              </div>

              <div className={`card p-6 ${featRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".29s" } as React.CSSProperties}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <TbBuildingCommunity size={18} style={{ color: "#F97316" }} />
                </div>
                <h3 className="font-bold text-[#111] text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nigeria-native</h3>
                <p className="bd text-sm">Naira pricing, local payment processing, and a team that deeply understands Nigerian civil society.</p>
              </div>

              <div className={`card p-6 md:col-span-2 flex items-center gap-6 ${featRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".36s", background: "#FFF7ED", borderColor: "#FED7AA" } as React.CSSProperties}>
                <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center shrink-0">
                  <FiHeart size={20} style={{ color: "#F97316" }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#111] text-sm mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Fair pay enforced</h3>
                  <p className="bd text-sm">We set minimum rate floors. <strong style={{ color: "#111", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>'For the mission'</strong> is never a substitute for fair professional compensation. Every freelancer earns what they deserve.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section ref={processRef.ref} className="py-28 bg-[#F5F5F5] border-y border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 ${processRef.inView ? "up" : "opacity-0"}`}>
              <div>
                <p className="lbl mb-3">The process</p>
                <h2 className="hd text-4xl lg:text-5xl">How it works</h2>
              </div>
              <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 gap-1 self-start sm:self-auto">
                {(["org", "freelancer"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: tab === t ? "#F97316" : "transparent", color: tab === t ? "white" : "#6B7280", boxShadow: tab === t ? "0 2px 8px rgba(249,115,22,.3)" : "none" }}>
                    {t === "org" ? "For organizations" : "For freelancers"}
                  </button>
                ))}
              </div>
            </div>

            <div key={tab} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Icon = step.icon
                const active = activeStep === i
                return (
                  <div key={i}
                    className={`card-w p-6 cursor-pointer transition-all duration-300 ${active ? "border-[#F97316] shadow-md" : ""} ${processRef.inView ? "up" : "opacity-0"}`}
                    style={{ "--d": `${.1 + i * .08}s`, background: active ? "#FFF7ED" : "white", borderColor: active ? "#F97316" : undefined } as React.CSSProperties}
                    onClick={() => setActiveStep(i)}>
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-[#F97316]" : "bg-[#F3F4F6]"}`}>
                        <Icon size={18} style={{ color: active ? "white" : "#9CA3AF" }} />
                      </div>
                      <span className="font-black text-2xl text-gray-100" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>{step.num}</span>
                    </div>
                    <h3 className="font-bold text-[#111] text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{step.label}</h3>
                    <p className="bd text-xs">{step.desc}</p>
                  </div>
                )
              })}
            </div>

            <div className={`text-center mt-10 ${processRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".5s" } as React.CSSProperties}>
              <button onClick={tab === "org" ? handlePostProject : handleCreateProfile} className="btn-p" style={{ padding: "1rem 2.2rem" }}>
                {tab === "org" ? "Post your first gig" : "Create your profile"} <FiArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <section ref={profilesRef.ref} className="py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 ${profilesRef.inView ? "up" : "opacity-0"}`}>
              <div>
                <p className="lbl mb-3">Featured talent</p>
                <h2 className="hd text-4xl">Meet the community</h2>
                <p className="bd mt-2 text-sm max-w-xs">Pre-vetted, sector-smart, and ready for your next gig.</p>
              </div>
              <Link href="/hire" className="la">Browse all talent <FiArrowRight size={13} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {featuredProfiles.length ? featuredProfiles.slice(0, 5).map((p, i) => (
                <ProfileCard key={p.id || i} p={p} idx={i} inView={profilesRef.inView} />
              )) : (
                <p className="col-span-full rounded-2xl border border-orange-100 bg-orange-50 p-6 text-sm text-gray-600">Impactpal talent profiles will appear here as they are added.</p>
              )}
            </div>
          </div>
        </section>

        <section ref={sdgRef.ref} className="py-28 bg-[#111] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse,rgba(249,115,22,.1) 0%,transparent 70%)" }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <p className={`lbl text-orange-400 mb-5 ${sdgRef.inView ? "up" : "opacity-0"}`} style={{ "--d": "0s" } as React.CSSProperties}>SDG alignment</p>
            <h2 className={`font-black text-4xl lg:text-5xl text-white leading-tight mb-4 ${sdgRef.inView ? "up" : "opacity-0"}`} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", "--d": ".1s" } as React.CSSProperties}>
              Every gig tagged to<br /><span style={{ color: "#F97316" }}>the Global Goals.</span>
            </h2>
            <p className={`text-white/45 text-base max-w-xl mx-auto mb-14 ${sdgRef.inView ? "up" : "opacity-0"}`} style={{ fontFamily: "'DM Sans',sans-serif", "--d": ".2s" } as React.CSSProperties}>
              changeworker is built around the 17 UN Sustainable Development Goals. Tag your gigs. Match on shared purpose.
            </p>
            <div className={`flex flex-wrap justify-center gap-2.5 ${sdgRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".28s" } as React.CSSProperties}>
              {displaySdgs.map((s, i) => (
                <div key={i}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-default group transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", animationDelay: `${i * .03}s` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.background = `${s.color}18` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.1)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.04)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-white/60 text-sm font-semibold group-hover:text-white transition-colors" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.label}</span>
                  {s.count > 0 && <span className="text-white/25 text-[10px]" style={{ fontFamily: "'DM Sans',sans-serif" }}>{s.count}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* <section ref={testiRef.ref} className="py-28 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className={`text-center mb-14 ${testiRef.inView ? "up" : "opacity-0"}`}>
              <p className="lbl mb-4">What they say</p>
              <h2 className="hd text-4xl">People who get it, <span style={{ color: "#F97316" }}>love it.</span></h2>
            </div>
            <Suspense fallback={<div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />}>
              <TestCarousel inView={testiRef.inView} testimonials={testimonials} />
            </Suspense>
          </div>
        </section> */}

        <section ref={splitRef.ref} className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className={`px-10 lg:px-16 py-16 bg-[#F5F5F5] flex flex-col justify-center ${splitRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
              <span className="pill bg-orange-100 text-[#F97316] border border-orange-200 mb-6 self-start text-[11px]">
                <FiBriefcase size={10} /> For organizations
              </span>
              <h2 className="hd text-3xl lg:text-4xl mb-5">
                The skills your mission needs.<br />
                <span style={{ color: "#F97316" }}>When you need them.</span>
              </h2>
              <p className="bd text-sm mb-3 max-w-sm">
                Leading a growing nonprofit or social enterprise on a budget? You don’t have to do all the work alone. 
              </p>
              <p className="bd text-sm mb-3 max-w-sm">
                Changeworker gives you access to vetted specialists you can bring in for a project, a campaign or a crunch period, 
without adding to your payroll.
No long-term salary commitments. No overhead. 
              </p>
              <p className="bd text-sm mb-6 max-w-sm">
                Just the right person, for exactly as long as you need them. 
              </p>
              <ul className="space-y-3 mb-8">
                {["Gigs from ₦50k–₦400k+", "Instant matching on every post", "Verified profiles and reviews", "No long-term commitments"].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm text-gray-700" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <FiCheck size={10} style={{ color: "#F97316" }} />
                    </div>{t}
                  </li>
                ))}
              </ul>
              <button onClick={handlePostProject} className="btn-p self-start">Post a gig <FiArrowRight size={14} /></button>
            </div>
            <div className={`px-10 lg:px-16 py-16 bg-[#111] flex flex-col justify-center ${splitRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
              <span className="pill bg-white/10 text-white border border-white/15 mb-6 self-start text-[11px]">
                <FiUsers size={10} /> For freelancers
              </span>
              <h2 className="font-black text-3xl lg:text-4xl text-white leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Work that matters.<br /><span style={{ color: "#F97316" }}>Pay that's fair.</span>
              </h2>
              <p className="bd text-sm mb-3 max-w-sm">
Stop being invisible on platforms that weren’t built for the social impact sector.               </p>
              <p className="bd text-sm mb-3 max-w-sm">
                Changeworker puts your profile in front of the NGOs, social enterprises, social entrepreneurs and impact organizations actively looking for what you do.
              </p>
              <p className="bd text-sm mb-6 max-w-sm">
                Grow your skills through real impact work and join a community of young Africans who are building the continent’s social impact infrastructure, one project at a time. 
              </p>
              <ul className="space-y-3 mb-8">
                {["Earn ₦50k–₦200k per gig", "Work with mission-aligned orgs", "No cold-pitching or bidding wars", "Build a portfolio that means something"].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm text-white/65" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,.2)" }}>
                      <FiCheck size={10} style={{ color: "#F97316" }} />
                    </div>{t}
                  </li>
                ))}
              </ul>
              <button onClick={handleCreateProfile} className="btn-p self-start">Create your profile <FiArrowRight size={14} /></button>
            </div>
          </div>
        </section>

        <section ref={compRef.ref} className="py-28 bg-[#F5F5F5] border-y border-gray-200">
          <div className="max-w-3xl mx-auto px-6">
            <div className={`text-center mb-12 ${compRef.inView ? "up" : "opacity-0"}`}>
              <p className="lbl mb-4">Why not just use Upwork?</p>
              <h2 className="hd text-4xl">We are different by <span style={{ color: "#F97316" }}>design and impact.</span></h2>
            </div>
            <div className={`rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm ${compRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".14s" } as React.CSSProperties}>
              <div className="grid grid-cols-3 bg-[#F5F5F5] border-b border-gray-200">
                <div className="px-5 py-4" />
                <div className="px-5 py-4 text-center">
                  <span className="pill bg-[#F97316] text-white text-[8px] sm:text-[11px] whitespace-nowrap">changeworker</span>
                </div>
                <div className="px-5 py-4 text-center">
                  <span className="text-gray-400 text-sm break-words" style={{ fontFamily: "'DM Sans',sans-serif" }}>Generic platforms</span>
                </div>
              </div>
              {[
                ["Sector-specific vetting", true, false],
                ["Nonprofit budget-friendly", true, false],
                ["Impact org expertise", true, false],
                ["Nigerian payment integration", true, false],
                ["No bidding wars", true, false],
                ["10% flat commission", true, "20–30% varies"],
              ].map(([feat, cw, gen], i) => (
                <div key={i} className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                  <div className="px-5 py-4 text-sm text-gray-700" style={{ fontFamily: "'DM Sans',sans-serif" }}>{feat as string}</div>
                  <div className="px-5 py-4 flex items-center justify-center">
                    {cw === true
                      ? <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><FiCheck size={12} style={{ color: "#F97316" }} /></span>
                      : <span className="text-sm text-gray-400">{cw as string}</span>}
                  </div>
                  <div className="px-5 py-4 flex items-center justify-center">
                    {gen === false
                      ? <span className="text-gray-300 text-lg font-light">-</span>
                      : <span className="text-sm text-gray-400">{gen as string}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={faqRef.ref} className="py-28 bg-white">
          <div className="max-w-2xl mx-auto px-6">
            <div className={`text-center mb-14 ${faqRef.inView ? "up" : "opacity-0"}`}>
              <p className="lbl mb-4">FAQ</p>
              <h2 className="hd text-4xl">Questions answered</h2>
            </div>
            <div className={`${faqRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".1s" } as React.CSSProperties}>
              {FAQS.map((f, i) => <FaqItem key={i} faq={f} idx={i} inView={faqRef.inView} />)}
            </div>
          </div>
        </section>

        <section ref={ctaRef.ref} className="relative overflow-hidden py-36">
          <img src={CTA_IMG} alt="" aria-hidden className="absolute inset-0 img-cover" style={{ objectPosition: "center 40%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(10,10,10,.80)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 80%,rgba(249,115,22,.12) 0%,transparent 70%)" }} />

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <div className={`${ctaRef.inView ? "up" : "opacity-0"}`} style={{ "--d": "0s" } as React.CSSProperties}>
              <p className="lbl text-orange-400 mb-6">Ready to begin?</p>
              <h2 className="font-black text-5xl lg:text-6xl text-white leading-[1.04] mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Building Africa's workforce<br />for <span style={{ color: "#F97316" }}>social impact.</span>
              </h2>
              <p className="text-white text-lg mb-10 max-w-md mx-auto" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                Join hundreds of organizations and professionals already making it happen through changeworker.
              </p>
            </div>

            <div className={`flex flex-wrap gap-4 justify-center mb-14 ${ctaRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".16s" } as React.CSSProperties}>
              <Link href="/hire" className="btn-p" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }}>Hire talent <FiArrowRight size={16} /></Link>
              <Link href="/jobs" className="btn-o-dark" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }}>Find work</Link>
            </div>

            {/* <div className={`${ctaRef.inView ? "up" : "opacity-0"}`} style={{ "--d": ".28s" } as React.CSSProperties}>
              <p className="text-white/25 text-xs uppercase tracking-widest mb-5" style={{ fontFamily: "'DM Sans',sans-serif" }}>Get notified when new gigs drop</p>
              {!submitted ? (
                <div className="flex gap-2 max-w-sm mx-auto">
                  <div className="flex-1 relative">
                    <FiMail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                      className="w-full bg-white/8 border border-white/12 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                      style={{ fontFamily: "'DM Sans',sans-serif", background: "rgba(255,255,255,.07)" }} />
                  </div>
                  <button onClick={handleEmailSubmit} className="btn-p shrink-0" style={{ padding: ".75rem 1.2rem" }}>
                    <FiSend size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <FiCheckCircle size={16} /><span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600 }}>You're on the list! 🎉</span>
                </div>
              )}
            </div> */}
          </div>
        </section>
            <Footer />

      </div>
      <Toaster position="top-right" />
    </>
  )
}
