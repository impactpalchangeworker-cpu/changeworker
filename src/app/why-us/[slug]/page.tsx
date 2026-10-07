import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import { allWhyUs, findWhyUsBySlug } from "@/lib/navSlug"
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiChevronRight, FiExternalLink, FiTrendingUp } from "react-icons/fi"

export async function generateStaticParams() {
  return allWhyUs().map((x) => ({ slug: x.slug }))
}

export const dynamicParams = true

/* ── Content map (all existing content preserved + enriched) ── */
function contentFor(slug: string) {
  if (slug === "success-stories") {
    return {
      headline: "Success Stories",
      intro: "Impact teams and purpose-driven talent use changeworker to deliver real-world outcomes - from climate research to clean energy deployment.",
      tag: "Social proof",
      tagColor: "#F97316",
      icon: "⭐",
      stat: { value: "200+", label: "Organizations served" },
      sections: [
        {
          title: "Climate Research Delivered on Time",
          body: "An environmental nonprofit hired a Climate Researcher and ESG Reporting Specialist to prepare a donor-ready sustainability report. Project funding, milestones, and final deliverables were tracked in the workspace and approved within two weeks.",
          badge: "Climate Action",
          badgeColor: "#3F7E44",
        },
        {
          title: "Mini-Grid Deployment Support",
          body: "A renewable energy startup hired a Solar System Designer and Energy Auditor to scope a rural mini-grid project. Clear agreement terms and protected payments reduced risk for both sides. The project was delivered on budget and on schedule.",
          badge: "Affordable & Clean Energy",
          badgeColor: "#FCC30B",
        },
        {
          title: "AI for Civic Monitoring",
          body: "A civic tech organization partnered with an AI for Social Good Engineer to automate environmental compliance monitoring. Structured communication and secure funding made long-term collaboration possible across a 3-month engagement.",
          badge: "Industry & Innovation",
          badgeColor: "#FD6925",
        },
        {
          title: "Grant Writing at Scale",
          body: "Three connected NGOs working on education access pooled their budgets to hire a Grant Writer for a joint USAID proposal. changeworker's structured agreement and project-payment process helped all three organizations and the talent stay aligned.",
          badge: "Quality Education",
          badgeColor: "#C5192D",
        },
      ],
      highlight: "Impact work requires trust. Our structured agreements and protected funding system reduce friction so teams can focus on results.",
      cta: { label: "Post a gig", href: "/hire" },
      ctaSecondary: { label: "Browse talent", href: "/jobs" },
    }
  }

  if (slug === "how-to-hire") {
    return {
      headline: "How to Hire on changeworker",
      intro: "Hiring impact talent should be structured, secure, and outcome-driven. Our process protects both clients and freelancers - every single time.",
      tag: "Client guide",
      tagColor: "#6366F1",
      icon: "🏢",
      stat: { value: "4 steps", label: "From gig post to delivery" },
      sections: [
        {
          title: "1. Post Your Gig",
          body: "Describe the work you need done. Browse curated categories across Admin and Operations, Programs, Communications, Finance, Design, Research, and more. Tag your gig to the relevant SDGs. Set your budget and timeline. Takes less than five minutes.",
          badge: "Getting started",
          badgeColor: "#6366F1",
        },
        {
          title: "2. Get Instantly Matched",
          body: "The moment your gig goes live, our matching engine instantly surfaces the most relevant vetted talent based on skills, SDG alignment, sector experience, and availability. No waiting. No manual review delay. You see a curated shortlist within seconds.",
          badge: "Instant matching",
          badgeColor: "#F97316",
        },
        {
          title: "3. Agree Scope & Fund the Project",
          body: "Discuss expectations in chat. Finalize deliverables, timeline, and payment terms inside the workspace agreement. Once agreed, fund the project. Talent payment follows approval of the final work.",
          badge: "Protected",
          badgeColor: "#10B981",
        },
        {
          title: "4. Review & Release",
          body: "Talent submits final work inside the workspace. Review everything before approving. Once you mark the gig complete, talent payment is processed. Our 10% platform fee is deducted from the talent's payout - you pay exactly what was agreed, nothing more.",
          badge: "Final step",
          badgeColor: "#EC4899",
        },
      ],
      highlight: "No upfront freelancer risk. No client payment risk. Just structured delivery and clear project payments on every single gig.",
      cta: { label: "Post your first gig", href: "/hire" },
      ctaSecondary: { label: "See how it works", href: "/how-it-works" },
    }
  }

  if (slug === "reviews") {
    return {
      headline: "Reviews & Accountability",
      intro: "Trust is built on transparency. Our review system strengthens the entire ecosystem - every gig builds a record that compounds into real reputation.",
      tag: "Community trust",
      tagColor: "#10B981",
      icon: "💬",
      stat: { value: "98%", label: "Project satisfaction rate" },
      sections: [
        {
          title: "Mutual Reviews After Every Gig",
          body: "After a workspace is completed, both client and talent can leave structured feedback. This builds reputation and long-term credibility for both parties - not just the freelancer. Reliable clients attract stronger talent on future gigs.",
          badge: "Both sides",
          badgeColor: "#10B981",
        },
        {
          title: "Outcome-Focused Feedback",
          body: "Reviews are structured around four dimensions: delivery quality, communication clarity, timeliness, and professionalism. This gives future parties genuinely useful signals - not just star ratings.",
          badge: "Structured",
          badgeColor: "#F97316",
        },
        {
          title: "Long-Term Reputation",
          body: "High-performing talent build visible track records that unlock higher-value gigs. Organisations with strong client profiles attract better talent. The review system rewards quality - consistently.",
          badge: "Compounding",
          badgeColor: "#6366F1",
        },
        {
          title: "Verified, Permanent Records",
          body: "Reviews are tied to verified, completed gigs. They cannot be removed or suppressed by either party. This gives the community an honest, reliable signal about who delivers and who doesn't.",
          badge: "Verified",
          badgeColor: "#EC4899",
        },
      ],
      highlight: "The best impact work happens when trust compounds over time. Our review system is the mechanism that makes that possible.",
      cta: { label: "Find great talent", href: "/hire" },
      ctaSecondary: { label: "Browse jobs", href: "/jobs" },
    }
  }

  if (slug === "how-to-find-work") {
    return {
      headline: "How to Find Work on changeworker",
      intro: "changeworker helps purpose-driven professionals build sustainable freelance careers in climate, energy, civic tech, and development - with instant matching instead of endless bidding.",
      tag: "Talent guide",
      tagColor: "#EC4899",
      icon: "🎯",
      stat: { value: "Instant", label: "Matching on every gig post" },
      sections: [
        {
          title: "1. Build a Strong Profile",
          body: "Highlight your skills, sector experience, and measurable past outcomes. Tag yourself to the SDGs you're passionate about and experienced in. Clients look for proof of results and sector fluency - not just credentials.",
          badge: "First step",
          badgeColor: "#EC4899",
        },
        {
          title: "2. Get Auto-Matched to Gigs",
          body: "The moment a relevant gig is posted, you're instantly surfaced to the client - no bidding war, no proposal race, no cold pitching. Our matching engine connects your profile to the right gigs automatically. You focus on the work, not the hustle of finding it.",
          badge: "Automatic",
          badgeColor: "#F97316",
        },
        {
          title: "3. Discuss, Agree & Start",
          body: "The client reviews your profile and reaches out. Discuss scope, timeline, and questions through the platform's workspace. Once agreed, the client funds the project and you begin. You start work with a clear payment process in place.",
          badge: "Protected",
          badgeColor: "#6366F1",
        },
        {
          title: "4. Deliver, Get Paid, Build Reputation",
          body: "Submit your work through the workspace. Once the client approves, your payment is processed. Our 10% platform fee is deducted from your payout - you agreed on a rate and that's what you see minus the fee. Every completed gig builds your rating and review history.",
          badge: "Rewarded",
          badgeColor: "#10B981",
        },
      ],
      highlight: "We protect your earnings, handle the matching, and give you the structure to build a serious freelance career in the impact sector.",
      cta: { label: "Create your profile", href: "/signup?type=talent" },
      ctaSecondary: { label: "Browse open gigs", href: "/jobs" },
    }
  }

  // featured-resources
  return {
    headline: "Featured Resources",
    intro: "Access practical guides, playbooks, and insights for building, funding, and delivering impactful work. Free, always.",
    tag: "Resources",
    tagColor: "#F59E0B",
    icon: "📚",
    stat: { value: "Free", label: "Access, always" },
    sections: [
      {
        title: "Hiring Playbooks",
        body: "Templates for defining gig scope, structuring agreements, setting realistic timelines, and writing project briefs that attract the right talent. Built specifically for Nigerian nonprofit and social enterprise contexts.",
        badge: "For organizations",
        badgeColor: "#F59E0B",
      },
      {
        title: "Freelancer Proposal Guides",
        body: "Learn how to write outcome-focused pitches that stand out, set rates that reflect your real value, and build a portfolio that communicates sector credibility - even when your work is confidential.",
        badge: "For talent",
        badgeColor: "#F97316",
      },
      {
        title: "Impact Delivery Frameworks",
        body: "Best practices for climate reporting, renewable energy deployment documentation, civic tech scoping, M&E system design, and evaluation projects in the Nigerian development sector.",
        badge: "Technical",
        badgeColor: "#3F7E44",
      },
      {
        title: "Project Payments & Fee Transparency",
        body: "A clear explanation of how project funding works, how payment follows approved delivery, how the 10% platform fee is calculated (deducted from talent payout), and how and when withdrawals to bank accounts are processed.",
        badge: "Financial",
        badgeColor: "#6366F1",
      },
    ],
    highlight: "We don't just connect talent and clients - we provide the structure, knowledge, and tools to succeed at impact work.",
    cta: { label: "Explore gig categories", href: "/hire" },
  }
}

