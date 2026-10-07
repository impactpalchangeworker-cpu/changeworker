"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import { fetchPlatformStats, type PlatformStats } from "@/lib/platformStats"
import { FiArrowRight, FiMapPin, FiTarget, FiCheck } from "react-icons/fi"
import { TbBuildingCommunity, TbHeartHandshake } from "react-icons/tb"
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

function useCounter(target: number, duration = 1800, start = false) {
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

/* ── images ── */
const IMGS = {
  hero:   "/images/4.jpeg",
  story1: "/images/5.jpeg?auto=compress&cs=tinysrgb&w=900",
  story2: "/images/8.jpeg?auto=compress&cs=tinysrgb&w=900",
  team1:  "/images/7.jpeg?auto=compress&cs=tinysrgb&w=500",
  team2:  "/images/8.jpeg?auto=compress&cs=tinysrgb&w=500",
  team3:  "/images/9.jpeg?auto=compress&cs=tinysrgb&w=500",
  cta:    "/images/work.png?auto=compress&cs=tinysrgb&w=1200",
}

const TEAM = [
  { name:"Chidinma Okafor", role:"Co-founder & CEO", bio:"Former Executive Director of a health NGO in Lagos. 12 years building Social impact organizations. Experienced the talent crisis firsthand and decided to solve it.", initials:"CO", location:"Lagos",  img:IMGS.team1 },
  { name:"Emeka Nwofor",    role:"Co-founder & CTO", bio:"Previously led engineering at Flutterwave. Built payment infrastructure at scale and believes technology is only useful when it solves a real human problem.", initials:"EN", location:"Lagos",  img:IMGS.team2 },
  { name:"Adaeze Nwankwo",  role:"Head of Talent & Matching", bio:"Eight years in executive search for international development organizations. Has placed hundreds of professionals in mission-driven roles across Africa.", initials:"AN", location:"Abuja",  img:IMGS.team3 },
]

const VALUES = [
  { title:"Dignity before discount", desc:"Skilled professionals should be paid what their work is worth. Resource constraints should never become an excuse for exploitation.", icon:TbHeartHandshake },
  { title:"Sector fluency",          desc:"We are not a generic freelance platform with a nonprofit label. The product is shaped by how social impact work actually operates.", icon:TbBuildingCommunity },
  { title:"Trust by design",         desc:"Verification, workspaces, approvals, reviews, and dispute tools exist to reduce friction and make good working relationships easier to build.", icon:FiTarget },
]

const MILESTONES = [
  { year:"2022", title:"The problem became impossible to ignore", desc:"The founding team kept seeing the same issue: strong impact work was slowed down by weak talent discovery and scattered delivery processes." },
  { year:"2023", title:"changeworker was formed",                desc:"The thesis: a sector-specific marketplace with stronger workflow support could solve what ad hoc networks could not." },
  { year:"2024", title:"Real teams started using the platform",  desc:"Organizations and professionals began using changeworker for discovery, conversations, project delivery, and reviews." },
  { year:"2025", title:"Product depth became the focus",         desc:"The platform kept evolving around trust, payment flow, structured workspaces, and repeatable talent relationships." },
]

function StatNum({ val, suf, label, delay, start }: { val:number; suf:string; label:string; delay:string; start:boolean }) {
  const n = useCounter(val, 1800, start)
  return (
    <div className="card-w p-6">
      <p className="font-black text-4xl text-[#111] mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{n}{suf}</p>
      <p className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
    </div>
  )
}

export default function AboutPage() {
  const [stats, setStats] = useState<PlatformStats>({ freelancers:0, clients:0, projects:0, satisfaction:98 })

  useEffect(() => {
    let active = true
    fetchPlatformStats().then(d => { if (active) setStats(d) })
    return () => { active = false }
  }, [])

  const heroRef      = useInView(0.05)
  const storyRef     = useInView(0.06)
  const statsRef     = useInView(0.08)
  const valuesRef    = useInView(0.06)
  const teamRef      = useInView(0.06)
  const milesRef     = useInView(0.06)
  const ctaRef       = useInView(0.08)

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
        .card-w{background:white;border:1.5px solid var(--bd);border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card-w:hover{border-color:#ccc;box-shadow:0 8px 28px rgba(0,0,0,.07);transform:translateY(-3px)}
        .ic{object-fit:cover;width:100%;height:100%}
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef.ref} className="relative overflow-hidden min-h-[85svh] flex items-end pb-0">
        <img src={IMGS.hero} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 30%" }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(170deg,rgba(10,10,10,.12) 0%,rgba(10,10,10,.65) 55%,rgba(10,10,10,.92) 100%)" }} />

        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-14">
            <div className="grid lg:grid-cols-2 gap-14 items-end">
              <div>
                <p className={`lbl text-orange-400 mb-5 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>About us</p>
                <h1 className={`font-black text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.02] tracking-tight mb-6 ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".14s" } as React.CSSProperties}>
                  Building better<br />infrastructure<br />for <span style={{ color:"#F97316" }}>impact work.</span>
                </h1>
                <p className={`text-white text-lg leading-relaxed max-w-md mb-8 ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'DM Sans',sans-serif", "--d":".26s" } as React.CSSProperties}>
                  changeworker exists because too many strong organizations and professionals were still relying on scattered networks and slow coordination for work that matters.
                </p>
                <div className={`flex flex-wrap gap-3 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".36s"} as React.CSSProperties}>
                  <Link href="/how-it-works" className="btn-p" style={{ padding:"1rem 2rem" }}>See how it works <FiArrowRight size={14} /></Link>
                  <Link href="/contact" className="btn-p" style={{ padding:"1rem 2rem" }}>Contact the team</Link>
                </div>
              </div>

              {/* three quick belief cards */}
              <div className={`flex flex-col gap-3 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".32s"} as React.CSSProperties}>
                {[
                  { t:"What we believe", b:"The impact sector deserves better tools for finding talent, structuring delivery, and building trust over time.", accent:true },
                  { t:"How we work",     b:"Platform-first, sector-specific, and built by people who have lived the problem they're solving.", accent:false },
                  { t:"Who we serve",    b:"Nigerian Social impact organizations, social enterprises, and mission-driven professionals who want structured, fairly-paid project work.", accent:false },
                ].map(({ t, b, accent }) => (
                  <div key={t} className="rounded-xl border p-4"
                    style={{ background:accent?"rgba(249,115,22,.12)":"rgba(255,255,255,.06)", borderColor:accent?"rgba(249,115,22,.3)":"rgba(255,255,255,.1)" }}>
                    <p className="text-white font-semibold text-sm mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</p>
                    <p className="text-white text-xs leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{b}</p>
                  </div>
                ))}
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

      {/* ── STATS ── */}
      {/* <section ref={statsRef.ref} className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className={`mb-10 ${statsRef.inView?"up":"opacity-0"}`}>
            <p className="lbl mb-3">Where we are today</p>
            <h2 className="hd text-4xl max-w-xl">The numbers are only<br /><span style={{ color:"#F97316" }}>one part of the story.</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsRef.inView && <>
              <StatNum val={stats.freelancers} suf="+" label="Impact professionals on the platform" delay=".05s" start />
              <StatNum val={stats.clients} suf="+" label="Organizations discovering talent" delay=".13s" start />
              <StatNum val={stats.projects} suf="+" label="Gigs created on the platform" delay=".21s" start />
              <StatNum val={stats.satisfaction} suf="%" label="Platform satisfaction benchmark" delay=".29s" start />
            </>}
          </div>
        </div>
      </section> */}

      {/* ── STORY - dark ── */}
      <section ref={storyRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse at top right,rgba(249,115,22,.07) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-14 items-center mb-14">
            <div>
              <p className={`lbl text-orange-400 mb-4 ${storyRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>How it started</p>
              <h2 className={`font-black text-4xl lg:text-5xl text-white leading-tight mb-6 ${storyRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                The talent existed.<br />The matching<br /><span style={{ color:"#F97316" }}>infrastructure didn't.</span>
              </h2>
              <div className={`space-y-4 text-white/50 text-base leading-relaxed ${storyRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
                <p>Nigerian Social impact organizations, NGOs, social enterprises, and mission-driven businesses often need strong professional support for defined windows of work. But the tools available were built for generic full-time hiring or chaotic marketplace bidding.</p>
                <p>changeworker was built to create a calmer path: structured gigs, stronger-fit profile discovery, better communication, and documented delivery once real work begins.</p>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 ${storyRef.inView?"si":"opacity-0"}`} style={{"--d":".12s"} as React.CSSProperties}>
              <div className="col-span-2 rounded-2xl overflow-hidden h-48">
                <img src={IMGS.story1} alt="" className="ic" style={{ objectPosition:"center 25%" }} />
              </div>
              <div className="rounded-2xl overflow-hidden h-40">
                <img src={IMGS.story2} alt="" className="ic" />
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-5 flex flex-col justify-between h-40">
                <p className="lbl text-orange-400 text-[10px]">What we improve</p>
                <div className="space-y-2.5">
                  {["Cleaner discovery","Fair compensation","Structured delivery"].map(t=>(
                    <div key={t} className="flex items-center gap-2">
                      <FiCheck size={11} style={{ color:"#F97316" }} />
                      <span className="text-white/55 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* what the product improves */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { t:"Reduce friction",         b:"From posting to discovery to discussion to delivery - every step is designed to be faster and clearer." },
              { t:"Build real reputation",   b:"Professionals build verified track records through completed gigs. Reputation compounds over time." },
              { t:"Give organizations confidence", b:"Hiring for project-based work should feel structured, not risky. Clear agreements, project funding, and vetting make it that way." },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border border-white/8 bg-white/4 p-6 ${storyRef.inView?"up":"opacity-0"}`}
                style={{ "--d":`${.32+i*.08}s` } as React.CSSProperties}>
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center mb-4">
                  <FiTarget size={15} style={{ color:"#F97316" }} />
                </div>
                <h3 className="font-bold text-white text-sm mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{item.t}</h3>
                <p className="text-white/40 text-xs leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section ref={valuesRef.ref} className="py-24 bg-[#F5F5F5] border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`mb-12 ${valuesRef.inView?"up":"opacity-0"}`}>
            <p className="lbl mb-3">What we value</p>
            <h2 className="hd text-4xl lg:text-5xl max-w-xl">A few convictions<br />we take <span style={{ color:"#F97316" }}>seriously.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v,i)=>{
              const Icon = v.icon
              return (
                <div key={i} className={`card p-7 ${valuesRef.inView?"up":"opacity-0"}`} style={{"--d":`${.08+i*.1}s`} as React.CSSProperties}>
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-5">
                    <Icon size={22} style={{ color:"#F97316" }} />
                  </div>
                  <h3 className="font-bold text-[#111] text-lg mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{v.title}</h3>
                  <p className="bd text-sm">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      {/* <section ref={teamRef.ref} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`mb-12 ${teamRef.inView?"up":"opacity-0"}`}>
            <p className="lbl mb-3">The team</p>
            <h2 className="hd text-4xl lg:text-5xl max-w-xl">A small team with product,<br />delivery, and <span style={{ color:"#F97316" }}>sector context.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TEAM.map((m,i)=>(
              <div key={i} className={`card-w overflow-hidden ${teamRef.inView?"up":"opacity-0"}`} style={{"--d":`${.08+i*.1}s`} as React.CSSProperties}>
                <div className="relative h-52 overflow-hidden">
                  <img src={m.img} alt={m.name} className="ic group-hover:scale-105 transition-transform duration-700" style={{ objectPosition:"center 20%" }} />
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(0,0,0,.4) 0%,transparent 60%)" }} />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1.5"
                      style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      <FiMapPin size={9} /> {m.location}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-sm text-[#F97316]"
                      style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.initials}</div>
                    <div>
                      <p className="font-bold text-[#111] text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.name}</p>
                      <p className="text-[#F97316] text-xs font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.role}</p>
                    </div>
                  </div>
                  <p className="bd text-sm">{m.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── MILESTONES - dark ── */}
      <section ref={milesRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse at bottom left,rgba(249,115,22,.07) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`mb-12 ${milesRef.inView?"up":"opacity-0"}`}>
            <p className="lbl text-orange-400 mb-3">Milestones</p>
            <h2 className="font-black text-4xl lg:text-5xl text-white leading-tight max-w-xl"
              style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              A steady build, rather<br />than a <span style={{ color:"#F97316" }}>big launch story.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {MILESTONES.map((m,i)=>(
              <div key={i} className={`rounded-2xl border border-white/8 bg-white/4 p-7 hover:border-white/15 transition-colors ${milesRef.inView?"up":"opacity-0"}`}
                style={{"--d":`${.08+i*.08}s`} as React.CSSProperties}>
                <span className="lbl text-orange-400 text-[10px] mb-3 block">{m.year}</span>
                <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef.ref} className="relative overflow-hidden py-32">
        <img src={IMGS.cta} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 40%" }} />
        <div className="absolute inset-0" style={{ background:"rgba(10,10,10,.82)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse 80% 60% at 50% 80%,rgba(249,115,22,.1) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <p className={`lbl text-orange-400 mb-5 ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Want to explore the platform?</p>
              <h2 className={`font-black text-4xl lg:text-5xl text-white leading-tight mb-4 ${ctaRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                See how the product<br />works <span style={{ color:"#F97316" }}>in practice.</span>
              </h2>
              <p className={`text-white/45 text-base leading-relaxed max-w-md ${ctaRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
                If you want the product view instead of the company story, the workflow guide is the right next place to go.
              </p>
            </div>
            <div className={`flex flex-col sm:flex-row lg:flex-col gap-3 ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":".28s"} as React.CSSProperties}>
              <Link href="/how-it-works" className="btn-p" style={{ padding:"1rem 2.2rem" }}>How it works <FiArrowRight size={15} /></Link>
              <Link href="/signup" className="btn-od" style={{ padding:"1rem 2.2rem" }}>Get started</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
     
    </>
  )
}
