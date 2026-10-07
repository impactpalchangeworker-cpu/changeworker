"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import {
  FiArrowRight, FiCheckCircle, FiMail, FiMapPin,
  FiMessageSquare, FiSend, FiChevronDown, FiPhone
} from "react-icons/fi"
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
  hero:  "https://images.pexels.com/photos/3182766/pexels-photo-3182766.jpeg?auto=compress&cs=tinysrgb&w=1200",
  side:  "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=900",
}

const REASONS = [
  "I'm an organization looking to hire",
  "I'm a freelancer looking for work",
  "I need help with my account",
  "Partnership or collaboration",
  "Press or media enquiry",
  "Something else",
]

const QUICK_FAQ = [
  { q: "How quickly will I get a response?", a: "We aim to reply within 1–2 business days. Include as much context as you can so we can be genuinely helpful on first response." },
  { q: "Can I request a demo?", a: "Yes. Choose the organization or partnership option in the form and mention you want a walkthrough. We'll schedule one." },
  { q: "Can I register interest from outside Nigeria?", a: "Yes. Tell us where you're writing from and what you'd like to use changeworker for. We read everything." },
]

export default function ContactPage() {
  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [reason, setReason]       = useState(REASONS[0])
  const [message, setMessage]     = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  const heroRef  = useInView(0.05)
  const formRef  = useInView(0.06)
  const faqRef   = useInView(0.06)
  const ctaRef   = useInView(0.08)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim())    e.name    = "Name is required"
    if (!email.trim())   e.email   = "Email is required"
    if (!message.trim()) e.message = "Please write a message"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setSubmitted(true)
  }

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
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
        @keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        .up{opacity:0;animation:up .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .si{opacity:0;animation:si .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .shake{animation:shake .4s ease}
        .pop{animation:pop .45s cubic-bezier(.34,1.56,.64,1) both}
        .lbl{font-family:var(--fh);font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
        .hd{font-family:var(--fh);font-weight:900;line-height:1.08;color:var(--bk)}
        .bd{font-family:var(--fb);color:var(--tx);line-height:1.75}
        .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--o);color:white;font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:none;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s}
        .btn-p:hover{background:var(--od);transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,.28)}
        .btn-o{display:inline-flex;align-items:center;gap:8px;background:white;color:var(--bk);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid var(--bd);cursor:pointer;transition:border-color .2s,transform .15s;text-decoration:none}
        .btn-o:hover{border-color:#999;transform:translateY(-1px)}
        .btn-od{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.6);font-family:var(--fh);font-weight:700;font-size:.875rem;padding:.875rem 1.875rem;border-radius:10px;border:1.5px solid rgba(255,255,255,.18);cursor:pointer;transition:border-color .2s,color .2s;text-decoration:none}
        .btn-od:hover{border-color:rgba(255,255,255,.5);color:white}
        .card{background:#F3F4F6;border:1.5px solid transparent;border-radius:18px;transition:border-color .25s,box-shadow .25s,transform .3s}
        .card:hover{border-color:var(--bd);box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-3px)}
        .card-w{background:white;border:1.5px solid var(--bd);border-radius:18px;transition:border-color .25s,box-shadow .25s}
        .input{width:100%;background:#F5F5F5;border:1.5px solid transparent;border-radius:10px;padding:.8rem 1rem;font-family:var(--fb);font-size:.875rem;color:var(--bk);outline:none;transition:border-color .2s,background .2s}
        .input:focus{border-color:var(--o);background:white}
        .input::placeholder{color:#B0B0B0}
        .input-err{border-color:#EF4444!important;background:white!important}
        .ic{object-fit:cover;width:100%;height:100%}
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef.ref} className="relative overflow-hidden min-h-[75svh] flex items-end pb-0">
        <img src={IMGS.hero} alt="" aria-hidden className="absolute inset-0 ic" style={{ objectPosition:"center 35%" }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(170deg,rgba(10,10,10,.1) 0%,rgba(10,10,10,.6) 50%,rgba(10,10,10,.92) 100%)" }} />

        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-32 pb-14">
            <div className="grid lg:grid-cols-2 gap-14 items-end">
              <div>
                <p className={`lbl text-orange-400 mb-5 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>Contact</p>
                <h1 className={`font-black text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.02] tracking-tight mb-6 ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".14s" } as React.CSSProperties}>
                  A simple place<br />to ask, clarify,<br /><span style={{ color:"#F97316" }}>or reach out.</span>
                </h1>
                <p className={`text-white/60 text-lg leading-relaxed max-w-md ${heroRef.inView?"up":"opacity-0"}`}
                  style={{ fontFamily:"'DM Sans',sans-serif", "--d":".26s" } as React.CSSProperties}>
                  Whether you want to hire, join as talent, request a demo, or ask a support question - this page should make the next step obvious.
                </p>
              </div>

              {/* contact chips */}
              <div className={`flex flex-col gap-3 ${heroRef.inView?"up":"opacity-0"}`} style={{"--d":".32s"} as React.CSSProperties}>
                {[
                { icon:FiMail,    label:"General",      value:"hello@changeworker.ng",       desc:"Questions, demos, platform enquiries" },
                { icon:FiMail,    label:"Support",      value:"support@changeworker.ng",     desc:"Account issues needing follow-up" },
                { icon:FiMail,    label:"Operations",   value:"operations@changeworker.ng",  desc:"Platform operations and workflow questions" },
                { icon:FiMail,    label:"Partnerships", value:"partnership@changeworker.ng", desc:"Collaborations, demos, and partnerships" },
                { icon:FiMail,    label:"Content",      value:"content@changeworker.ng",     desc:"Blog, editorial, and copy requests" },
                { icon:FiMail,    label:"Events",       value:"events@changeworker.ng",      desc:"Events, community, and activations" },
                { icon:FiMail,    label:"Tech",         value:"tech@changeworker.ng",        desc:"Bug reports and platform issues" },
                { icon:FiMail,    label:"Talent",       value:"talent@changeworker.ng",      desc:"Talent onboarding and profile questions" },
                { icon:FiMail,    label:"Finance",      value:"finance@changeworker.ng",     desc:"Billing, payouts, and payment questions" },
                { icon:FiMapPin,  label:"Location", value:"Lagos & Abuja, Nigeria",   desc:"Nigeria-focused platform" },
              ].map(({ icon:Icon, label, value, desc }) => (
                  <div key={label} className="flex items-center gap-3.5 rounded-xl p-4"
                    style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background:"rgba(249,115,22,.2)" }}>
                      <Icon size={15} style={{ color:"#F97316" }} />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>{label}</p>
                      <p className="text-white/85 text-sm font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</p>
                      <p className="text-white/35 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{desc}</p>
                    </div>
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

      {/* ── FORM + SIDEBAR ── */}
      <section ref={formRef.ref} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-12">

            {/* FORM */}
            <div>
              <div className={`mb-8 ${formRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
                <p className="lbl mb-3">Send a note</p>
                <h2 className="hd text-3xl lg:text-4xl mb-2">Tell us what you need.<br /><span style={{ color:"#F97316" }}>Keep it specific.</span></h2>
                <p className="bd text-sm">The more context you include, the easier it is to respond usefully on the first reply.</p>
              </div>

              <div className={`card-w p-7 lg:p-8 ${formRef.inView?"si":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
                {!submitted ? (
                  <div className="space-y-5">
                    {/* name */}
                    <div>
                      <label className="block text-sm font-bold text-[#111] mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Your name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
                        className={`input ${errors.name ? "input-err shake" : ""}`} />
                      {errors.name && <p className="text-red-500 text-xs mt-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>{errors.name}</p>}
                    </div>

                    {/* email */}
                    <div>
                      <label className="block text-sm font-bold text-[#111] mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Email address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                        className={`input ${errors.email ? "input-err" : ""}`} />
                      {errors.email && <p className="text-red-500 text-xs mt-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>{errors.email}</p>}
                    </div>

                    {/* reason */}
                    <div>
                      <label className="block text-sm font-bold text-[#111] mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Reason for getting in touch</label>
                      <div className="relative">
                        <select value={reason} onChange={e => setReason(e.target.value)} className="input appearance-none pr-10">
                          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* message */}
                    <div>
                      <label className="block text-sm font-bold text-[#111] mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        Message
                        <span className="text-gray-400 font-normal ml-2">({message.length}/800)</span>
                      </label>
                      <textarea value={message} onChange={e => { if (e.target.value.length <= 800) setMessage(e.target.value) }}
                        rows={6} placeholder="Tell us what you're trying to do, what's unclear, or what kind of help you need."
                        className={`input resize-none ${errors.message ? "input-err" : ""}`} style={{ paddingTop:"0.8rem", paddingBottom:"0.8rem" }} />
                      {errors.message && <p className="text-red-500 text-xs mt-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>{errors.message}</p>}
                    </div>

                    <button onClick={handleSubmit} className="btn-p">
                      Send message <FiSend size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="pop w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                      <FiCheckCircle size={28} style={{ color:"#10B981" }} />
                    </div>
                    <h3 className="font-black text-xl text-[#111] mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Message sent!</h3>
                    <p className="bd text-sm mb-6 max-w-xs mx-auto">Thanks, {name.split(" ")[0]}. We'll get back to you at {email} within 1–2 business days.</p>
                    <button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); setErrors({}) }}
                      className="btn-o text-sm" style={{ padding:".7rem 1.5rem" }}>
                      Send another message
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className={`flex flex-col gap-5 ${formRef.inView?"up":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>

              {/* image */}
              <div className="relative rounded-2xl overflow-hidden h-48 lg:h-56">
                <img src={IMGS.side} alt="" className="ic" style={{ objectPosition:"center 30%" }} />
                <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 60%)" }} />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                    style={{ background:"rgba(249,115,22,.85)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Nigeria's impact talent marketplace
                  </span>
                </div>
              </div>

              {/* contact routes */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FiMail size={17} style={{ color:"#F97316" }} />
                  </div>
                  <div>
                    <p className="font-bold text-[#111] text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Best contact routes</p>
                    <p className="bd text-xs">Use the right path for the right question</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label:"General",      value:"hello@changeworker.ng" },
                    { label:"Support",      value:"support@changeworker.ng" },
                    { label:"Operations",   value:"operations@changeworker.ng" },
                    { label:"Partnerships", value:"partnership@changeworker.ng" },
                    { label:"Content",      value:"content@changeworker.ng" },
                    { label:"Events",       value:"events@changeworker.ng" },
                    { label:"Tech",         value:"tech@changeworker.ng" },
                    { label:"Talent",       value:"talent@changeworker.ng" },
                    { label:"Finance",      value:"finance@changeworker.ng" },
                ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3.5 py-2.5">
                      <span className="text-gray-400 text-xs font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</span>
                      <a href={`mailto:${value}`} className="text-xs text-[#111] hover:text-[#F97316] transition-colors font-semibold"
                        style={{ fontFamily:"'DM Sans',sans-serif" }}>{value}</a>
                    </div>
                  ))}
                </div>
              </div>

              {/* quick FAQ mini */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FiMessageSquare size={16} style={{ color:"#F97316" }} />
                  </div>
                  <p className="font-bold text-[#111] text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Quick answers</p>
                </div>
                <div className="space-y-3">
                  {QUICK_FAQ.map(({ q, a }) => (
                    <div key={q} className="rounded-xl bg-white border border-gray-200 p-4">
                      <p className="font-semibold text-[#111] text-xs mb-1.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{q}</p>
                      <p className="bd text-xs leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── DARK LOCATION / INFO ── */}
      <section ref={faqRef.ref} className="py-24 bg-[#111] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] pointer-events-none"
          style={{ background:"radial-gradient(ellipse at top right,rgba(249,115,22,.07) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className={`lbl text-orange-400 mb-4 ${faqRef.inView?"up":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>Where we operate</p>
              <h2 className={`font-black text-3xl lg:text-4xl text-white leading-tight mb-5 ${faqRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", "--d":".1s" } as React.CSSProperties}>
                Nigeria-focused,<br /><span style={{ color:"#F97316" }}>open to conversation.</span>
              </h2>
              <p className={`text-white/50 text-base leading-relaxed mb-8 max-w-xl ${faqRef.inView?"up":"opacity-0"}`}
                style={{ fontFamily:"'DM Sans',sans-serif", "--d":".2s" } as React.CSSProperties}>
                changeworker is currently focused on Nigeria - Naira pricing, local payment processing, and a team that understands Nigerian civil society. If you want to use the platform from another market, write to us and tell us what you have in mind.
              </p>
              <div className={`flex flex-wrap gap-4 ${faqRef.inView?"up":"opacity-0"}`} style={{"--d":".28s"} as React.CSSProperties}>
                {[
                  { icon:FiMapPin,  t:"Lagos HQ",              sub:"Primary operations" },
                  { icon:FiMapPin,  t:"Abuja",                 sub:"Satellite presence" },
                  { icon:FiMail,    t:"hello@changeworker.ng", sub:"Best first contact" },
                  { icon:FiMail,    t:"support@changeworker.ng", sub:"Support follow-up" },
                  { icon:FiMail,    t:"operations@changeworker.ng", sub:"Platform operations" },
                ].map(({ icon:Icon, t, sub }) => (
                  <div key={t} className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)" }}>
                    <Icon size={14} style={{ color:"#F97316", flexShrink:0, marginTop:"2px" }} />
                    <div>
                      <p className="text-white/80 text-sm font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</p>
                      <p className="text-white/35 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${faqRef.inView?"up":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-6 h-full flex flex-col justify-between">
                <div>
                  <p className="lbl text-orange-400 mb-4" style={{ fontSize:"10px" }}>Impactpal Africa</p>
                  <p className="text-white/55 text-sm leading-relaxed mb-6" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                    changeworker is a product of Impactpal Africa, a company building tools and programs for Nigeria's social impact sector.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <p className="text-white/25 text-xs uppercase tracking-wider mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Quick links</p>
                  {[["About us","/about"],["How it works","/how-it-works"],["FAQ","/faq"]].map(([l,h])=>(
                    <Link key={l} href={h} className="flex items-center justify-between text-sm text-white/45 hover:text-orange-400 transition-colors no-underline"
                      style={{ fontFamily:"'DM Sans',sans-serif" }}>
                      {l} <FiArrowRight size={11} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef.ref} className="py-20 bg-[#F5F5F5] border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className={`rounded-2xl overflow-hidden border border-orange-100 shadow-sm ${ctaRef.inView?"si":"opacity-0"}`}
            style={{ background:"linear-gradient(135deg,#FFF7ED 0%,white 50%,#FFF1E7 100%)" }}>
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center p-8 lg:p-10">
              <div>
                <p className="lbl mb-3">Ready to get started?</p>
                <h2 className="hd text-3xl lg:text-4xl mb-3">
                  Don't just read about it -<br /><span style={{ color:"#F97316" }}>use the platform.</span>
                </h2>
                <p className="bd text-sm max-w-lg">
                  Create an account and post your first gig, or build your talent profile. Free to register for everyone.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link href="/hire" className="btn-p">Post a gig <FiArrowRight size={14} /></Link>
                <Link href="/signup?type=talent" className="btn-o">Join as talent</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

<Footer />
      
    </>
  )
}