/* ── Sibling nav links ── */
const ALL_SLUGS = [
  { slug: "success-stories",   label: "Success Stories" },
  { slug: "how-to-hire",       label: "How to Hire" },
  { slug: "reviews",           label: "Reviews" },
  { slug: "how-to-find-work",  label: "How to Find Work" },
  { slug: "featured-resources",label: "Featured Resources" },
]

export default async function WhyUsPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const { slug } = (await params) as { slug: string }
  const found = findWhyUsBySlug(slug)

  if (!found) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;900&family=JetBrains+Mono:wght@400&display=swap');.fd{font-family:'Sora',sans-serif}.fm{font-family:'JetBrains Mono',monospace}`}</style>
        <div className="fd bg-white min-h-screen flex flex-col items-center justify-center text-center px-6">
          <p className="fm text-xs text-orange-500 uppercase tracking-[.2em] mb-4">404</p>
          <h1 className="font-black text-4xl text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">This Why Us page doesn't exist or the link is outdated.</p>
          <Link href="/why-us" className="inline-flex items-center gap-2 bg-orange-500 text-white font-black px-6 py-3 rounded-2xl">
            <FiArrowLeft size={14}/> Back to Why Us
          </Link>
        </div>
      </>
    )
  }

  const c = contentFor(slug)
  const currentIdx = ALL_SLUGS.findIndex(s => s.slug === slug)
  const prev = currentIdx > 0 ? ALL_SLUGS[currentIdx - 1] : null
  const next = currentIdx < ALL_SLUGS.length - 1 ? ALL_SLUGS[currentIdx + 1] : null
  const siblings = ALL_SLUGS.filter(s => s.slug !== slug)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .fd{font-family:'Sora',sans-serif}
        .fs{font-family:'Instrument Serif',serif}
        .fm{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${c.tagColor};border-radius:3px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimTxt{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}40%{transform:translate(52px,-52px)scale(1.08)}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes dotDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes dashDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}

        .entry{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
        .shimmer{background:linear-gradient(90deg,${c.tagColor},#EA580C,#FB923C,${c.tagColor});background-size:600px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
        .grid-dark{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px}
        .dot-bg{background-image:radial-gradient(rgba(249,115,22,.13) 1.5px,transparent 1.5px);background-size:26px 26px}
        .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0}
        .anim-o1{animation:orb1 14s ease-in-out infinite}
        .draw-line{stroke-dasharray:1000;animation:dashDraw 2.2s ease both}

        .sec-card{transition:border-color .2s,box-shadow .3s,transform .3s cubic-bezier(.22,1,.36,1)}
        .sec-card:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(0,0,0,.07);border-color:${c.tagColor}30}

        .sibling-link{transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s ease,border-color .2s}
        .sibling-link:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.07)}

        strong{font-weight:700;color:#111827}
      `}</style>

      <div className="fd bg-white text-gray-900 min-h-screen overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
        <Navbar />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:`radial-gradient(ellipse 80% 65% at 50% 38%,${c.tagColor}18 0%,transparent 68%)`}}/>
          <div className="anim-o1 absolute w-[600px] h-[600px] rounded-full blur-3xl -top-40 right-0 pointer-events-none" style={{background:`${c.tagColor}09`}}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/4 pointer-events-none" style={{animation:"borderRot 32s linear infinite"}}/>
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-8" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,18],[92,12],[95,66],[5,72],[50,86],[28,40],[80,46],[62,22]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill={c.tagColor} style={{animation:`dotDrift ${4+i}s ease-in-out ${i*.3}s infinite`}}/>
            ))}
          </svg>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-0">
            {/* breadcrumb */}
            <div className="entry flex items-center gap-2 mb-8" style={{animationDelay:".05s"}}>
              <Link href="/why-us" className="fm text-white/30 text-xs hover:text-white/55 transition-colors flex items-center gap-1.5">
                <FiArrowLeft size={10}/> Why Us
              </Link>
              <span className="text-white/20 text-xs">/</span>
              <span className="fm text-xs px-2.5 py-1 rounded-full font-bold" style={{background:`${c.tagColor}25`,color:c.tagColor}}>{c.tag}</span>
            </div>

            <div className="entry flex items-center gap-3 mb-6" style={{animationDelay:".12s"}}>
              <span className="text-4xl">{c.icon}</span>
              <div>
                <p className="fm text-[10px] uppercase tracking-[.2em] mb-0.5" style={{color:c.tagColor}}>{c.stat.label}</p>
                <p className="font-black text-3xl text-white">{c.stat.value}</p>
              </div>
            </div>

            <h1 className="entry font-black text-5xl lg:text-6xl text-white leading-[1.0] tracking-tight mb-5" style={{animationDelay:".2s"}}>
              <span className="shimmer">{c.headline}</span>
            </h1>
            <p className="entry fs italic text-2xl text-white/38 mb-12 max-w-2xl leading-snug" style={{animationDelay:".32s"}}>
              {c.intro}
            </p>
          </div>

          <div style={{height:"72px"}} className="pointer-events-none">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* ── BODY ── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[1fr_300px] gap-12">

              {/* left: sections */}
              <div>
                {/* accent line */}
                <div className="h-1 w-20 rounded-full mb-10" style={{background:c.tagColor}}/>

                <div className="space-y-5">
                  {c.sections.map((s, i) => (
                    <div key={i} className="sec-card rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 flex-1">
                          <span className="fm text-[10px] font-bold shrink-0 mt-1.5" style={{color:`${c.tagColor}80`}}>0{i+1}</span>
                          <div>
                            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                              <h3 className="font-black text-gray-900 text-lg leading-tight">{s.title}</h3>
                              <span className="fm text-[9px] px-2 py-0.5 rounded-full font-bold" style={{background:`${s.badgeColor}12`,color:s.badgeColor}}>
                                {s.badge}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* highlight / why this matters */}
                <div className="mt-8 rounded-2xl p-7 border-l-4" style={{background:`${c.tagColor}07`,borderColor:`${c.tagColor}50`}}>
                  <div className="flex items-center gap-2 mb-2">
                    <FiTrendingUp size={14} style={{color:c.tagColor}}/>
                    <span className="fm text-[10px] font-bold uppercase tracking-wider" style={{color:c.tagColor}}>Why this matters</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold">{c.highlight}</p>
                </div>

                {/* prev / next */}
                <div className="mt-10 grid sm:grid-cols-2 gap-4">
                  {prev && (
                    <Link href={`/why-us/${prev.slug}`} className="sibling-link rounded-2xl border border-gray-100 bg-white p-5 group block">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiArrowLeft size={10}/>Previous</p>
                      <p className="font-black text-sm text-gray-800 group-hover:text-orange-600 transition-colors">{prev.label}</p>
                    </Link>
                  )}
                  {next && (
                    <Link href={`/why-us/${next.slug}`} className="sibling-link rounded-2xl border border-gray-100 bg-white p-5 group block sm:text-right">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:justify-end">Next<FiArrowRight size={10}/></p>
                      <p className="font-black text-sm text-gray-800 group-hover:text-orange-600 transition-colors">{next.label}</p>
                    </Link>
                  )}
                </div>
              </div>

              {/* right: sticky sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 flex flex-col gap-5">

                  {/* primary CTA */}
                  <div className="rounded-2xl overflow-hidden bg-[#060912] p-6 relative">
                    <div className="absolute inset-0" style={{background:`radial-gradient(ellipse 80% 80% at 50% 50%,${c.tagColor}18 0%,transparent 70%)`}}/>
                    <div className="relative z-10">
                      <p className="fm text-[10px] uppercase tracking-[.2em] mb-4" style={{color:`${c.tagColor}90`}}>Ready to start?</p>
                      <Link href={c.cta.href}
                        className="block w-full text-center font-black text-sm text-white py-3.5 rounded-xl mb-3 transition-all hover:opacity-90"
                        style={{background:c.tagColor}}>
                        {c.cta.label}
                      </Link>
                      {/* <Link href={c.ctaSecondary.href}
                        className="block w-full text-center font-black text-sm text-white/50 hover:text-white py-3 rounded-xl border border-white/8 hover:border-white/20 transition-all">
                        {c.ctaSecondary.label}
                      </Link> */}
                    </div>
                  </div>

                  {/* other why-us links */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-4">Also in Why Us</p>
                    <div className="space-y-3">
                      {siblings.map(s => (
                        <Link key={s.slug} href={`/why-us/${s.slug}`}
                          className="flex items-center gap-2.5 group">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-200 group-hover:bg-orange-400 transition-colors"/>
                          <span className="text-gray-600 text-xs font-semibold group-hover:text-orange-600 transition-colors">{s.label}</span>
                          <FiChevronRight size={10} className="ml-auto text-gray-300 group-hover:text-orange-400 transition-colors"/>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* back */}
                  <Link href="/why-us"
                    className="rounded-2xl border border-gray-100 bg-[#FAFAF9] p-4 flex items-center gap-2.5 hover:border-orange-200 transition-all group">
                    <FiArrowLeft size={13} className="text-gray-400 group-hover:text-orange-500 transition-colors"/>
                    <span className="text-gray-500 text-xs font-semibold group-hover:text-orange-600 transition-colors">Back to Why Us overview</span>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section className="relative overflow-hidden bg-[#060912] py-24 noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:`radial-gradient(ellipse 70% 60% at 50% 50%,${c.tagColor}12 0%,transparent 65%)`}}/>
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{background:`${c.tagColor}08`}}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-white/5 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <p className="fm text-xs uppercase tracking-[.3em] mb-6" style={{color:`${c.tagColor}cc`}}>Flexible talents. Meaningful work.</p>
            <h2 className="fd font-black text-5xl text-white leading-[.95] mb-4">
              Start doing<br />
              <span className="shimmer">impact work right.</span>
            </h2>
            <p className="fs italic text-2xl text-white/35 mb-10">changeworker connects Nigeria's social sector.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={c.cta.href}
                className="inline-flex items-center gap-2.5 text-white font-black px-10 py-4 rounded-2xl transition-all duration-200 group relative overflow-hidden"
                style={{background:c.tagColor,boxShadow:`0 0 50px ${c.tagColor}40`,padding:"1.1rem 2.5rem"}}>
                {c.cta.label} <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"/>
              </Link>
              <Link href="/why-us"
                className="inline-flex items-center gap-2 border border-white/12 hover:border-white/30 text-white/60 hover:text-white font-black rounded-2xl transition-all duration-200"
                style={{padding:"1.1rem 2rem"}}>
                <FiArrowLeft size={13}/> Why Us
              </Link>
            </div>
          </div>
        </section>

        {/* footer strip */}
        <div className="border-t border-gray-100 bg-white py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center"><span className="text-white font-black text-sm fd">c</span></div>
              <span className="fd font-bold text-gray-700 text-sm">changeworker</span>
            </div>
            <div className="flex gap-5">
              {[["/terms","Terms"],["/privacy","Privacy"],["/faq","FAQ"],["/about","About"],["/" ,"Home"]].map(([h,l])=>(
                <a key={h} href={h} className="fm text-xs text-gray-400 hover:text-orange-500 transition-colors">{l}</a>
              ))}
            </div>
            <p className="fm text-xs text-gray-400">© {new Date().getFullYear()} Impactpal Africa</p>
          </div>
        </div>
      </div>
    </>
  )
}
