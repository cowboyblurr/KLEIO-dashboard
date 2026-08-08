import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "KLEIO — Recipient Review Room Demo",
  description: "Synthetic preview of KLEIO's recipient submission review experience.",
  robots: { index: false, follow: false, nocache: true },
}

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
  {
    title: "Salt Archive I",
    year: "2026",
    medium: "Archival pigment print",
    dimensions: "40 × 60 in.",
    description: "Synthetic artwork used to demonstrate the editorial artwork treatment inside the recipient review room.",
    background: "radial-gradient(circle at 28% 34%, rgba(247,238,221,.92) 0 10%, transparent 11%), linear-gradient(145deg,#665b50 0%,#c9bda9 33%,#eee6d8 53%,#7c7167 76%,#342e2b 100%)",
  },
  {
    title: "Inheritance Study",
    year: "2026",
    medium: "Photograph, acetate, archival paper",
    dimensions: "30 × 44 in.",
    description: "A second synthetic work showing how image scale, metadata, and context remain subordinate to the artwork itself.",
    background: "linear-gradient(90deg,rgba(36,31,35,.83),rgba(36,31,35,.12) 48%,rgba(234,226,211,.18)), radial-gradient(circle at 70% 40%,#d9cfbf 0 9%,#8e8175 10% 23%,#4c4545 24% 45%,#211f23 70%)",
  },
]

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.69rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">{children}</p>
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2 max-w-3xl font-serif text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-[#27232C] sm:text-[2.35rem]">{children}</h2>
}

