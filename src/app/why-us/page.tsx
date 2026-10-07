"use client"

import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import { useEffect, useRef, useState } from "react"
import { whyUsLinks } from "@/data/navCategories"
import { slugify } from "@/lib/navSlug"
import {
  FiArrowRight, FiCheckCircle, FiStar, FiZap, FiShield,
  FiBook, FiTrendingUp, FiRepeat
} from "react-icons/fi"
import { TbBuildingCommunity, TbHeartHandshake } from "react-icons/tb"
import { RiTeamLine, RiShieldCheckLine } from "react-icons/ri"
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
  hero:  "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
  mid:   "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=900",
  cta:   "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1200",
}

const CARD_META = [
  { icon:FiStar,           color:"#F97316", tag:"Social proof",   stat:"200+ orgs",  statLabel:"served",              bullet:["Real project outcomes","Verified client stories","Impact metrics included"] },
  { icon:TbBuildingCommunity,color:"#6366F1", tag:"Client guide",  stat:"4 steps",    statLabel:"to get started",      bullet:["Role selection guide","Scope & agreement tips","Secure funding flow"] },
  { icon:FiStar,           color:"#10B981", tag:"Community trust",stat:"98%",        statLabel:"satisfaction rate",    bullet:["Verified mutual reviews","Outcome-focused feedback","Reputation building"] },
  { icon:RiTeamLine,       color:"#EC4899", tag:"Talent guide",   stat:"Instant",    statLabel:"matching on post",     bullet:["Profile optimisation tips","Proposal best practices","Secure payout guide"] },
  { icon:FiBook,           color:"#F59E0B", tag:"Resources",      stat:"Free",       statLabel:"access always",        bullet:["Hiring playbooks","Proposal templates","Payment & fee guides"] },
]

const TRUST_PILLARS = [
  { icon:FiShield,         color:"#F97316", title:"Clear project payments",      desc:"Clients fund agreed projects before work begins. Talent are paid after deliverables are approved." },
  { icon:RiShieldCheckLine,color:"#111111", title:"Verified talent profiles",    desc:"Every freelancer is personally vetted - identity, skills, and sector track record confirmed." },
  { icon:FiZap,            color:"#F97316", title:"Instant matching",            desc:"The moment a gig is posted, our engine surfaces the most relevant talent automatically." },
  { icon:TbHeartHandshake, color:"#111111", title:"Fair pay enforced",           desc:"We set minimum rate floors. 'For the mission' is never a substitute for fair professional pay." },
]

const STATS = [
  { v:"₦45M+", l:"In gig payments facilitated",    sub:"Across 180+ completed engagements",     color:"#F97316" },
  { v:"0%",    l:"Unpaid invoices on the platform",sub:"Clear project payments on every gig",     color:"#111111" },
  { v:"98%",   l:"Project satisfaction rate",       sub:"From verified post-gig reviews",         color:"#F97316" },
]

