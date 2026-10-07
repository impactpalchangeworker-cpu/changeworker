"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import { hireCategories } from "@/data/navCategories"
import {
  FiArrowRight, FiCheck, FiCheckCircle, FiChevronDown,
  FiShield, FiZap, FiEdit3, FiUsers, FiBell, FiLayers,
  FiMessageSquare, FiTrendingUp, FiLock, FiTarget
} from "react-icons/fi"
import { TbBuildingCommunity, TbHeartHandshake } from "react-icons/tb"

/* ── hooks ── */
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

/* ── data ── */
const IMGS = {
  hero:    "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1200",
  org:     "/images/organization.png?auto=compress&cs=tinysrgb&w=900",
  talent:  "/images/talent.png?auto=compress&cs=tinysrgb&w=900",
  trust:   "/images/4.jpeg?auto=compress&cs=tinysrgb&w=900",
  cta:     "/images/work.png?auto=compress&cs=tinysrgb&w=1200",
}

const CLIENT_STEPS = [
  { num:"01", icon: FiEdit3,       title: "Post your gig",       body: "Write a brief with scope, budget, SDG focus, and skills needed. Takes about 5 minutes. The clearer your brief, the better the talent you attract." },
  { num:"02", icon: FiZap,         title: "Get matched instantly",body: "The moment your gig goes live our engine surfaces the most relevant vetted talent. Browse profiles and incoming proposals - no waiting period." },
  { num:"03", icon: FiMessageSquare,title:"Discuss & agree",      body: "Message talent, align on expectations, and finalise scope inside the workspace. Fund the workspace once you're both ready to begin." },
  { num:"04", icon: FiCheckCircle, title: "Review & complete",    body: "Talent submits deliverables through the workspace. Review, request changes if needed, and approve when satisfied. The talent then receives their work earnings." },
]

const TALENT_STEPS = [
  { num:"01", icon: FiLayers,      title: "Build your profile",   body: "Add your skills, sector experience, SDG focus areas, rates, and portfolio. A complete profile is the most important thing you can do to get matched." },
  { num:"02", icon: FiBell,        title: "Get auto-matched",     body: "When a relevant gig is posted, you appear in the client's shortlist automatically. No bidding wars, no cold pitching. You focus on the work." },
  { num:"03", icon: FiUsers,       title: "Discuss & start",      body: "The client reaches out, you discuss scope, and once agreed the client funds the workspace. You start work with a clear payment process in place." },
  { num:"04", icon: FiTrendingUp,  title: "Deliver & earn",       body: "Submit work through the workspace. Once the client approves, you receive your work earnings. Every completed gig builds your rating and reputation." },
]

const TRUST_POINTS = [
  { icon: FiLock,    title: "Project payment clarity", body: "changeworker does not hold payments in wallets for organizations or talent. Payments are direct, while workspace records help both parties stay aligned." },
  { icon: FiShield,  title: "Workspace records",     body: "All communication, submissions, milestones, and approvals are documented inside the platform workspace. A clear record protects both sides." },
  { icon: FiTarget,  title: "Dispute support",       body: "If something goes wrong, a dispute can be raised directly from the workspace. The full project history is attached - no he-said-she-said." },
  { icon: TbHeartHandshake, title: "Review & reputation", body: "After every gig both parties leave a review. Ratings are verified, permanent, and publicly visible. Reputation compounds over time for both sides." },
]

