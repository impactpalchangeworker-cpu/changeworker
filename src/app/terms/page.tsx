"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import {
  FiArrowUp, FiShield, FiUsers, FiDollarSign, FiAlertTriangle,
  FiLock, FiGlobe, FiRefreshCw, FiMail, FiFileText,
  FiChevronRight, FiCheckCircle, FiCopy, FiExternalLink
} from "react-icons/fi"
import { MdGavel } from "react-icons/md"
import { TbScale } from "react-icons/tb"
import { RiShieldCheckLine } from "react-icons/ri"
import Footer from "@/components/layout/Footer"

/* ── hooks ── */
function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => { const h = () => setY(window.scrollY); window.addEventListener("scroll",h,{passive:true}); return () => window.removeEventListener("scroll",h) }, [])
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
  { id:"acceptance",    label:"Acceptance",           icon:FiCheckCircle   },
  { id:"platform",      label:"Platform Overview",    icon:FiGlobe         },
  { id:"accounts",      label:"Accounts",             icon:FiUsers         },
  { id:"organizations", label:"For Organizations",    icon:FiFileText      },
  { id:"freelancers",   label:"For Freelancers",      icon:FiUsers         },
  { id:"payments",      label:"Payments & Fees",      icon:FiDollarSign    },
  { id:"conduct",       label:"Code of Conduct",      icon:TbScale         },
  { id:"intellectual",  label:"Intellectual Property",icon:FiLock          },
  { id:"disputes",      label:"Disputes",             icon:MdGavel         },
  { id:"liability",     label:"Liability",            icon:FiShield        },
  { id:"privacy",       label:"Privacy",              icon:RiShieldCheckLine},
  { id:"termination",   label:"Termination",          icon:FiAlertTriangle },
  { id:"changes",       label:"Changes",              icon:FiRefreshCw     },
  { id:"contact",       label:"Contact",              icon:FiMail          },
]
const IDS = SECTIONS.map(s => s.id)

