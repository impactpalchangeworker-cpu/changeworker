"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import {
  FiArrowUp, FiShield, FiUsers, FiDatabase, FiLock, FiGlobe,
  FiRefreshCw, FiMail, FiFileText, FiEye, FiChevronRight,
  FiCheckCircle, FiCopy, FiExternalLink, FiAlertTriangle,
  FiTrash2, FiEdit3, FiDownload, FiToggleRight, FiServer,
  FiWifi, FiSmartphone, FiKey
} from "react-icons/fi"
import { MdFingerprint, MdPrivacyTip, MdOutlinePolicy } from "react-icons/md"
import { TbCookie, TbUserShield, TbWorldWww } from "react-icons/tb"
import { RiShieldCheckLine, RiUserHeartLine } from "react-icons/ri"
import Footer from "@/components/layout/Footer"

/* ── hooks ── */
function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => { const h = () => setY(window.scrollY); window.addEventListener("scroll", h, { passive:true }); return () => window.removeEventListener("scroll",h) }, [])
  return y
}
function useReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const calc = () => {
      const el = document.documentElement
      const scroller = document.scrollingElement || el
      const s = scroller.scrollTop || document.body.scrollTop || 0
      const t = el.scrollHeight - el.clientHeight
      setP(t > 0 ? Math.min((s / t) * 100, 100) : 0)
    }
    const h = () => requestAnimationFrame(calc)
    calc()
    window.addEventListener("scroll", h, { passive: true })
    window.addEventListener("resize", h)
    return () => {
      window.removeEventListener("scroll", h)
      window.removeEventListener("resize", h)
    }
  }, [])
  return p
}
function useActiveSection(ids: string[]) {
  const [a, setA] = useState(ids[0])
  useEffect(() => {
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setA(e.target.id) }), { rootMargin:"-20% 0px -70% 0px", threshold:0 })
    ids.forEach(id => { const el=document.getElementById(id); if(el) o.observe(el) })
    return () => o.disconnect()
  }, [ids])
  return a
}

/* ── data ── */
const SECTIONS = [
  { id:"overview",    label:"Overview",              icon:MdOutlinePolicy    },
  { id:"collect",     label:"Data We Collect",       icon:FiDatabase         },
  { id:"how-collect", label:"How We Collect",        icon:FiWifi             },
  { id:"use",         label:"How We Use Data",       icon:FiToggleRight      },
  { id:"sharing",     label:"Sharing & Disclosure",  icon:FiUsers            },
  { id:"cookies",     label:"Cookies",               icon:TbCookie           },
  { id:"retention",   label:"Retention",             icon:FiServer           },
  { id:"security",    label:"Security",              icon:FiLock             },
  { id:"rights",      label:"Your Rights",           icon:TbUserShield       },
  { id:"children",    label:"Children's Privacy",    icon:RiUserHeartLine    },
  { id:"transfers",   label:"Int'l Transfers",       icon:FiGlobe            },
  { id:"changes",     label:"Policy Changes",        icon:FiRefreshCw        },
  { id:"contact",     label:"Contact & DPO",         icon:FiMail             },
]
const IDS = SECTIONS.map(s=>s.id)

const DATA_TYPES = [
  { category:"Identity",      color:"#F97316", icon:MdFingerprint, items:["Full legal name","Government-issued ID (NIN, Passport, Driver's Licence)","Profile photograph","Date of birth","Gender (optional)"] },
  { category:"Contact",       color:"#6366F1", icon:FiMail,        items:["Email address","Phone number","Physical address","State/city of residence"] },
  { category:"Professional",  color:"#10B981", icon:FiFileText,    items:["Work experience & history","Educational qualifications","Skills & certifications","Portfolio samples","Freelancer rates & availability"] },
  { category:"Organisational",color:"#EC4899", icon:FiUsers,       items:["Organisation name and type","CAC registration number","Website & social profiles","Mission statement","Contact information"] },
  { category:"Transaction",   color:"#F59E0B", icon:FiDatabase,    items:["Project postings","Hire decisions","Payment amounts","Project payment records","Commission invoices"] },
  { category:"Technical",     color:"#3B82F6", icon:FiServer,      items:["IP address","Browser type & version","Operating system","Cookie identifiers","Session data"] },
  { category:"Communications",color:"#8B5CF6", icon:FiSmartphone,  items:["In-platform messages","Support tickets","Email with changeworker","Feedback & review text"] },
  { category:"Usage",         color:"#14B8A6", icon:FiEye,         items:["Search queries","Pages viewed","Feature interactions","Error logs","General diagnostics"] },
]

