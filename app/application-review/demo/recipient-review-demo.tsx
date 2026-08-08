"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, ChevronDown, FileText, MessageSquareText, Send, ShieldCheck, UserRoundCheck } from "lucide-react"

const responses = [
  {
    question: "Describe the proposed project.",
    answer: "Between Salt and Memory is a synthetic demonstration project exploring migration, domestic archives, and intergenerational memory through photography and site-specific installation. The proposed work combines archival pigment prints, found family material, translucent surfaces, and spatial interventions to examine what is preserved, what disappears, and what is carried across generations.",
  },
  {
    question: "Why is this project important now?",
    answer: "The project considers how personal archives become unstable as families move across borders and generations. It treats photographs not as fixed evidence, but as objects shaped by memory, loss, translation, and repetition. The installation creates a quiet environment where these fragments can be encountered together rather than as isolated documents.",
  },
  {
    question: "How will the funding be used?",
    answer: "Support would be directed toward archival printing, fabrication, research materials, installation tests, and a small public engagement component. This synthetic example is included only to demonstrate how KLEIO presents an approved application response; it is not a real funding request.",
  },
]

const works = [
  { title: "Salt Archive I", meta: "2026 · Archival pigment print · 40 × 60 in.", background: "radial-gradient(circle at 28% 34%, rgba(247,238,221,.92) 0 10%, transparent 11%), linear-gradient(145deg,#665b50 0%,#c9bda9 33%,#eee6d8 53%,#7c7167 76%,#342e2b 100%)" },
  { title: "Inheritance Study", meta: "2026 · Photograph, acetate, archival paper · 30 × 44 in.", background: "linear-gradient(90deg,rgba(36,31,35,.83),rgba(36,31,35,.12) 48%,rgba(234,226,211,.18)), radial-gradient(circle at 70% 40%,#d9cfbf 0 9%,#8e8175 10% 23%,#4c4545 24% 45%,#211f23 70%)" },
]

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#403653] px-4 py-2 text-sm font-semibold text-white"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D9D2E2] bg-[#FFFDFC] px-4 py-2 text-sm font-semibold text-[#403653]"
const field = "min-h-10 w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm outline-none"

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.67rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">{children}</p>
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1.5 max-w-3xl font-serif text-[1.7rem] font-semibold leading-tight tracking-[-0.03em] text-[#27232C] sm:text-[2rem]">{children}</h2>
}