/* ── sub-components ── */
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 text-sm leading-[1.88] mb-4" style={{ fontFamily:"'DM Sans',sans-serif" }}>{children}</p>
}
function SH({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-[#111] text-base mt-7 mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</h3>
}
function Hl({ color="orange", children }: { color?:"orange"|"indigo"|"emerald"|"amber"|"red"; children:React.ReactNode }) {
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
export default function TermsPage() {
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
        .dc{transition:transform .25s,border-color .2s}
        .dc:hover{transform:translateY(-2px)}
        strong{font-weight:700;color:#111}
      `}</style>

      {/* progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
        <div className="h-full bg-[#F97316] transition-all duration-100" style={{ width:`${progress}%` }}/>
      </div>

      <div className="bg-white text-[#111] overflow-x-hidden min-h-screen">
        <Navbar />

        {/* ── HERO ── */}
        <div className="relative border-b border-gray-100 pt-28 pb-16 bg-white">
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="entry inline-flex w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 items-center justify-center mb-7" style={{ animationDelay:".05s" }}>
              <TbScale size={24} style={{ color:"#F97316" }}/>
            </div>
            <h1 className="entry font-black text-5xl lg:text-6xl text-[#111] leading-[.95] tracking-tight mb-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", animationDelay:".12s" }}>
              Terms & Conditions
            </h1>
            <p className="entry text-gray-500 text-lg mb-9 max-w-xl mx-auto" style={{ fontFamily:"'DM Sans',sans-serif", animationDelay:".22s" }}>
              The changeworker platform agreement - written clearly.
            </p>
            <div className="entry flex flex-wrap justify-center gap-3" style={{ animationDelay:".32s" }}>
              {[
                { label:"Effective", value:"April 1, 2026" },
                { label:"Updated",   value:"April 2026" },
                { label:"Law",       value:"Federal Republic of Nigeria" },
                { label:"Version",   value:"1.2" },
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
              <strong>Plain-English summary:</strong> changeworker connects impact organizations with freelance professionals. We charge a <strong>flat 10% platform fee</strong> on completed gigs (deducted from the talent's payout). Both parties must behave professionally. Nigerian law governs this agreement. Questions? Email <strong>operations@changeworker.ng</strong>.
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
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left hov-tr ${on?"nav-act border-orange-200":"border-transparent hover:bg-gray-50"}`}>
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
                <div className="mt-6 px-2">
                  <a href="mailto:operations@changeworker.ng" className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#F97316] transition-colors" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                    <FiMail size={11}/> operations@changeworker.ng
                  </a>
                </div>
              </div>
            </aside>

            {/* main content */}
            <main className="min-w-0">

              {/* 1 */}
              <SHead id="acceptance" num="01" icon={FiCheckCircle} title="Acceptance of Terms"/>
              <P>Welcome to <strong>changeworker</strong>, a talent marketplace operated by Impactpal Africa. These Terms and Conditions govern your access to and use of the changeworker platform at changeworker.ng.</P>
              <P>By creating an account, posting a gig, submitting a profile, or otherwise accessing the platform, you confirm you have read, understood, and agree to be bound by these Terms.</P>
              <Hl color="orange">You must be at least <strong>18 years old</strong> to use changeworker. By accepting, you represent that you meet this requirement and have the legal capacity to enter into a binding agreement.</Hl>
              <Div/>

              {/* 2 */}
              <SHead id="platform" num="02" icon={FiGlobe} title="Platform Overview"/>
              <P>changeworker is a <strong>two-sided talent marketplace</strong> that facilitates connections between organizations that need project-based professional support and skilled independent professionals (freelancers) who wish to provide services to impact-sector clients.</P>
              <P>changeworker does not employ freelancers. We are a technology platform that enables organizations and freelancers to discover, engage, and transact. We facilitate the relationship but are not a party to any service contract formed between them.</P>
              <Hl color="indigo">Freelancers on the platform are <strong>independent contractors</strong>, not employees of changeworker or of the organizations they serve.</Hl>
              <Div/>

              {/* 3 */}
              <SHead id="accounts" num="03" icon={FiUsers} title="User Accounts & Registration"/>
              <P>To access the full platform, you must register for an account and agree to:</P>
              <CL items={["Provide accurate, current, and complete registration information and keep it updated.","Select a strong, unique password and maintain its confidentiality.","Notify us immediately if you suspect unauthorised access to your account.","Accept responsibility for all activities that occur under your account.","Not register more than one account per person or entity without express written consent."]}/>
              <Hl color="amber">You are solely responsible for all activities conducted through your account. changeworker will not be liable for any loss arising from unauthorised use where you failed to secure your credentials.</Hl>
              <SH>Account Verification</SH>
              <P>All accounts are subject to identity and legitimacy verification. Organizations may be asked to submit CAC certificates. Freelancers may be asked to submit government-issued photo identification. Accounts are marked "Verified" upon successful review.</P>
              <Div/>

              {/* 4 */}
              <SHead id="organizations" num="04" icon={FiFileText} title="Organizations: Rights & Obligations"/>
              <SH>4.1 Gig Postings</SH>
              <CL items={["You must describe gig requirements accurately - scope, deliverables, duration, and budget.","Gig listings must be for genuine, legitimate work. Fictitious or exploratory listings are prohibited.","You must not discriminate against freelancers on the basis of ethnicity, gender, religion, disability, or any other protected characteristic.","Budgets must reflect genuine intent to pay."]}/>
              <SH>4.2 Engaging Freelancers</SH>
              <P>When you select a freelancer, you enter into a direct service agreement with that individual. changeworker facilitates but is not a party to this agreement. You are responsible for providing clear briefs, timely feedback, and releasing payment upon satisfactory completion.</P>
              <Hl color="red">Engaging changeworker-matched freelancers directly outside the platform - to avoid our commission - constitutes a material breach and may result in immediate account termination and recovery of damages.</Hl>
              <Div/>

              {/* 5 */}
              <SHead id="freelancers" num="05" icon={FiUsers} title="Freelancers: Rights & Obligations"/>
              <SH>5.1 Profile & Credentials</SH>
              <CL items={["Your profile must accurately represent your skills, experience, qualifications, and identity.","You must not misrepresent qualifications, certifications, or past work experience.","Work samples must be your original work or work you are legally entitled to present."]}/>
              <SH>5.2 Service Delivery</SH>
              <CL items={["Deliver work that meets the agreed scope and quality standards.","Communicate proactively regarding progress, blockers, and timelines.","Do not subcontract or delegate work without the explicit written consent of the organization.","Upon completion, do not retain, distribute, or use confidential information belonging to the organization."]}/>
              <Hl color="emerald">As an independent contractor, you are responsible for your own tax obligations - income tax, VAT, or WHT - under Nigerian law. changeworker does not withhold taxes on your behalf.</Hl>
              <SH>5.3 Platform Exclusivity Window</SH>
              <P>For 12 months following your first engagement with any organization through changeworker, you agree to conduct all further paid work with that organization through the platform. This protects the integrity of the marketplace.</P>
              <Div/>

              {/* 6 */}
              <SHead id="payments" num="06" icon={FiDollarSign} title="Payments & Fees"/>
              <SH>6.1 Platform Fee</SH>
              <P>changeworker charges a <strong>flat 10% platform fee</strong> deducted from the talent's payout on completed gigs. Organizations pay exactly the agreed gig rate - no markup, no surcharge added on their side.</P>
              <Hl color="orange">Example: If a gig is agreed at ₦100,000, the talent receives ₦90,000 and changeworker retains ₦10,000. The organization pays ₦100,000.</Hl>
              <SH>6.2 Payment Processing</SH>
              <P>Payments are processed through our payment provider. By using the platform, you agree to the applicable payment-provider terms. changeworker does not store full card details. Talent payment follows approved delivery under the relevant project agreement.</P>
              <SH>6.3 Disputes & Refunds</SH>
              <P>Refunds are not automatically issued. If an organization believes work was not delivered to the agreed standard, they should raise a formal dispute through the workspace. changeworker may review the available records and help the parties move toward an appropriate resolution.</P>
              <SH>6.4 Currency & Taxes</SH>
              <P>All transactions are in <strong>Nigerian Naira (₦)</strong>. You are solely responsible for determining and fulfilling any applicable tax obligations.</P>
              <Div/>

              {/* 7 */}
              <SHead id="conduct" num="07" icon={TbScale} title="Code of Conduct"/>
              <P>All users must maintain the highest standards of professional conduct. The following are strictly prohibited:</P>
              <CL items={["Harassment, intimidation, discrimination, or threatening behaviour toward any user.","Submitting false reviews, ratings, or testimonials.","Attempting to access or disrupt platform systems or other users' accounts.","Using the platform to facilitate money laundering, fraud, or any illegal activity.","Impersonating another individual, organization, or changeworker staff.","Sharing private contact information to solicit off-platform transactions during the exclusivity period."]}/>
              <Hl color="red">Violations may result in immediate account suspension or permanent termination, withholding of funds pending investigation, and/or referral to law enforcement.</Hl>
              <Div/>

              {/* 8 */}
              <SHead id="intellectual" num="08" icon={FiLock} title="Intellectual Property"/>
              <SH>8.1 Platform IP</SH>
              <P>The changeworker platform - including its design, code, brand, and content created by Impactpal Africa - is the exclusive intellectual property of Impactpal Africa. No user obtains any IP rights by using the platform.</P>
              <SH>8.2 Deliverable Ownership</SH>
              <Hl color="indigo">Upon full payment, all intellectual property rights in the final deliverables transfer to the Organization. The freelancer retains the right to reference the project in their portfolio (without disclosing confidential information) unless the organization requests confidentiality in writing.</Hl>
              <SH>8.3 User Content</SH>
              <P>By submitting content to changeworker - including profile information, work samples, project descriptions, and reviews - you grant changeworker a non-exclusive, royalty-free, worldwide licence to use and display such content for the purpose of operating and promoting the platform.</P>
              <Div/>

              {/* 9 */}
              <SHead id="disputes" num="09" icon={MdGavel} title="Dispute Resolution"/>
              <SH>9.1 Internal Process</SH>
              <P>In the event of a dispute, both parties agree to first attempt resolution through changeworker's internal process. A dispute is raised via the workspace; changeworker reviews the available project records and helps the parties reach a practical resolution. Payment actions may be paused during review.</P>
              <SH>9.2 Governing Law</SH>
              <P>These Terms are governed by the <strong>laws of the Federal Republic of Nigeria</strong>. To the extent that formal court proceedings are necessary, you consent to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</P>
              <Div/>

              {/* 10 */}
              <SHead id="liability" num="10" icon={FiShield} title="Limitation of Liability"/>
              <P>To the maximum extent permitted by applicable law, changeworker shall not be liable for indirect, incidental, or consequential damages; loss of profits or data; the conduct or deliverables of any user; platform downtime beyond our reasonable control; or unauthorised account access resulting from your failure to secure your credentials.</P>
              <Hl color="amber">changeworker's total aggregate liability for any claim shall not exceed the total fees paid by you to changeworker in the six (6) months immediately preceding the claim.</Hl>
              <P>The platform is provided "as is" without warranties of any kind. We do not guarantee the quality, suitability, or accuracy of any services offered by freelancers, nor the legitimacy of organizations.</P>
              <Div/>

              {/* 11 */}
              <SHead id="privacy" num="11" icon={RiShieldCheckLine} title="Privacy & Data Protection"/>
              <P>Your privacy is governed by our <strong>Privacy Policy</strong>, incorporated into these Terms by reference. We collect only what is necessary to operate the platform, never sell your data, and comply with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Contact us at operations@changeworker.ng or support@changeworker.ng for platform requests, and privacy@changeworker.ng for formal data-protection correspondence.</P>
              <Div/>

              {/* 12 */}
              <SHead id="termination" num="12" icon={FiAlertTriangle} title="Termination"/>
              <SH>12.1 By You</SH>
              <P>You may close your account at any time by contacting support@changeworker.ng. Closing your account does not cancel obligations from active gigs, pending payments, or outstanding disputes.</P>
              <SH>12.2 By changeworker</SH>
              <P>We may suspend or permanently terminate your account, with or without notice, if you violate these Terms, provide false information, engage in fraudulent activity, circumvent platform commission, or create an unsafe environment for other users.</P>
              <SH>12.3 Effect of Termination</SH>
              <P>Upon termination, your right to access the platform ceases immediately. Payment matters relating to active gigs will be handled according to the dispute resolution process.</P>
              <Div/>

              {/* 13 */}
              <SHead id="changes" num="13" icon={FiRefreshCw} title="Changes to These Terms"/>
              <P>We may modify these Terms at any time. We will notify registered users of material changes by email and via a prominent platform notice. Changes take effect <strong>14 days</strong> after notification (immediately if required by law). Continued use after the effective date constitutes acceptance.</P>
              <Hl color="indigo">The "Last updated" date and version number at the top of this document will always reflect the most recent revision.</Hl>
              <Div/>

              {/* 14 */}
              <SHead id="contact" num="14" icon={FiMail} title="Contact Us"/>
              <P>For questions, concerns, or feedback about these Terms:</P>
              <div className="grid sm:grid-cols-2 gap-4 my-5">
                {[
                  { label:"General",    value:"hello@changeworker.ng",       color:"#F97316", icon:FiMail },
                  { label:"Operations", value:"operations@changeworker.ng",  color:"#6366F1", icon:TbScale },
                  { label:"Support",    value:"support@changeworker.ng",     color:"#10B981", icon:RiShieldCheckLine },
                  { label:"Finance",    value:"finance@changeworker.ng",     color:"#EC4899", icon:FiDollarSign },
                  { label:"Tech",       value:"tech@changeworker.ng",        color:"#8B5CF6", icon:FiMail },
                ].map(({ label, value, color, icon:Icon }) => (
                  <div key={label} className="dc flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-[#F3F4F6]">
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
              <P>We aim to respond to all legal and compliance enquiries within <strong>5 business days</strong>.</P>

              {/* acceptance */}
              <div className="mt-12 rounded-2xl border border-gray-200 p-7 relative overflow-hidden bg-white">
                <p className="lbl mb-3">Your agreement</p>
                <p className="font-black text-[#111] text-lg mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>By using changeworker, you agree to these Terms.</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xl" style={{ fontFamily:"'DM Sans',sans-serif" }}>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Impactpal Africa with respect to your use of changeworker.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/signup" className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors no-underline" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Create account <FiArrowUp size={12} className="rotate-45"/>
                  </Link>
                  <Link href="/privacy" className="inline-flex items-center gap-2 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-[#F97316] font-bold text-sm px-5 py-2.5 rounded-xl transition-all no-underline" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Privacy Policy <FiExternalLink size={12}/>
                  </Link>
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