export default function WhyUsLanding() {
  const heroRef  = useInView(0.05)
  const trustRef = useInView(0.07)
  const cardsRef = useInView(0.05)
  const statsRef = useInView(0.08)
  const ctaRef   = useInView(0.08)

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
        @keyframes ab{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
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
        .card:hover{border-color:var(--bd);box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-4px)}
        .card-w{background:white;border:1.5px solid var(--bd);border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card-w:hover{border-color:#ccc;box-shadow:0 8px 28px rgba(0,0,0,.07);transform:translateY(-4px)}
        .why-card{background:#F3F4F6;border:1.5px solid transparent;border-radius:18px;transition:border-color .25s,box-shadow .3s,transform .35s cubic-bezier(.22,1,.36,1)}
        .why-card:hover{border-color:var(--bd);box-shadow:0 16px 44px rgba(0,0,0,.09);transform:translateY(-5px)}
        .why-card:hover .card-arrow{animation:ab .5s ease infinite}
        .ic{object-fit:cover;width:100%;height:100%}
        strong{font-weight:700;color:#111}
      `}</style>

      <Navbar />

      {/* ── HERO - full-bleed image ── */}
      <section ref={heroRef.ref} className="relative overflow-hidden min-h-[80svh] flex items-end pb-0">
        <img src={IMGS.hero} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 30%" }}/>
        <div className="absolute inset-0" style={{ background:"linear-gradient(170deg,rgba(10,10,10,.1) 0%,rgba(10,10,10,.65) 55%,rgba(10,10,10,.92) 100%)" }}/>

        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-14">
            <div className="max-w-2xl">
              <p className={`lbl text-orange-400 mb-5 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>Why changeworker</p>
              <h1 className={`font-black text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.02] tracking-tight mb-6 ${heroRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".14s" } as React.CSSProperties}>
                Everything you need<br />to do impact work<br /><span style={{ color:"#F97316" }}>right.</span>
              </h1>
              <p className={`text-white/60 text-lg leading-relaxed max-w-lg mb-9 ${heroRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".26s" } as React.CSSProperties}>
                From finding the right talent to securing payment - we've built the infrastructure that Nigeria's social sector was missing.
              </p>
              <div className={`flex flex-wrap gap-4 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".36s"} as React.CSSProperties}>
                {[{v:"200+",l:"Organizations"},{v:"500+",l:"Vetted talent"},{v:"98%",l:"Satisfaction"},{v:"₦0",l:"Unpaid invoices"}].map(({ v, l }) => (
                  <div key={l} className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                    style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.18)" }}>
                    <span className="font-black text-sm text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{v}</span>
                    <span className="text-white/45 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none" style={{ height:"72px" }}>
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── TRUST PILLARS - white ── */}
      <section ref={trustRef.ref} className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className={`lbl mb-7 ${trustRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Our foundation</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_PILLARS.map(({ icon:Icon, color, title, desc }, i) => (
              <div key={i} className={`card p-6 flex flex-col gap-4 ${trustRef.inView?"up":"opacity-0"}`}
                style={{"--d":`${.06+i*.08}s`} as React.CSSProperties}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${color}12` }}>
                  <Icon size={18} style={{ color }}/>
                </div>
                <div>
                  <p className="font-bold text-[#111] text-sm mb-1.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</p>
                  <p className="bd text-xs">{desc}</p>
                </div>
                <div className="mt-auto h-0.5 rounded-full" style={{ background:`${color}35` }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CARDS - five why-us links ── */}
      <section ref={cardsRef.ref} className="py-16 pb-24 bg-[#F5F5F5] border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className={`text-center mb-12 ${cardsRef.inView?"up":"opacity-0"}`}>
            <p className="lbl mb-3">Explore further</p>
            <h2 className="hd text-4xl lg:text-5xl">Five reasons to <span style={{ color:"#F97316" }}>choose us.</span></h2>
          </div>

          {/* featured - success stories - dark image card */}
          <div className={`mb-5 ${cardsRef.inView?"up":"opacity-0"}`} style={{"--d":".08s"} as React.CSSProperties}>
            <Link href={`/why-us/${slugify(whyUsLinks[0].title)}`}
              className="why-card rounded-2xl overflow-hidden relative group flex flex-col lg:flex-row block" style={{ background:"#111" }}>
              {/* left: text */}
              <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:w-[60%]">
                <div className="flex items-center gap-3 mb-auto">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background:"rgba(249,115,22,.2)", color:"#FB923C", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {CARD_META[0].tag}
                  </span>
                  <span className="text-white/25 text-[10px]" style={{ fontFamily:"'DM Sans',sans-serif" }}>Featured</span>
                </div>
                <div className="mt-10">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{CARD_META[0].statLabel}</p>
                  <p className="font-black text-4xl mb-4" style={{ color:"#F97316", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{CARD_META[0].stat}</p>
                  <h3 className="font-black text-2xl lg:text-3xl text-white leading-tight mb-3 group-hover:text-orange-100 transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{whyUsLinks[0].title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-md" style={{ fontFamily:"'DM Sans',sans-serif" }}>{whyUsLinks[0].description}</p>
                  <div className="flex flex-wrap gap-2">
                    {CARD_META[0].bullet.map(b => (
                      <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", fontFamily:"'DM Sans',sans-serif" }}>
                        <FiCheckCircle size={9} style={{ color:"#F97316" }}/>{b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* right: image */}
              <div className="relative lg:w-[40%] min-h-[200px] overflow-hidden">
                <img src={IMGS.mid} alt="" className="ic" style={{ objectPosition:"center 25%" }}/>
                <div className="absolute inset-0" style={{ background:"linear-gradient(to left,transparent 30%,#111 100%)" }}/>
                <div className="absolute bottom-5 right-5">
                  <span className="flex items-center gap-2 text-white/50 text-sm font-bold card-arrow group-hover:text-orange-300 transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Read stories <FiArrowRight size={13}/>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* 2×2 grid */}
          <div className="grid sm:grid-cols-2 gap-5">
            {whyUsLinks.slice(1).map((link, i) => {
              const meta = CARD_META[i+1]
              const Icon = meta.icon
              return (
                <Link key={link.title} href={`/why-us/${slugify(link.title)}`}
                  className={`why-card overflow-hidden group block ${cardsRef.inView?"up":"opacity-0"}`}
                  style={{"--d":`${.16+i*.09}s`} as React.CSSProperties}>
                  <div className="h-1" style={{ background:`linear-gradient(90deg,${meta.color},${meta.color}00)` }}/>
                  <div className="p-7 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:`${meta.color}12` }}>
                        <Icon size={20} style={{ color:meta.color }}/>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background:`${meta.color}10`, color:meta.color, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{meta.tag}</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{meta.statLabel}</p>
                      <p className="font-black text-2xl" style={{ color:meta.color, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{meta.stat}</p>
                    </div>
                    <h3 className="font-black text-[#111] text-xl mb-2 group-hover:text-gray-700 transition-colors leading-tight" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{link.title}</h3>
                    <p className="bd text-sm mb-5 flex-1">{link.description}</p>
                    <div className="space-y-1.5 mb-5">
                      {meta.bullet.map(b => (
                        <div key={b} className="flex items-center gap-2 text-xs text-gray-500" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                          <FiCheckCircle size={10} style={{ color:meta.color, flexShrink:0 }}/>{b}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
                      <span className="font-bold text-xs" style={{ color:meta.color, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Read more</span>
                      <span className="w-7 h-7 rounded-full border flex items-center justify-center transition-all card-arrow" style={{ borderColor:`${meta.color}30` }}>
                        <FiArrowRight size={11} style={{ color:meta.color }}/>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── STATS - dark ── */}
      <section ref={statsRef.ref} className="py-20 bg-[#111] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(249,115,22,.09) 0%,transparent 70%)" }}/>
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
          <div className={`grid sm:grid-cols-3 gap-10 ${statsRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
            {STATS.map(({ v, l, sub, color }) => (
              <div key={l} className="text-center">
                <p className="font-black text-4xl lg:text-5xl mb-2" style={{ color, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{v}</p>
                <p className="font-bold text-white text-sm mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l}</p>
                <p className="text-white/35 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA - image bg ── */}
      <section ref={ctaRef.ref} className="relative overflow-hidden py-32">
        <img src={IMGS.cta} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 40%" }}/>
        <div className="absolute inset-0" style={{ background:"rgba(10,10,10,.82)" }}/>
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse 80% 60% at 50% 80%,rgba(249,115,22,.1) 0%,transparent 70%)" }}/>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className={`lbl text-orange-400 mb-5 ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Convinced?</p>
          <h2 className={`font-black text-5xl lg:text-6xl text-white leading-[1.04] mb-5 ${ctaRef.inView?"up":"opacity-0"}`}
            style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
            Ready to work<br /><span style={{ color:"#F97316" }}>with purpose?</span>
          </h2>
          <p className={`text-white/45 text-lg mb-10 max-w-md mx-auto ${ctaRef.inView?"up":"opacity-0"}`}
            style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
            Flexible talents. Meaningful work.
          </p>
          <div className={`flex flex-wrap gap-4 justify-center ${ctaRef.inView?"up":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
            <Link href="/hire" className="btn-p" style={{ padding:"1rem 2.5rem", fontSize:"1rem" }}>Hire talent <FiArrowRight size={16}/></Link>
            <Link href="/jobs" className="btn-od" style={{ padding:"1rem 2.5rem", fontSize:"1rem" }}>Find work</Link>
          </div>
        </div>
      </section>

     <Footer />
    </>
  )
}