export default function RecipientReviewDemoPage() {
  return (
    <main className="min-h-dvh bg-[#F8F5EF] text-[#2D2931] selection:bg-[#E6DDEF] selection:text-[#2D2931]">
      <header className="sticky top-0 z-50 border-b border-[#DDD7CF] bg-[#FCFAF6]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[62px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="font-serif text-lg font-semibold tracking-[0.12em] text-[#302A38]">KLEIO</span>
            <span className="hidden h-4 w-px bg-[#D7D0C9] sm:block" />
            <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#7B737E]">Secure Submission Review</span>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold text-amber-900">Synthetic preview</span>
        </div>
      </header>

      <section className="border-b border-[#DDD7CF] bg-[#FCFAF6]">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="max-w-5xl">
            <Label>ANA MARTÍNEZ · SYNTHETIC ARTIST</Label>
            <h1 className="mt-4 max-w-5xl font-serif text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#242028] sm:text-[4.4rem] lg:text-[5rem]">Between Salt and Memory</h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-[#6F6873]">
              <span>Application to</span><strong className="font-semibold text-[#3B3540]">2027 Emerging Artist Grant</strong><span>·</span><span>Photography · Installation</span><span>·</span><span>Miami, Florida</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#88808D]"><span>Shared by Ana Martínez for this application</span><span>·</span><span>Prepared through KLEIO</span><span>·</span><span>Approved August 7, 2026</span></div>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href="#communication" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#403653] px-5 py-2.5 text-sm font-semibold text-white">Message Applicant</a>
              <a href="#documents" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D9D2E2] bg-[#FFFDFC] px-5 py-2.5 text-sm font-semibold text-[#403653]">Download Submission</a>
              <a href="#artist" className="inline-flex min-h-10 items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-[#554D5F]">View Artist Profile →</a>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-[62px] z-40 border-b border-[#DDD7CF] bg-[#FCFAF6]/96 backdrop-blur-xl" aria-label="Submission sections">
        <div className="mx-auto max-w-[1320px] overflow-x-auto px-4 sm:px-6 lg:px-8"><div className="flex min-w-max items-center gap-1 py-2">
          {[["overview","Overview"],["responses","Responses"],["works","Works"],["project","Project"],["documents","Documents"],["artist","Artist"],["communication","Communication"]].map(([id,label]) => <a key={id} href={`#${id}`} className="rounded-full px-3.5 py-2 text-xs font-semibold text-[#766F7A] hover:bg-[#F1EDF0] hover:text-[#403653]">{label}</a>)}
        </div></div>
      </nav>

      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            <section id="overview" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Application overview</Label><Heading>Understand the proposal before going deep.</Heading>
              <dl className="mt-9 grid border-y border-[#DDD7CF] sm:grid-cols-2 xl:grid-cols-3">
                {[['Applicant','Ana Martínez'],['Discipline','Photography · Installation'],['Applicant location','Miami, Florida'],['Opportunity support','$5,000–$10,000'],['Deadline','October 18, 2026'],['Submission materials','7 items visible in this dossier']].map(([term,value],index) => <div key={term} className={`py-5 sm:px-5 ${index < 3 ? 'border-b border-[#DDD7CF]' : ''}`}><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">{term}</dt><dd className="mt-2 text-sm font-medium leading-6">{value}</dd></div>)}
              </dl>
              <div className="mt-10 max-w-4xl"><h3 className="font-serif text-2xl font-semibold">Proposal synopsis</h3><p className="mt-4 text-[1.03rem] leading-8 text-[#4F4953]">Between Salt and Memory explores migration, domestic archives, and intergenerational memory through photography and site-specific installation. The proposed work brings archival photographs, translucent materials, and spatial interventions together into a quiet environment for considering what families preserve, lose, and reinterpret across generations.</p><p className="mt-3 text-xs leading-5 text-[#8B838F]">Synthetic navigational summary for design demonstration only. It is not a score or recommendation.</p></div>
            </section>

            <section id="responses" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Application responses</Label><Heading>Read the artist’s submission in its own voice.</Heading>
              <div className="mt-10">{responses.map((item,index) => <article key={item.question} className="grid gap-4 border-t border-[#DDD7CF] py-8 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-7 sm:py-10"><span className="font-mono text-xs text-[#948C97]">{String(index+1).padStart(2,'0')}</span><div className="max-w-4xl"><h3 className="font-serif text-2xl font-semibold tracking-[-0.02em]">{item.question}</h3><p className="mt-5 text-[1rem] leading-8 text-[#4F4953]">{item.answer}</p></div></article>)}</div>
            </section>

            <section id="works" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Selected works</Label><Heading>Artwork, given room to be seen.</Heading>
              <div className="mt-10 space-y-16 sm:space-y-20">{works.map((work) => <article key={work.title} className="border-t border-[#DDD7CF] pt-8 sm:pt-10"><div className="min-h-[380px] w-full bg-[#EEEAE4] sm:min-h-[560px]" style={{background: work.background}} aria-label={`Synthetic artwork preview: ${work.title}`} /><div className="grid gap-4 pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.55fr)] sm:gap-10 sm:pt-7"><div><h3 className="font-serif text-2xl font-semibold">{work.title}</h3><p className="mt-2 text-sm leading-6 text-[#766F7A]">{work.year} · {work.medium} · {work.dimensions}</p></div><p className="text-sm leading-7 text-[#5F5863]">{work.description}</p></div></article>)}</div>
            </section>

            <section id="project" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Budget / project structure</Label><Heading>Operational details, preserved in the artist’s submitted language.</Heading>
              <div className="mt-9 border-y border-[#DDD7CF] py-7 text-sm leading-8 text-[#4F4953]"><div className="grid max-w-xl grid-cols-[1fr_auto] gap-x-8"><span>Archival printing</span><span>$3,200</span><span>Fabrication</span><span>$1,500</span><span>Research materials</span><span>$750</span><span>Community programming</span><span>$750</span><span>Contingency</span><span>$500</span><strong className="mt-3">Synthetic total</strong><strong className="mt-3">$6,700</strong></div></div><p className="mt-4 text-xs leading-5 text-[#8B838F]">Demonstration data only. Production KLEIO displays budget structure only when it is part of the artist-approved application.</p>
            </section>

            <section id="documents" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Supporting materials</Label><Heading>Original documents, organized without competing with the work.</Heading>
              <div className="mt-10 border-t border-[#DDD7CF]">{[['Artist CV','Updated July 2026 · PDF'],['Project Budget','PDF · 4 pages'],['Project Timeline','PDF · 2 pages']].map(([name,meta]) => <div key={name} className="flex min-h-20 items-center justify-between gap-4 border-b border-[#DDD7CF] py-4"><div><strong className="font-serif text-lg font-semibold">{name}</strong><span className="mt-1 block text-xs text-[#88808D]">{meta} · synthetic preview</span></div><span className="text-sm font-semibold text-[#574665]">Preview</span></div>)}</div>
            </section>

            <section id="artist" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16">
              <Label>Artist context</Label><Heading>Enough context to understand the practice—without exposing the whole Passport.</Heading>
              <div className="mt-10 max-w-4xl space-y-8"><div><h3 className="font-serif text-2xl font-semibold">Ana Martínez</h3><p className="mt-2 text-sm text-[#766F7A]">Miami, Florida · Photography · Installation</p></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#88808D]">Biography</p><p className="mt-3 text-[.98rem] leading-8 text-[#4F4953]">Ana Martínez is a fictional artist profile created exclusively to demonstrate the recipient-facing KLEIO experience. The production page displays only artist-approved profile material included with the specific submission.</p></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#88808D]">Selected exhibitions</p><p className="mt-3 text-sm leading-7 text-[#5F5863]">Synthetic Exhibition A, 2025 · Synthetic Project Space, 2024 · Demonstration Residency, 2023</p></div></div>
            </section>

            <section id="communication" className="scroll-mt-32 py-12 sm:py-16">
              <Label>Communication</Label><Heading>Continue the submission conversation without breaking context.</Heading>
              <div className="mt-8 border-y border-[#DDD7CF] py-7"><p className="max-w-3xl text-sm leading-7 text-[#655E68]">In the secure production experience, a recipient can message the applicant, verify their email, and preserve the conversation with the application without being forced to create a full institutional account.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><input disabled placeholder="Name" className="min-h-11 rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm"/><input disabled placeholder="Institution / organization" className="min-h-11 rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm"/><input disabled placeholder="Email" className="min-h-11 rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm sm:col-span-2"/><textarea disabled rows={5} placeholder="Message applicant…" className="rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 py-3 text-sm sm:col-span-2"/></div><button disabled className="mt-4 min-h-11 rounded-full bg-[#403653] px-5 text-sm font-semibold text-white opacity-60">Verify email and send</button></div>
            </section>

            <section className="border-y border-[#BDB2C6] bg-[#ECE6EE] px-5 py-9 sm:px-8 sm:py-11"><Label>Institution workflow</Label><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-.035em]">Reviewing more than one applicant?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#5F5664]">KLEIO brings submissions, reviewer notes, conversations, decisions, and application history into one organized workspace.</p><p className="mt-3 text-xs font-medium text-[#675D6C]">No account is required to continue reviewing a legitimate submission.</p><button disabled className="mt-5 min-h-11 rounded-full bg-[#403653] px-5 text-sm font-semibold text-white opacity-60">Create an Institution Workspace</button></section>
          </div>

          <aside className="hidden lg:block"><div className="sticky top-[118px] space-y-8 py-12"><div className="border-t border-[#CFC7CF] pt-5"><p className="text-[.68rem] font-semibold uppercase tracking-[.16em] text-[#88808D]">Submission snapshot</p><dl className="mt-5 space-y-5 text-sm"><div><dt className="text-xs text-[#8B838F]">Artist</dt><dd className="mt-1 font-semibold">Ana Martínez</dd></div><div><dt className="text-xs text-[#8B838F]">Opportunity</dt><dd className="mt-1 font-medium">2027 Emerging Artist Grant</dd></div><div><dt className="text-xs text-[#8B838F]">Deadline</dt><dd className="mt-1 font-medium">October 18, 2026</dd></div><div><dt className="text-xs text-[#8B838F]">Materials visible</dt><dd className="mt-1 font-medium">7</dd></div></dl></div><div className="border-t border-[#CFC7CF] pt-5"><p className="text-[.68rem] font-semibold uppercase tracking-[.16em] text-[#88808D]">Quick actions</p><div className="mt-3 grid gap-2 text-sm font-medium text-[#554D5F]"><a href="#communication">Message applicant</a><a href="#documents">Save review copy</a><a href="#artist">View artist context</a></div></div></div></aside>
        </div>

        <footer className="mt-6 border-t border-[#D5CEC6] py-7 text-xs leading-6 text-[#7B737E]">Synthetic preview only. No real artist, institution, application activity, recipient identity, or funding request is represented on this page. The production Review Room remains token-protected and artist-controlled.</footer>
      </div>
    </main>
  )
}