export function RecipientReviewDemo() {
  const [composerOpen, setComposerOpen] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  function openComposer() {
    setComposerOpen(true)
    window.setTimeout(() => document.getElementById("demo-communication")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0)
  }

  function simulateSend() {
    setSent(true)
    setComposerOpen(false)
    setIdentityOpen(false)
  }

  return (
    <main className="min-h-dvh bg-[#F8F5EF] text-[#2D2931] selection:bg-[#E6DDEF] selection:text-[#2D2931]">
      <header className="sticky top-0 z-50 border-b border-[#DDD7CF] bg-[#FCFAF6]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[58px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4"><span className="font-serif text-lg font-semibold tracking-[0.12em] text-[#302A38]">KLEIO</span><span className="hidden h-4 w-px bg-[#D7D0C9] sm:block" /><span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#7B737E]">Secure Submission Review</span></div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold text-amber-900">Synthetic preview</span>
        </div>
      </header>

      <section className="border-b border-[#DDD7CF] bg-[#FCFAF6]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <Label>ANA MARTÍNEZ · SYNTHETIC ARTIST</Label>
          <h1 className="mt-3 max-w-5xl font-serif text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#242028] sm:text-[3.7rem] lg:text-[4.25rem]">Between Salt and Memory</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-[#6F6873]"><span>Application to</span><strong className="font-semibold text-[#3B3540]">2027 Emerging Artist Grant</strong><span>·</span><span>Photography · Installation</span><span>·</span><span>Miami, Florida</span></div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#88808D]"><span>Shared by Ana Martínez</span><span>·</span><span>Prepared through KLEIO</span><span>·</span><span>Approved August 7, 2026</span></div>
          <div className="mt-6 flex flex-wrap gap-2"><button type="button" className={primary} onClick={openComposer}><MessageSquareText className="size-4" />Message applicant</button><a href="#documents" className={secondary}>View documents</a><a href="#artist" className="inline-flex min-h-9 items-center px-3 text-sm font-medium text-[#554D5F]">View artist profile <ArrowRight className="ml-1 size-4" /></a></div>
        </div>
      </section>

      <nav className="sticky top-[58px] z-40 border-b border-[#DDD7CF] bg-[#FCFAF6]/96 backdrop-blur-xl" aria-label="Submission sections">
        <div className="mx-auto max-w-[1280px] overflow-x-auto px-4 sm:px-6 lg:px-8"><div className="flex min-w-max items-center gap-1 py-1.5">{[["overview","Overview"],["responses","Responses"],["works","Works"],["project","Project"],["documents","Documents"],["artist","Artist"],["demo-communication","Communication"]].map(([id,label]) => <a key={id} href={`#${id}`} className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#766F7A] hover:bg-[#F1EDF0] hover:text-[#403653]">{label}</a>)}</div></div>
      </nav>

      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-10 xl:gap-14">
          <div className="min-w-0">
            <section id="overview" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)] xl:items-start">
                <div><Label>Application overview</Label><Heading>Understand the proposal at a glance.</Heading><h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Proposal synopsis</h3><p className="mt-2 max-w-3xl text-[1rem] leading-7 text-[#4F4953]">Between Salt and Memory explores migration, domestic archives, and intergenerational memory through photography and site-specific installation. Archival photographs and translucent materials become a quiet study of what families preserve, lose, and reinterpret across generations.</p><p className="mt-2 text-[0.7rem] leading-5 text-[#8B838F]">Synthetic navigational summary only. Not a score or recommendation.</p></div>
                <dl className="grid border-y border-[#DDD7CF]">{[["Applicant","Ana Martínez"],["Discipline","Photography · Installation"],["Opportunity support","$5,000–$10,000"],["Deadline","October 18, 2026"],["Materials","7 visible items"]].map(([term,value],index) => <div key={term} className={`py-3.5 ${index < 4 ? "border-b border-[#DDD7CF]" : ""}`}><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#88808D]">{term}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>
              </div>
            </section>

            <section id="responses" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <Label>Application responses</Label><Heading>Read the artist’s submission in its own voice.</Heading>
              <div className="mt-6">{responses.map((item,index) => <article key={item.question} className="grid gap-3 border-t border-[#DDD7CF] py-5 sm:grid-cols-[42px_minmax(0,1fr)] sm:gap-5 sm:py-6"><span className="font-mono text-[0.68rem] text-[#948C97]">{String(index+1).padStart(2,'0')}</span><div><h3 className="font-serif text-xl font-semibold">{item.question}</h3><p className="mt-3 text-[0.96rem] leading-7 text-[#4F4953]">{item.answer}</p></div></article>)}</div>
            </section>

            <section id="works" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <Label>Selected works</Label><Heading>See the work without turning the dossier into a gallery scroll.</Heading>
              <div className="mt-6 grid gap-x-4 gap-y-7 sm:grid-cols-2">{works.map((work) => <article key={work.title}><div className="aspect-[4/3] w-full bg-[#EEEAE4]" style={{background: work.background}} aria-label={`Synthetic artwork preview: ${work.title}`} /><h3 className="mt-3 font-serif text-xl font-semibold">{work.title}</h3><p className="mt-1 text-xs leading-5 text-[#766F7A]">{work.meta}</p></article>)}</div>
            </section>

            <section id="project" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <Label>Budget / project structure</Label><Heading>Operational details, compact and available.</Heading>
              <details className="group mt-6 border-y border-[#DDD7CF] py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#4F4953]">View synthetic budget breakdown <ChevronDown className="size-4 transition group-open:rotate-180" /></summary><div className="mt-4 grid max-w-xl grid-cols-[1fr_auto] gap-x-8 text-sm leading-7 text-[#4F4953]"><span>Archival printing</span><span>$3,200</span><span>Fabrication</span><span>$1,500</span><span>Research materials</span><span>$750</span><span>Community programming</span><span>$750</span><span>Contingency</span><span>$500</span><strong className="mt-2">Synthetic total</strong><strong className="mt-2">$6,700</strong></div></details>
            </section>

            <section id="documents" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <Label>Supporting materials</Label><Heading>Original documents, neatly available when needed.</Heading>
              <div className="mt-6 border-t border-[#DDD7CF]">{[["Artist CV","Updated July 2026 · PDF"],["Project Budget","PDF · 4 pages"],["Project Timeline","PDF · 2 pages"]].map(([name,meta]) => <div key={name} className="flex min-h-14 items-center justify-between gap-4 border-b border-[#DDD7CF] py-3"><span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#ECE6EE] text-[#5F4C6E]"><FileText className="size-3.5" /></span><span><strong className="block text-sm font-semibold">{name}</strong><span className="mt-0.5 block text-[0.68rem] text-[#88808D]">{meta} · synthetic</span></span></span><span className="text-xs font-semibold text-[#574665]">Preview</span></div>)}</div>
            </section>

            <section id="artist" className="scroll-mt-28 border-b border-[#DDD7CF] py-8 sm:py-10">
              <Label>Artist context</Label><Heading>Enough context to understand the practice—without exposing the whole Passport.</Heading>
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]"><div><h3 className="font-serif text-2xl font-semibold">Ana Martínez</h3><p className="mt-1 text-sm text-[#766F7A]">Miami, Florida · Photography · Installation</p><p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-[#4F4953]">Ana Martínez is a fictional artist profile created exclusively to demonstrate the recipient-facing KLEIO experience. Production review pages show only context approved for the specific submission.</p><details className="group mt-4"><summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-[#665277]">More artist context <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary><p className="mt-3 border-l border-[#D8CFDE] pl-4 text-sm leading-7 text-[#5F5863]">Synthetic Exhibition A, 2025 · Synthetic Project Space, 2024 · Demonstration Residency, 2023</p></details></div><aside className="border-l border-[#DDD7CF] pl-5 text-xs leading-6 text-[#766F7A]">Only artist-approved context attached to this application is visible. Private Creative Passport information remains private.</aside></div>
            </section>

            <section id="demo-communication" className="scroll-mt-28 py-8 sm:py-10">
              <Label>Communication</Label><Heading>Keep the conversation attached to the application.</Heading>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#655E68]">The application stays open without an account. Messaging becomes useful only when the reviewer wants to continue the relationship.</p>

              {!composerOpen && !sent ? <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-[#DDD7CF] py-4"><button type="button" className={primary} onClick={openComposer}><MessageSquareText className="size-4" />Message applicant</button><span className="text-xs text-[#88808D]">Write first. Verification appears only when you choose to send.</span></div> : null}

              {composerOpen && !sent ? <div className="mt-5 border border-[#D9D2DC] bg-[#FCFAF6] p-4 sm:p-5"><h3 className="font-serif text-xl font-semibold">Message Ana Martínez</h3><p className="mt-1 text-xs text-[#88808D]">Synthetic interaction — nothing is sent from this preview.</p><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about the proposal or clarify a selected work…" className="mt-4 w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 py-3 text-sm leading-6 outline-none" />{!identityOpen ? <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={!message.trim()} onClick={() => setIdentityOpen(true)} className={`${primary} disabled:opacity-40`}>Continue to send <ArrowRight className="size-4" /></button><span className="text-xs text-[#88808D]">No signup interruption while composing.</span></div> : <div className="mt-4 border-t border-[#DED8E3] pt-4"><div className="mb-3 flex items-start gap-2"><UserRoundCheck className="mt-0.5 size-4 text-[#77658D]" /><p className="text-xs leading-5 text-[#6F6873]"><strong>One lightweight verification.</strong> Name and verified email become the return identity for this application conversation.</p></div><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Your name" className={field}/><input placeholder="Institution / organization (optional)" className={field}/><input placeholder="name@organization.org" className={`${field} sm:col-span-2`}/></div><button type="button" onClick={simulateSend} className={`${primary} mt-4`}><Send className="size-4" />Simulate verified send</button></div>}</div> : null}

              {sent ? <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="border border-[#D9D2DC] bg-[#FCFAF6] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><UserRoundCheck className="size-4 text-emerald-700"/><h3 className="text-sm font-semibold">Conversation with Ana Martínez</h3><span className="text-[0.68rem] text-[#88808D]">Email verified—not institution verified</span></div><div className="mt-4 space-y-2.5"><article className="ml-auto max-w-[88%] rounded-2xl bg-[#403653] px-4 py-2.5 text-sm leading-6 text-white"><p>{message || "Could you share more about the installation requirements?"}</p><p className="mt-1 text-[0.68rem] text-white/70">You · just now</p></article><article className="max-w-[88%] rounded-2xl border border-[#E2DCE5] bg-[#F7F3F7] px-4 py-2.5 text-sm leading-6"><p>Artist replies would appear here, preserved with this application.</p><p className="mt-1 text-[0.68rem] text-[#88808D]">Synthetic artist reply</p></article></div></div><aside className="border border-[#D9D2DC] bg-[#ECE6EE]/70 p-4"><Label>Review workspace</Label><h3 className="mt-2 font-serif text-lg font-semibold">Keep this review organized</h3><p className="mt-2 text-sm leading-6 text-[#665E69]">Save this application, conversation, private notes, and future KLEIO submissions together.</p><button type="button" className={`${primary} mt-4 w-full`}>Create Review Workspace <ArrowRight className="size-4" /></button><p className="mt-2 text-[0.68rem] leading-5 text-[#7B727F]">Optional. The review remains accessible either way.</p></aside></div> : null}
            </section>
          </div>

          <aside className="hidden lg:block"><div data-audit-sticky-safe="recipient-review-rail" className="sticky top-[108px] space-y-5 py-8"><div className="border-t border-[#CFC7CF] pt-4"><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#88808D]">Submission snapshot</p><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-[0.68rem] text-[#8B838F]">Artist</dt><dd className="mt-0.5 font-semibold">Ana Martínez</dd></div><div><dt className="text-[0.68rem] text-[#8B838F]">Opportunity</dt><dd className="mt-0.5 font-medium">2027 Emerging Artist Grant</dd></div><div><dt className="text-[0.68rem] text-[#8B838F]">Deadline</dt><dd className="mt-0.5 font-medium">October 18, 2026</dd></div><div><dt className="text-[0.68rem] text-[#8B838F]">Materials visible</dt><dd className="mt-0.5 font-medium">7</dd></div></dl></div><div className="border-t border-[#CFC7CF] pt-4"><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#88808D]">Quick actions</p><button type="button" onClick={openComposer} className="mt-2 flex items-center gap-2 text-sm font-medium text-[#554D5F]"><MessageSquareText className="size-4"/>Message applicant</button></div></div></aside>
        </div>

        <footer className="mt-5 border-t border-[#D5CEC6] py-5 text-[0.7rem] leading-5 text-[#7B737E]"><div className="flex max-w-4xl items-start gap-2.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#77658D]"/><p><strong className="font-semibold text-[#514A55]">Synthetic preview only.</strong> No real artist, institution, recipient identity, message, application activity, or funding request is represented here.</p></div></footer>
      </div>
    </main>
  )
}