const USER_RIGHTS = [
  { icon:FiEye,        title:"Access",       desc:"Request a copy of all personal data we hold about you.", color:"#F97316" },
  { icon:FiEdit3,      title:"Rectification",desc:"Correct inaccurate or incomplete data - many details can be updated in your dashboard.",  color:"#6366F1" },
  { icon:FiTrash2,     title:"Erasure",      desc:"Request deletion where we have no legal basis for continued processing.", color:"#EC4899" },
  { icon:FiLock,       title:"Restriction",  desc:"Ask us to restrict processing while you contest accuracy or during a dispute.",          color:"#10B981" },
  { icon:FiDownload,   title:"Portability",  desc:"Receive your data in a structured, machine-readable format.",                           color:"#F59E0B" },
  { icon:FiToggleRight,title:"Object",       desc:"Object to processing based on legitimate interests, including profiling.",              color:"#3B82F6" },
  { icon:FiKey,        title:"Withdraw",     desc:"Withdraw consent at any time where processing is consent-based.",                       color:"#8B5CF6" },
  { icon:FiAlertTriangle,title:"Complain",   desc:"Lodge a complaint with the Nigeria Data Protection Commission (NDPC).",                color:"#EF4444" },
]

const COOKIES = [
  { name:"cw_session",    type:"Essential",  duration:"Session",  purpose:"Maintains your logged-in state" },
  { name:"cw_csrf",       type:"Essential",  duration:"Session",  purpose:"Prevents cross-site request forgery" },
  { name:"cw_prefs",      type:"Functional", duration:"1 year",   purpose:"Stores display preferences" },
  { name:"cw_onboarding", type:"Functional", duration:"30 days",  purpose:"Tracks onboarding steps completed" },
  { name:"Payment provider cookies", type:"Payment", duration:"Session", purpose:"Secure payment processing" },
  { name:"cw_usage",      type:"Performance",duration:"90 days",  purpose:"Performance diagnostics" },
]

const CTYPES: Record<string,string> = { Essential:"#10B981", Functional:"#6366F1", Payment:"#EC4899", Performance:"#3B82F6" }