const SDGS_DISPLAY = [
  { label:"No Poverty",              color:"#E5243B" },
  { label:"Zero Hunger",             color:"#DDA63A" },
  { label:"Good Health",             color:"#4C9F38" },
  { label:"Quality Education",       color:"#C5192D" },
  { label:"Gender Equality",         color:"#FF3A21" },
  { label:"Clean Water",             color:"#26BDE2" },
  { label:"Affordable & Clean Energy",color:"#FCC30B" },
  { label:"Decent Work",             color:"#A21942" },
  { label:"Industry & Innovation",   color:"#FD6925" },
  { label:"Reduced Inequalities",    color:"#DD1367" },
  { label:"Sustainable Cities",      color:"#FD9D24" },
  { label:"Responsible Consumption", color:"#BF8B2E" },
  { label:"Climate Action",          color:"#3F7E44" },
  { label:"Life Below Water",        color:"#0A97D9" },
  { label:"Life on Land",            color:"#56C02B" },
  { label:"Peace & Justice",         color:"#00689D" },
  { label:"Partnerships",            color:"#19486A" },
]

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function HowItWorksPage() {
  const [tab, setTab] = useState<"client"|"talent">("client")
  const [openFaq, setOpenFaq] = useState<number|null>(0)

  const heroRef   = useInView(0.05)
  const stepsRef  = useInView(0.06)
  const trustRef  = useInView(0.06)
  const sdgRef    = useInView(0.06)
  const catsRef   = useInView(0.06)
  const feeRef    = useInView(0.08)
  const ctaRef    = useInView(0.08)

  const steps = tab === "client" ? CLIENT_STEPS : TALENT_STEPS

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        :root{--o:#F97316;--od:#EA580C;--ol:#FFF7ED;--bk:#111111;--off:#F5F5F5;--bd:#E8E8E8;--tx:#6B7280;--fh:'Plus Jakarta Sans',sans-serif;--fb:'DM Sans',sans-serif}
        body{font-family:var(--fb);background:white;color:var(--bk)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:var(--o);border-radius:4px}
        @keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
        @keyframes si{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
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
        .card-w{background:white;border:1.5px solid var(--bd);border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card-w:hover{border-color:#ccc;box-shadow:0 8px 28px rgba(0,0,0,.07);transform:translateY(-3px)}
        .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:11px;font-family:var(--fh);font-weight:600}
        .ic{object-fit:cover;width:100%;height:100%}
      `}</style>

      <Navbar />

      {/* ╔══════════════════════════════════╗
          HERO - full-bleed image
      ╚══════════════════════════════════╝ */}
      <section ref={heroRef.ref} className="relative overflow-hidden min-h-[88svh] flex items-end pb-0">
        <img src={IMGS.hero} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 30%" }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(170deg,rgba(10,10,10,.15) 0%,rgba(10,10,10,.7) 60%,rgba(10,10,10,.92) 100%)" }} />

        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-16">
            <div className="max-w-2xl">
              <p className={`lbl text-orange-400 mb-5 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>How it works</p>
              <h1 className={`font-black text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.02] tracking-tight mb-6 ${heroRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".14s" } as React.CSSProperties}>
                A platform built<br />to keep impact work<br /><span style={{ color:"#F97316" }}>clearer.</span>
              </h1>
              <p className={`text-white text-lg leading-relaxed mb-10 max-w-lg ${heroRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".26s" } as React.CSSProperties}>
                From finding the right fit to getting paid fairly - five steps for organizations and five for talent, built on project funding, instant matching, and SDG alignment.
              </p>

              {/* audience toggle */}
              <div className={`flex flex-wrap gap-3 mb-8 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".36s"} as React.CSSProperties}>
                <button onClick={() => setTab("client")} className="rounded-full px-5 py-2.5 text-sm font-bold transition-all"
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:tab==="client"?"#F97316":"rgba(255,255,255,.1)", color:"white", border:"1.5px solid", borderColor:tab==="client"?"#F97316":"rgba(255,255,255,.2)" }}>
                  I'm an organization
                </button>
                <button onClick={() => setTab("talent")} className="rounded-full px-5 py-2.5 text-sm font-bold transition-all"
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:tab==="talent"?"#F97316":"rgba(255,255,255,.1)", color:"white", border:"1.5px solid", borderColor:tab==="talent"?"#F97316":"rgba(255,255,255,.2)" }}>
                  I'm a freelancer
                </button>
              </div>

              <div className={`flex flex-wrap gap-4 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".46s"} as React.CSSProperties}>
                {[{I:FiZap,t:"Instant matching"},{I:FiShield,t:"Clear project payments"},{I:FiCheckCircle,t:"Verified talent"}].map(({I,t})=>(
                  <div key={t} className="flex items-center gap-2">
                    <I size={12} style={{ color:"#F97316" }} />
                    <span className="text-white/50 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* wave into white */}
          <div className="pointer-events-none" style={{ height:"72px" }}>
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white" />
            </svg>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          STEPS - tabbed
      ╚══════════════════════════════════╝ */}
      <section ref={stepsRef.ref} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14 ${stepsRef.inView?"up":"opacity-0"}`}>
            <div>
              <p className="lbl mb-3">{tab==="client"?"Organization flow":"Freelancer flow"}</p>
              <h2 className="hd text-4xl lg:text-5xl">Five steps from<br /><span style={{ color:"#F97316" }}>post to paid.</span></h2>
            </div>
            <div className="inline-flex bg-[#F5F5F5] border border-gray-200 rounded-xl p-1 gap-1 self-start sm:self-auto">
              {(["client","talent"] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:tab===t?"#F97316":"transparent", color:tab===t?"white":"#6B7280", boxShadow:tab===t?"0 2px 8px rgba(249,115,22,.3)":"none" }}>
                  {t==="client"?"Organizations":"Freelancers"}
                </button>
              ))}
            </div>
          </div>

          {/* step cards - 2 col grid with connector line */}
          <div key={tab} className="grid lg:grid-cols-2 gap-5">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className={`card p-7 flex gap-5 ${stepsRef.inView?"up":"opacity-0"}`}
                  style={{"--d":`${.08+i*.09}s`} as React.CSSProperties}>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:"#F97316" }}>
                      <Icon size={20} style={{ color:"white" }} />
                    </div>
                    {i<steps.length-1 && <div className="w-px flex-1 min-h-[24px]" style={{ background:"rgba(249,115,22,.2)" }} />}
                  </div>
                  <div className="pt-1">
                    <span className="font-black text-xs text-gray-300 mb-2 block" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.num}</span>
                    <h3 className="font-bold text-[#111] text-base mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.title}</h3>
                    <p className="bd text-sm">{s.body}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* image split below steps */}
          <div className={`mt-10 grid md:grid-cols-2 rounded-2xl overflow-hidden border border-gray-200 ${stepsRef.inView?"si":"opacity-0"}`} style={{"--d":".5s"} as React.CSSProperties}>
            <div className="relative h-56 md:h-auto overflow-hidden">
              <img src={tab==="client"?IMGS.org:IMGS.talent} alt="" className="ic" style={{ objectPosition:"center 20%" }} />
              <div className="absolute inset-0" style={{ background:"linear-gradient(to right,transparent 60%,rgba(255,255,255,.95) 100%)" }} />
            </div>
            <div className="p-8 lg:p-10 flex flex-col justify-center bg-white">
              <p className="lbl mb-4">{tab==="client"?"For organizations":"For freelancers"}</p>
              <h3 className="hd text-2xl mb-4">{tab==="client"?"Post smarter. Hire faster.":"Get matched. Get paid."}</h3>
              <p className="bd text-sm mb-6">{tab==="client"
                ? "Every gig you post is instantly visible to the most relevant vetted talent. No job boards. No generic applicants. Curated matching from the first second."
                : "Your profile does the work. The moment a relevant gig goes live, you appear in the client's shortlist automatically - no bidding, no cold outreach required."}</p>
              <Link href="/signup" className="btn-p self-start">Get started <FiArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          TRUST - dark
      ╚══════════════════════════════════╝ */}
      <section ref={trustRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(249,115,22,.09) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-14 items-center mb-16">
            <div>
              <p className={`lbl text-orange-400 mb-4 ${trustRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Built-in trust</p>
              <h2 className={`font-black text-4xl lg:text-5xl text-white leading-tight mb-6 ${trustRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                Less ambiguity.<br /><span style={{ color:"#F97316" }}>Better follow-through.</span>
              </h2>
              <p className={`text-white/50 text-base leading-relaxed max-w-md ${trustRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
                Clear project payments, verified profiles, workspace records, and dispute tools aren't extras - they're the foundation. Every gig on changeworker is structured for both parties.
              </p>
            </div>
            <div className={`relative rounded-2xl overflow-hidden h-64 lg:h-80 ${trustRef.inView?"si":"opacity-0"}`} style={{"--d":".12s"} as React.CSSProperties}>
              <img src={IMGS.trust} alt="Trust and delivery" className="ic" style={{ objectPosition:"center 25%" }} />
              <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(17,17,17,.7) 0%,transparent 60%)" }} />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3">
                  <FiShield size={14} style={{ color:"#F97316", flexShrink:0 }} />
                  <span className="text-white/80 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>Clear project funding · 0% unpaid invoices on platform</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_POINTS.map((tp,i)=>{
              const Icon = tp.icon
              return (
                <div key={i} className={`rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 ${trustRef.inView?"up":"opacity-0"}`}
                  style={{ borderColor:"rgba(255,255,255,.08)", background:"rgba(255,255,255,.04)", "--d":`${.22+i*.08}s` } as React.CSSProperties}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(249,115,22,.15)" }}>
                    <Icon size={18} style={{ color:"#F97316" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tp.title}</h3>
                    <p className="text-white/45 text-xs leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{tp.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          SDG SECTION
      ╚══════════════════════════════════╝ */}
      <section ref={sdgRef.ref} className="py-24 bg-[#F5F5F5] border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-14 items-start">
            <div>
              <p className={`lbl mb-4 ${sdgRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>SDG alignment</p>
              <h2 className={`hd text-4xl mb-5 ${sdgRef.inView?"up":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
                Every gig tagged<br />to the<br /><span style={{ color:"#F97316" }}>Global Goals.</span>
              </h2>
              <p className={`bd text-sm mb-6 max-w-sm ${sdgRef.inView?"up":"opacity-0"}`} style={{"--d":".2s"} as React.CSSProperties}>
                When you post a gig or build your profile, you tag it to the UN Sustainable Development Goals your work addresses. This shared language connects purpose to practice - instantly.
              </p>
              <div className={`card-w p-5 ${sdgRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
                <p className="lbl mb-3" style={{ fontSize:"10px" }}>How SDG tagging works</p>
                <div className="space-y-2.5">
                  {[
                    { step:"01", t:"Organization posts a gig", sub:"Tags it to Climate Action + Decent Work" },
                    { step:"02", t:"Instant matching fires",   sub:"Surfaces talent experienced in SDG 13 + 8" },
                    { step:"03", t:"Gig completed",            sub:"Both parties contributed to the global goals" },
                  ].map(({ step, t, sub }) => (
                    <div key={step} className="flex gap-3 items-start">
                      <span className="font-black text-xs text-gray-200 shrink-0 mt-0.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{step}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#111]" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</p>
                        <p className="text-xs text-gray-400" style={{ fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${sdgRef.inView?"up":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>
              <p className="bd text-xs mb-4" style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:".1em" }}>All 17 SDGs - hover to explore</p>
              <div className="flex flex-wrap gap-2">
                {SDGS_DISPLAY.map((s,i)=>(
                  <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-gray-200 cursor-default group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=s.color; (e.currentTarget as HTMLElement).style.background=`${s.color}12` }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor="#E8E8E8"; (e.currentTarget as HTMLElement).style.background="white" }}>
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background:s.color }} />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-[#111] transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          CATEGORIES
      ╚══════════════════════════════════╝ */}
      <section ref={catsRef.ref} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`mb-12 ${catsRef.inView?"up":"opacity-0"}`}>
            <p className="lbl mb-3">Talent categories</p>
            <h2 className="hd text-4xl lg:text-5xl max-w-xl">Every discipline the<br /><span style={{ color:"#F97316" }}>sector needs.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hireCategories.map((group, i) => (
              <div key={group.title} className={`card p-7 ${catsRef.inView?"up":"opacity-0"}`} style={{"--d":`${.06+i*.08}s`} as React.CSSProperties}>
                <h3 className="font-bold text-[#111] text-lg mb-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(item => (
                    <span key={item} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500"
                      style={{ fontFamily:"'DM Sans',sans-serif" }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          FEE TRANSPARENCY - dark
      ╚══════════════════════════════════╝ */}
      <section ref={feeRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse at bottom right,rgba(249,115,22,.08) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className={`lbl text-orange-400 mb-4 ${feeRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Transparent pricing</p>
              <h2 className={`font-black text-4xl lg:text-5xl text-white leading-tight mb-6 ${feeRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                Simple, honest <span style={{ color:"#F97316" }}>fees.</span>
              </h2>
              <p className={`text-white/50 text-base leading-relaxed mb-8 ${feeRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
                A flat 10% platform fee deducted from the talent's work earnings. Organizations pay exactly what they agreed - no markups, no hidden charges. The fee covers payment processing, matching, vetting, and dispute support.
              </p>
              <div className={`space-y-3 ${feeRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
                {[
                  { t:"10% from talent work earnings", sub:"Organizations pay exactly the agreed rate - nothing more." },
                  { t:"Free to register",            sub:"No subscription fee for either side." },
                  { t:"Fee funds Skills For Impact", sub:"Our 10% supports professional development in the sector." },
                ].map(({ t, sub }) => (
                  <div key={t} className="flex gap-3 items-start p-4 rounded-xl border border-white/8 bg-white/4">
                    <FiCheck size={14} style={{ color:"#F97316", flexShrink:0, marginTop:"2px" }} />
                    <div>
                      <p className="text-white/85 text-sm font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</p>
                      <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* fee calculator */}
            <div className={`${feeRef.inView?"si":"opacity-0"}`} style={{"--d":".18s"} as React.CSSProperties}>
              <FeeCalc />
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════╗
          CTA - image bg
      ╚══════════════════════════════════╝ */}
      <section ref={ctaRef.ref} className="relative overflow-hidden py-32">
        <img src={IMGS.cta} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 40%" }} />
        <div className="absolute inset-0" style={{ background:"rgba(10,10,10,.82)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse 80% 60% at 50% 80%,rgba(249,115,22,.1) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className={`lbl text-orange-400 mb-5 ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Ready?</p>
          <h2 className={`font-black text-5xl lg:text-6xl text-white leading-[1.04] mb-5 ${ctaRef.inView?"up":"opacity-0"}`}
            style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
            Post your first gig.<br /><span style={{ color:"#F97316" }}>Match in seconds.</span>
          </h2>
          <p className={`text-white text-lg mb-10 max-w-md mx-auto ${ctaRef.inView?"up":"opacity-0"}`}
            style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
            Flexible talents. Meaningful work.
          </p>
          <div className={`flex flex-wrap gap-4 justify-center ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
            <Link href="/hire" className="btn-p" style={{ padding:"1rem 2.5rem", fontSize:"1rem" }}>Post a gig <FiArrowRight size={16} /></Link>
            <Link href="/signup?type=talent" className="btn-od" style={{ padding:"1rem 2.5rem", fontSize:"1rem" }}>Find work</Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </>
  )
}

/* ── fee calculator ── */
function FeeCalc() {
  const [amount, setAmount] = useState(150000)
  const fee = Math.round(amount * 0.1)
  const receives = amount - fee
  return (
    <div className="card-w p-6" style={{ background:"#1A1A1A", border:"1.5px solid rgba(255,255,255,.1)" }}>
      <p className="lbl text-orange-400 mb-5" style={{ fontSize:"10px" }}>Fee calculator</p>
      <div className="mb-5">
        <label className="text-white/50 text-xs mb-2 block" style={{ fontFamily:"'DM Sans',sans-serif" }}>Agreed gig rate (₦)</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {[50000,100000,150000,300000].map(v=>(
            <button key={v} onClick={()=>setAmount(v)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, background:amount===v?"#F97316":"rgba(255,255,255,.06)", color:amount===v?"white":"rgba(255,255,255,.4)", border:"1px solid", borderColor:amount===v?"#F97316":"rgba(255,255,255,.1)" }}>
              ₦{v.toLocaleString()}
            </button>
          ))}
        </div>
        <input type="range" min={10000} max={500000} step={5000} value={amount}
          onChange={e=>setAmount(Number(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor:"#F97316", background:"rgba(255,255,255,.1)" }} />
      </div>
      <div className="space-y-2 border-t border-white/8 pt-4">
        <div className="flex justify-between">
          <span className="text-white/45 text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>Agreed rate</span>
          <span className="font-bold text-white text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>₦{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/45 text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>Platform fee (10%)</span>
          <span className="font-bold text-red-400 text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>− ₦{fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-3 p-4 rounded-xl" style={{ background:"#F97316" }}>
          <span className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Talent receives</span>
          <span className="text-white font-black text-xl" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>₦{receives.toLocaleString()}</span>
        </div>
        <p className="text-white/30 text-[11px] text-center pt-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>Client pays exactly ₦{amount.toLocaleString()} - no extras.</p>
      </div>
    </div>
  )
}

/* ── shared footer ── */
function PageFooter() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 pt-14 pb-10">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
                <span className="text-white font-black text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>c</span>
              </div>
              <span className="font-black text-lg text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>changeworker</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed mb-2 max-w-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>Flexible talents. Meaningful work.</p>
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
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-white/15 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>© {new Date().getFullYear()} changeworker · Impactpal Africa</p>
        </div>
      </div>
    </footer>
  )
}
