"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import { FiArrowRight, FiChevronDown, FiSearch, FiMessageSquare, FiMail } from "react-icons/fi"
import Footer from "@/components/layout/Footer"

function useInView(t = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: t })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [t])
  return { ref, inView: v }
}

const IMGS = {
  hero:  "/images/question.png?auto=compress&cs=tinysrgb&w=1200",
  dark:  "/images/7.jpeg?auto=compress&cs=tinysrgb&w=900",
}

const CATEGORIES = [
  { id:"general",       label:"General" },
  { id:"organizations", label:"For organizations" },
  { id:"freelancers",   label:"For freelancers" },
  { id:"payments",      label:"Payments & fees" },
  { id:"trust",         label:"Trust & safety" },
]

const FAQS = {
  general: [
    { q:"What is changeworker?", a:"changeworker is Nigeria's talent marketplace for the social impact sector. It connects Social impact organizations, NGOs, social enterprises, and mission-driven teams with skilled independent professionals for project-based gigs." },
    { q:"Who is changeworker built for?", a:"Two groups: organizations that need project-based professional support, and freelancers who want serious impact work with better structure and fairer compensation." },
    { q:"Is changeworker free to use?", a:"Registration is completely free for both organizations and talent. changeworker earns a flat 10% platform fee, deducted from the talent's work earnings after final delivery is approved." },
    { q:"Does changeworker only serve Nigerian organizations?", a:"changeworker is primarily built for Nigerian Social impact organizations, social enterprises, and impact organizations. Talent on the platform are also Nigeria-based, with Naira pricing and local payment processing." },
    { q:"What makes changeworker different from Upwork or Fiverr?", a:"Sector-specific vetting, SDG-aligned matching, Naira-native pricing, no bidding wars, clear project payments, and a platform built by people who have worked inside Nigerian civil society." },
  ],
  organizations: [
    { q:"How do I post a gig?", a:"Create your account, open the dashboard, and complete a gig brief with the scope, budget, timeline, SDG tags, and skills required. The clearer your brief, the better the talent surfaced. Takes about 5 minutes." },
    { q:"How fast will I see talent after posting?", a:"Matching is instant - talent appear in your shortlist the moment your gig goes live. No manual review delay, no waiting period." },
    { q:"Can I choose which freelancer I want?", a:"Yes. changeworker surfaces the most relevant vetted profiles, but the final hiring decision is always yours. You review profiles, read reviews, and select who to work with." },
    { q:"Can I rehire someone I've worked with before?", a:"Yes. You can bookmark talent profiles inside the platform and return to them whenever you have a new gig, without starting a fresh search." },
    { q:"Do I pay before or after the work is done?", a:"You fund the workspace when you're ready to begin. The talent receives their work earnings after you approve the final deliverables." },
    { q:"What types of gigs can I post?", a:"Any project-based professional work relevant to the impact sector: grant writing, M&E design, communications, project management, data analysis, research, fundraising strategy, capacity building, and more." },
  ],
  freelancers: [
    { q:"How do I join as a freelancer?", a:"Create your account, complete your profile with skills, sector experience, rates, SDG focus areas, and portfolio samples, and you'll start appearing in relevant gig matches." },
    { q:"Do I have to bid or apply for gigs?", a:"No. changeworker auto-matches you to relevant gigs when they go live. The client sees your profile in their shortlist and reaches out. You focus on the work, not the hustle of finding it." },
    { q:"Can I set my own rates?", a:"Yes. You set your rate on your profile and in each engagement. Clients see that information when reviewing your profile." },
    { q:"When do I receive payment?", a:"You receive your work earnings once the client approves your final deliverables. Payment timing depends on bank processing." },
    { q:"What is the 12-month exclusivity clause?", a:"After completing a gig through changeworker, talent and organizations are asked not to work together outside the platform for 12 months. This protects the ecosystem that makes matching and project support possible." },
    { q:"How do I build my reputation on the platform?", a:"Every completed gig generates a review from the client. Reviews are verified, permanent, and publicly visible on your profile. Consistent quality unlocks higher-value gig opportunities over time." },
  ],
  payments: [
    { q:"How does payment work?", a:"Organizations fund the workspace at the start of an engagement. Once the client approves the final deliverables, the talent receives their work earnings." },
    { q:"Does changeworker hold my money?", a:"No. changeworker does not hold payments in wallets for organizations or talent. Workspace payments are direct, and talent receive work earnings after final delivery is approved." },
    { q:"What is the platform commission?", a:"A flat 10% platform fee deducted from the talent's work earnings. The fee covers payment processing, instant matching, identity vetting, dispute resolution, platform support, and funds the Skills For Impact training program." },
    { q:"Does the organization pay any extra fee?", a:"No. Organizations pay exactly the agreed gig rate - no surcharge, no markup, no platform fee added on their side." },
    { q:"What currencies are supported?", a:"Naira (₦) only. This is a deliberate design decision to serve Nigerian organizations and professionals natively." },
    { q:"How long does it take to receive earnings?", a:"After a client approves the final deliverables, work earnings are sent to your verified Nigerian bank account. Timing depends on bank processing." },
  ],
  trust: [
    { q:"How are freelancers vetted?", a:"Graduates of the Skills For Impact development program and verified registered users can join as talent. Every profile is manually reviewed before going live. We verify identity and check sector experience." },
    { q:"What protections do organizations have?", a:"Project agreements and workspace records document communication, submissions, milestones, and approvals. Dispute tools are available if something needs formal resolution." },
    { q:"What protections do freelancers have?", a:"The agreed project funding and workspace records provide a clear basis for completing work and receiving payment after client approval. Your submission history and the client's approval trail are documented." },
    { q:"How do disputes work?", a:"Either party can raise a dispute directly from the workspace. The full project record - communication, submissions, approvals - is attached automatically. Our team mediates and works toward a documented resolution." },
    { q:"Is my data protected?", a:"Yes. changeworker complies with the Nigeria Data Protection Act 2023 (NDPA). We never sell your data. Your information is used only to operate and improve the platform." },
  ],
} as const