/* ── sub-components ── */
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 text-sm leading-[1.88] mb-4" style={{ fontFamily:"'DM Sans',sans-serif" }}>{children}</p>
}
function SH({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-[#111] text-base mt-7 mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</h3>
}
function Hl({ color="orange", children }: { color?:"orange"|"emerald"|"amber"|"red"|"indigo"; children:React.ReactNode }) {
  const m = { orange:{bg:"bg-orange-50",bd:"border-orange-200",tx:"text-orange-800",dot:"bg-orange-400"}, indigo:{bg:"bg-indigo-50",bd:"border-indigo-200",tx:"text-indigo-800",dot:"bg-indigo-400"}, emerald:{bg:"bg-emerald-50",bd:"border-emerald-200",tx:"text-emerald-800",dot:"bg-emerald-400"}, amber:{bg:"bg-amber-50",bd:"border-amber-200",tx:"text-amber-800",dot:"bg-amber-400"}, red:{bg:"bg-red-50",bd:"border-red-200",tx:"text-red-800",dot:"bg-red-400"} }
  const c = m[color]
  return (
    <div className={`${c.bg} border ${c.bd} rounded-xl p-5 my-5 flex gap-3`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`}/>
      <p className={`${c.tx} text-sm leading-relaxed`} style={{ fontFamily:"'DM Sans',sans-serif" }}>{children}</p>
    </div>
  )
}
function CL({ items }: { items:string[] }) {
  return (
    <ul className="space-y-2.5 my-4">
      {items.map((item,i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>
          <span className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
            <FiChevronRight size={10} style={{ color:"#F97316" }}/>
          </span>{item}
        </li>
      ))}
    </ul>
  )
}
function Div() { return <div className="my-10 border-t border-gray-200" /> }
function SHead({ id,num,icon:Icon,title }: { id:string;num:string;icon:React.ElementType;title:string }) {
  return (
    <div id={id} className="flex items-start gap-4 mb-6 pt-2 scroll-mt-28">
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <Icon size={17} style={{ color:"#F97316" }}/>
        </div>
        <span className="text-[10px] text-orange-300 font-bold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{num}</span>
      </div>
      <h2 className="font-black text-2xl text-[#111] leading-tight pt-1.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</h2>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function PrivacyPage() {
  const scrollY  = useScrollY()
  const progress = useReadingProgress()
  const active   = useActiveSection(IDS)
  const [tocOpen, setTocOpen] = useState(false)

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" }) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        :root{--o:#F97316;--od:#EA580C;--bk:#111111;--bd:#E8E8E8;--fh:'Plus Jakarta Sans',sans-serif;--fb:'DM Sans',sans-serif}
        body{font-family:var(--fb);background:white;color:var(--bk)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:var(--o);border-radius:4px}
        @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .entry{animation:up .6s cubic-bezier(.22,1,.36,1) both}
        .lbl{font-family:var(--fh);font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
        .hov-tr{transition:all .2s ease}
        .nav-act{background:rgba(249,115,22,.07);border-color:rgba(249,115,22,.22)!important}
        .nav-act span{color:#EA580C}
        .dc{transition:transform .25s,box-shadow .25s}
        .dc:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.08)}
        strong{font-weight:700;color:#111}
      `}</style>

      {/* progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
        <div className="h-full bg-[#F97316] transition-all duration-100" style={{ width:`${progress}%` }}/>
      </div>

      <div className="bg-white text-[#111] overflow-x-hidden min-h-screen">
        <Navbar />

        {/* ── HERO - clean gradient, no image ── */}
        <div className="relative border-b border-gray-100 pt-28 pb-16 bg-white">
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="entry inline-flex w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 items-center justify-center mb-7" style={{ animationDelay:".05s" }}>
              <FiShield size={24} style={{ color:"#F97316" }}/>
            </div>
            <h1 className="entry font-black text-5xl lg:text-6xl text-[#111] leading-[.95] tracking-tight mb-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", animationDelay:".12s" }}>
              Privacy Policy
            </h1>
            <p className="entry text-gray-500 text-lg mb-9 max-w-xl mx-auto" style={{ fontFamily:"'DM Sans',sans-serif", animationDelay:".22s" }}>
              How changeworker handles your data - written plainly.
            </p>
            <div className="entry flex flex-wrap justify-center gap-3" style={{ animationDelay:".32s" }}>
              {[
                { label:"Effective", value:"April 1, 2026" },
                { label:"Updated",   value:"April 2026" },
                { label:"Framework", value:"NDPA 2023 Compliant" },
                { label:"Version",   value:"1.1" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 bg-white border border-orange-100 rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-gray-400 text-xs" style={{ fontFamily:"'DM Sans',sans-serif" }}>{label}:</span>
                  <span className="text-[#111] text-xs font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* summary banner */}
        <div className="bg-orange-50 border-y border-orange-100">
          <div className="max-w-4xl mx-auto px-6 py-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <FiCheckCircle size={15} style={{ color:"#F97316" }}/>
            </div>
            <p className="text-orange-800 text-sm leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>
              <strong>The short version:</strong> We only collect what we need to run changeworker. We <strong>never sell your data</strong>. You have full rights to access, correct, or delete your information. We comply with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Questions? Email <strong>operations@changeworker.ng</strong>.
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 pt-5">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[.22em] text-gray-400" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Reading progress</div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-[#F97316] transition-all duration-200" style={{ width:`${progress}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTocOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
              >
                Contents
                <FiChevronRight size={14} style={{ transform: tocOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
            </div>
          </div>
          {tocOpen ? (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <nav className="grid gap-1">
                {SECTIONS.map(({ id, label, icon:Icon }) => {
                  const on = active === id
                  return (
                    <button key={id} onClick={() => { scrollTo(id); setTocOpen(false) }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left hov-tr ${on ? "nav-act border-orange-200" : "border-transparent hover:bg-gray-50"}`}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors" style={{ background:on?"#F97316":"#D1D5DB" }}/>
                      <Icon size={12} style={{ color:on?"#F97316":"#9CA3AF", flexShrink:0 }}/>
                      <span className="text-xs font-medium transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:on?"#EA580C":"#6B7280" }}>{label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          ) : null}
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="grid lg:grid-cols-[240px_1fr] gap-12">

            {/* sidebar */}
            <aside className="hidden lg:block self-start">
              <div className="sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-[.22em] mb-4 px-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Contents</p>
                <nav className="flex flex-col gap-0.5">
                  {SECTIONS.map(({ id, label, icon:Icon }) => {
                    const on = active===id
                    return (
                      <button key={id} onClick={() => scrollTo(id)}
                        className={`nav-act-wrap flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left hov-tr ${on?"nav-act border-orange-200":"border-transparent hover:bg-gray-50"}`}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors" style={{ background:on?"#F97316":"#D1D5DB" }}/>
                        <Icon size={12} style={{ color:on?"#F97316":"#9CA3AF", flexShrink:0 }}/>
                        <span className="text-xs font-medium transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:on?"#EA580C":"#6B7280" }}>{label}</span>
                      </button>
                    )
                  })}
                </nav>
                <div className="mt-8 px-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Progress</span>
                    <span className="text-[10px] text-[#F97316] font-bold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F97316] transition-all duration-200" style={{ width:`${progress}%` }}/>
                  </div>
                </div>
                <div className="mt-6 px-2 space-y-2">
                  <a href="mailto:operations@changeworker.ng" className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#F97316] transition-colors" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                    <FiMail size={11}/> operations@changeworker.ng
                  </a>
                </div>
              </div>
            </aside>

            {/* main */}
            <main className="min-w-0">

              {/* 1 */}
              <SHead id="overview" num="01" icon={MdOutlinePolicy} title="Overview & Commitment"/>
              <P>This Privacy Policy explains how <strong>Impactpal Africa</strong>, operator of changeworker, collects, uses, stores, shares, and protects your personal data when you use our services at changeworker.ng.</P>
              <Hl color="orange">changeworker is compliant with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Our designated Data Protection Officer (DPO) can be reached at <strong>privacy@changeworker.ng</strong>.</Hl>
              <P>By using changeworker, you acknowledge that you have read and understood this Policy. If you do not agree with our practices, please discontinue use and contact us to request data deletion.</P>
              <Div/>

              {/* 2 */}
              <SHead id="collect" num="02" icon={FiDatabase} title="Data We Collect"/>
              <P>We collect different categories of data depending on how you use changeworker:</P>
              <div className="grid sm:grid-cols-2 gap-4 my-6">
                {DATA_TYPES.map((d,i) => { const Icon=d.icon; return (
                  <div key={i} className="dc rounded-2xl border border-gray-100 bg-[#F3F4F6] p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${d.color}15` }}>
                        <Icon size={16} style={{ color:d.color }}/>
                      </div>
                      <h3 className="font-bold text-[#111] text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{d.category}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {d.items.map((item,j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background:d.color }}/>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )})}
              </div>
              <Hl color="emerald">We apply <strong>data minimisation</strong> - we only collect what is strictly necessary. We do not collect sensitive data such as biometric data, health information, or political opinions.</Hl>
              <Div/>

              {/* 3 */}
              <SHead id="how-collect" num="03" icon={FiWifi} title="How We Collect Your Data"/>
              <SH>Direct Collection</SH>
              <P>Data you actively provide when you create an account, post a gig, make payments, send messages, submit verification documents, or complete feedback forms.</P>
              <SH>Automated Collection</SH>
              <P>Log data, device data, cookie data, and usage patterns collected automatically when you use the platform (see Section 6 for full cookie details).</P>
              <SH>Third-Party Sources</SH>
              <P>Transaction data from our payment provider, general usage diagnostics, and reviews submitted about your account by other users.</P>
              <Div/>

              {/* 4 */}
              <SHead id="use" num="04" icon={FiToggleRight} title="How We Use Your Data"/>
              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm my-6 overflow-x-auto">
                <div className="grid grid-cols-3 bg-[#F5F5F5] border-b border-gray-100 px-5 py-3 min-w-[520px]">
                  {["Purpose","Data Used","Legal Basis"].map(h => <span key={h} className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{h}</span>)}
                </div>
                {[
                  ["Account creation","Identity, Contact","Contract"],
                  ["Talent matching","Professional, Usage","Contract"],
                  ["Payment processing","Transaction, Identity","Contract"],
                  ["Identity verification","Identity, Organisational","Legal obligation"],
                  ["Security & fraud prevention","Technical, Usage","Legitimate interest"],
                  ["Customer support","Communications, Transaction","Contract"],
                  ["Platform analytics","Usage, Technical","Legitimate interest"],
                  ["Marketing (opt-in)","Contact, Usage","Consent"],
                  ["Legal compliance","All categories","Legal obligation"],
                ].map(([p,d,b],i) => (
                  <div key={i} className={`grid grid-cols-3 border-b border-gray-50 px-5 py-3.5 text-xs min-w-[520px] ${i%2===0?"bg-white":"bg-[#FAFAFA]"}`}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#374151" }}>{p}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#6B7280" }}>{d}</span>
                    <span className="font-semibold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:b==="Contract"?"#6366F1":b==="Consent"?"#10B981":"#F59E0B" }}>{b}</span>
                  </div>
                ))}
              </div>
              <Div/>

              {/* 5 */}
              <SHead id="sharing" num="05" icon={FiUsers} title="Sharing & Disclosure"/>
              <P><strong>We do not sell, rent, or trade your personal data.</strong> We share data only in limited circumstances: with other platform users (profile information necessary for matching), with service providers for payment processing and infrastructure under strict data processing agreements, for legal obligations, and in the event of a business transfer.</P>
              <Hl color="indigo">In the event of a merger or acquisition, we will notify you and provide an opportunity to delete your account before any transfer of data.</Hl>
              <Div/>

              {/* 6 */}
              <SHead id="cookies" num="06" icon={TbCookie} title="Cookies & Tracking"/>
              <P>changeworker uses cookies to operate the platform, remember your preferences, and understand usage. Here is every cookie we use:</P>
              <div className="overflow-x-auto my-6">
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm min-w-[520px]">
                  <div className="grid grid-cols-4 bg-[#F5F5F5] border-b border-gray-100 px-5 py-3">
                    {["Name","Type","Duration","Purpose"].map(h=><span key={h} className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{h}</span>)}
                  </div>
                  {COOKIES.map((row,i)=>(
                    <div key={i} className={`grid grid-cols-4 px-5 py-3.5 border-b border-gray-50 text-xs ${i%2===0?"bg-white":"bg-[#FAFAFA]"}`}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#374151" }}>{row.name}</span>
                      <span className="font-semibold px-2 py-0.5 rounded-full self-start text-[10px]" style={{ background:`${CTYPES[row.type]}15`, color:CTYPES[row.type], fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{row.type}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#9CA3AF" }}>{row.duration}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#6B7280" }}>{row.purpose}</span>
                    </div>
                  ))}
                </div>
              </div>
              <P>You can control cookies through your browser settings. Disabling <strong>Essential</strong> cookies will prevent the platform from functioning correctly.</P>
              <Div/>

              {/* 7 */}
              <SHead id="retention" num="07" icon={FiServer} title="Data Retention"/>
              <P>We retain data only as long as necessary to fulfil the purposes in this Policy or as required by law. Key retention periods:</P>
              <CL items={["Account data: duration of account + 2 years","Transaction records: 7 years (FIRS legal obligation)","Identity documents: duration of account + 1 year","Support tickets: 3 years after resolution","Analytics data: 26 months (anonymised thereafter)"]}/>
              <P>When data is no longer needed, we securely delete or anonymise it.</P>
              <Div/>

              {/* 8 */}
              <SHead id="security" num="08" icon={FiLock} title="Security"/>
              <P>We implement appropriate technical and organisational measures including encryption at rest and in transit, role-based access controls, secure infrastructure, and monitoring. </P>
              <Hl color="amber">No system is entirely secure. If you suspect your account has been compromised, contact us immediately at <strong>security@changeworker.ng</strong>.</Hl>
              <Div/>

              {/* 9 */}
              <SHead id="rights" num="09" icon={TbUserShield} title="Your Rights Under NDPA 2023"/>
              <P>The Nigeria Data Protection Act 2023 grants you significant rights over your personal data:</P>
              <div className="grid sm:grid-cols-2 gap-4 my-6">
                {USER_RIGHTS.map(({ icon:Icon, title, desc, color },i)=>(
                  <div key={i} className="dc rounded-xl border border-gray-100 bg-[#F3F4F6] p-5 flex gap-3.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background:`${color}12` }}>
                      <Icon size={15} style={{ color }}/>
                    </div>
                    <div>
                      <p className="font-bold text-[#111] text-sm mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</p>
                      <p className="text-gray-500 text-xs leading-relaxed" style={{ fontFamily:"'DM Sans',sans-serif" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <P>To exercise your rights, email <strong>operations@changeworker.ng</strong> with "Data Rights Request" as the subject. We respond within 30 days.</P>
              <Hl color="orange">If we fail to address your request, you may complain to the <strong>Nigeria Data Protection Commission (NDPC)</strong> at ndpb.gov.ng.</Hl>
              <Div/>

              {/* 10 */}
              <SHead id="children" num="10" icon={RiUserHeartLine} title="Children's Privacy"/>
              <P>changeworker is not intended for persons under 18. We do not knowingly collect data from minors. If you believe a child has provided data to us, contact <strong>support@changeworker.ng</strong> or <strong>operations@changeworker.ng</strong> immediately.</P>
              <Div/>

              {/* 11 */}
              <SHead id="transfers" num="11" icon={FiGlobe} title="International Data Transfers"/>
              <P>changeworker primarily processes data within Nigeria. Where data is transferred outside Nigeria (via service providers), we ensure adequate safeguards including Standard Contractual Clauses and transfers only to countries with adequate data protection standards as recognised by the NDPC.</P>
              <Div/>

              {/* 12 */}
              <SHead id="changes" num="12" icon={FiRefreshCw} title="Changes to This Policy"/>
              <P>We may update this Policy periodically. For material changes, we will email registered users and display a prominent banner for at least 14 days. Your continued use after the effective date constitutes acceptance.</P>
              <Div/>

              {/* 13 */}
              <SHead id="contact" num="13" icon={FiMail} title="Contact Us & DPO"/>
              <P>For any privacy questions, requests, or concerns:</P>
              <div className="grid sm:grid-cols-2 gap-4 my-5">
                {[
                  { label:"Operations", value:"operations@changeworker.ng", color:"#F97316", icon:RiShieldCheckLine },
                  { label:"Support",    value:"support@changeworker.ng",    color:"#6366F1", icon:FiMail },
                  { label:"Tech",       value:"tech@changeworker.ng",       color:"#EC4899", icon:FiLock },
                  { label:"Finance",    value:"finance@changeworker.ng",    color:"#10B981", icon:FiShield },
                  { label:"General",    value:"hello@changeworker.ng",      color:"#F59E0B", icon:FiMail },
                ].map(({ label, value, color, icon:Icon })=>(
                  <div key={label} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-[#F3F4F6]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background:`${color}12` }}>
                      <Icon size={14} style={{ color }}/>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</p>
                      <a href={`mailto:${value}`} className="text-sm font-semibold text-[#111] hover:text-[#F97316] transition-colors" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</a>
                    </div>
                  </div>
                ))}
              </div>
              <P>We aim to respond to all privacy correspondence within <strong>2 business days</strong>.</P>

              {/* acceptance */}
              <div className="mt-12 rounded-2xl bg-[#111] p-7 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="lbl text-orange-400 mb-3">Your agreement</p>
                  <p className="font-black text-white text-lg mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>By using changeworker, you accept this Privacy Policy.</p>
                  <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xl" style={{ fontFamily:"'DM Sans',sans-serif" }}>This Policy, together with our Terms & Conditions, governs how we handle your personal data.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/terms" className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors no-underline" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Terms & Conditions <FiExternalLink size={12}/>
                    </Link>
                    <a href="mailto:operations@changeworker.ng" className="inline-flex items-center gap-2 border border-white/12 hover:border-white/30 text-white/55 hover:text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Contact DPO <FiMail size={12}/>
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* back to top */}
        <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
          className="fixed bottom-8 right-8 z-50 w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-lg transition-all"
          style={{ opacity:scrollY>400?1:0, transform:scrollY>400?"scale(1)":"scale(.8)", pointerEvents:scrollY>400?"auto":"none" }}>
          <FiArrowUp size={15}/>
        </button>

       <Footer />
      </div>
    </>
  )
}