function FaqItem({ q, a, defaultOpen=false }: { q:string; a:string; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button className="w-full flex items-center justify-between py-5 text-left gap-6 group" onClick={()=>setOpen(o=>!o)}>
        <span className="font-semibold text-[#111] text-sm md:text-base" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${open?"bg-[#F97316] border-[#F97316]":"border-gray-200 group-hover:border-gray-400"}`}
          style={{ transform:open?"rotate(180deg)":"none" }}>
          <FiChevronDown size={13} style={{ color:open?"white":"#9CA3AF" }} />
        </span>
      </button>
      <div style={{ maxHeight:open?"300px":"0", transition:"max-height .4s cubic-bezier(.4,0,.2,1)", overflow:"hidden" }}>
        <p className="pb-5 text-gray-500 text-sm leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{a}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [active, setActive] = useState<keyof typeof FAQS>("general")
  const [query, setQuery]   = useState("")

  const heroRef    = useInView(0.05)
  const browseRef  = useInView(0.08)
  const answersRef = useInView(0.06)
  const ctaRef     = useInView(0.08)

  const filtered = useMemo(() => {
    const list = FAQS[active]
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
  }, [active, query])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        :root{--o:#F97316;--od:#EA580C;--bk:#111111;--off:#F5F5F5;--bd:#E8E8E8;--tx:#6B7280;--fh:'Plus Jakarta Sans',sans-serif;--fb:'DM Sans',sans-serif}
        body{font-family:var(--fb);background:white;color:var(--bk)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:var(--o);border-radius:4px}
        @keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
        @keyframes si{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        .up{opacity:0;animation:up .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .si{opacity:0;animation:si .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .lbl{font-family:var(--fh);font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
        .hd{font-family:var(--fh);font-weight:900;line-height:1.08;color:var(--bk)}
        .bd{font-family:var(--fb);color:var(--tx);line-height:1.75}
        .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--o);color:white;font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:none;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;text-decoration:none}
        .btn-p:hover{background:var(--od);transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,.28)}
        .btn-o{display:inline-flex;align-items:center;gap:8px;background:white;color:var(--bk);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid var(--bd);cursor:pointer;transition:border-color .2s,transform .15s;text-decoration:none}
        .btn-o:hover{border-color:#999;transform:translateY(-1px)}
        .btn-od{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.6);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid rgba(255,255,255,.18);cursor:pointer;transition:border-color .2s,color .2s;text-decoration:none}
        .btn-od:hover{border-color:rgba(255,255,255,.5);color:white}
        .card{background:#F3F4F6;border:1.5px solid transparent;border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card:hover{border-color:var(--bd);box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-3px)}
        .card-w{background:white;border:1.5px solid var(--bd);border-radius:18px;transition:border-color .25s,box-shadow .25s}
        .ic{object-fit:cover;width:100%;height:100%}
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef.ref} className="relative overflow-hidden min-h-[80svh] flex items-end pb-0">
        <img src={IMGS.hero} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 30%" }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(170deg,rgba(10,10,10,.1) 0%,rgba(10,10,10,.65) 55%,rgba(10,10,10,.92) 100%)" }} />

        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-14">
            <div className="grid lg:grid-cols-2 gap-14 items-end">
              {/* left: headline */}
              <div>
                <p className={`lbl text-orange-400 mb-5 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>FAQ</p>
                <h1 className={`font-black text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.02] tracking-tight mb-6 ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".14s" } as React.CSSProperties}>
                  Straight answers<br />for talent<br /><span style={{ color:"#F97316" }}>and organizations.</span>
                </h1>
                <p className={`text-white/60 text-lg leading-relaxed max-w-md mb-8 ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'DM Sans',sans-serif", "--d":".26s" } as React.CSSProperties}>
                  We kept this page practical. No marketplace jargon - just honest answers about how changeworker works.
                </p>
              </div>

              {/* right: search + category chips */}
              <div className={`${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
                {/* search box */}
                <div className="flex items-center gap-3 bg-white rounded-xl border border-white/20 px-4 py-3.5 mb-4 shadow-lg">
                  <FiSearch size={15} className="text-gray-400 shrink-0" />
                  <input value={query} onChange={e=>setQuery(e.target.value)}
                    placeholder="Search questions…"
                    className="flex-1 bg-transparent text-sm text-[#111] outline-none placeholder-gray-400"
                    style={{ fontFamily:"'DM Sans',sans-serif" }} />
                  {query && <button onClick={()=>setQuery("")} className="text-gray-300 hover:text-gray-500 text-xs shrink-0" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Clear</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c=>(
                    <button key={c.id} onClick={()=>setActive(c.id as keyof typeof FAQS)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                      style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:active===c.id?"#F97316":"rgba(255,255,255,.12)", color:"white", border:"1px solid", borderColor:active===c.id?"#F97316":"rgba(255,255,255,.2)" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none" style={{ height:"72px" }}>
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── BROWSE BY TOPIC ── */}
      <section ref={browseRef.ref} className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`flex items-center justify-between flex-wrap gap-4 mb-6 ${browseRef.inView?"up":"opacity-0"}`}>
            <div>
              <p className="lbl mb-1">Browse by topic</p>
              <p className="bd text-sm">Filter by the part of the platform you care about.</p>
            </div>
            {query && <span className="text-xs text-gray-400" style={{ fontFamily:"'DM Sans',sans-serif" }}>Searching: "{query}"</span>}
          </div>
          <div className={`flex flex-wrap gap-2 ${browseRef.inView?"up":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setActive(c.id as keyof typeof FAQS)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:active===c.id?"#F97316":"#F3F4F6", color:active===c.id?"white":"#6B7280", border:"1px solid", borderColor:active===c.id?"#F97316":"transparent" }}>
                {c.label} <span className="opacity-50 ml-1">({FAQS[c.id as keyof typeof FAQS].length})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANSWERS - dark ── */}
      <section ref={answersRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(249,115,22,.08) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_1.8fr] gap-14 items-start">

            {/* left: label + image */}
            <div>
              <p className={`lbl text-orange-400 mb-4 ${answersRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
                {CATEGORIES.find(c=>c.id===active)?.label}
              </p>
              <h2 className={`font-black text-3xl lg:text-4xl text-white leading-tight mb-6 ${answersRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                Questions grouped by what matters to <span style={{ color:"#F97316" }}>you.</span>
              </h2>
              <div className={`relative rounded-2xl overflow-hidden h-52 mb-6 ${answersRef.inView?"si":"opacity-0"}`} style={{"--d":".2s"} as React.CSSProperties}>
                <img src={IMGS.dark} alt="" className="ic" style={{ objectPosition:"center 20%" }} />
                <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(17,17,17,.6) 0%,transparent 60%)" }} />
              </div>
              <div className={`rounded-xl border border-white/8 bg-white/4 p-4 ${answersRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
                <p className="text-white/40 text-xs mb-3" style={{ fontFamily:"'DM Sans',sans-serif" }}>Can't find what you need?</p>
                <Link href="/contact" className="text-[#F97316] text-sm font-semibold flex items-center gap-2 hover:gap-3 transition-all no-underline"
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <FiMessageSquare size={13} /> Ask the team <FiArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* right: FAQ items */}
            <div className={`card-w p-6 lg:p-8 ${answersRef.inView?"si":"opacity-0"}`} style={{"--d":".12s"} as React.CSSProperties}>
              {filtered.length > 0
                ? filtered.map((item, i) => <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i===0 && !query.trim()} />)
                : (
                  <div className="py-8 text-center">
                    <FiSearch size={28} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>No results for "{query}" in this category.</p>
                    <button onClick={()=>setQuery("")} className="mt-3 text-[#F97316] text-sm font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Clear search</button>
                  </div>
                )}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef.ref} className="py-24 bg-[#F5F5F5] border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className={`rounded-2xl overflow-hidden bg-white border border-orange-100 shadow-sm ${ctaRef.inView?"si":"opacity-0"}`} style={{"--d":"0s", background:"linear-gradient(135deg,#FFF7ED 0%,white 50%,#FFF1E7 100%)"} as React.CSSProperties}>
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center p-8 lg:p-10">
              <div>
                <p className="lbl mb-4">Ready to start?</p>
                <h2 className="hd text-3xl lg:text-4xl mb-3">
                  If the workflow makes sense,<br />the next move is simple.
                </h2>
                <p className="bd text-sm max-w-lg">
                  Create an account to post your first gig or build your talent profile. Or read more of the platform docs if you want a few more details first.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link href="/signup" className="btn-p">Get started <FiArrowRight size={15} /></Link>
                <Link href="/how-it-works" className="btn-o">How it works</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      

      {/* <footer className="bg-[#0A0A0A] border-t border-white/5 pt-14 pb-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
                  <span className="text-white font-black text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>c</span>
                </div>
                <span className="font-black text-lg text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>changeworker</span>
              </div>
              <p className="text-white/30 text-sm mb-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>Flexible talents. Meaningful work.</p>
              <p className="text-white/15 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>A product of Impactpal Africa</p>
            </div>
            {[
              { title:"Platform", links:[["How It Works","/how-it-works"],["FAQ","/faq"]] },
              { title:"Company",  links:[["About","/about"],["Contact","/contact"]] },
              { title:"Legal",    links:[["Terms","/terms"],["Privacy","/privacy"]] },
            ].map(col=>(
              <div key={col.title}>
                <p className="text-white/20 text-[10px] uppercase tracking-[.2em] mb-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(([l,h])=>(
                    <li key={l}><Link href={h} className="text-white/35 hover:text-white text-sm transition-colors no-underline" style={{ fontFamily:"'DM Sans',sans-serif" }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6">
            <p className="text-white/15 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>© {new Date().getFullYear()} changeworker · Impactpal Africa</p>
          </div>
        </div>
      </footer> */}
    </>
  )
}
