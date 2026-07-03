import type { Metadata } from "next"
import Link from "next/link"
import { PublicCard, PublicEyebrow, PublicHero, PublicPageShell } from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"

export const metadata: Metadata = {
  title: "KLEIO Journal",
  description:
    "Field notes on artist applications, institutional review, cultural records, and the development of KLEIO.",
}

const articles = [
  {
    label: "Artist workflow",
    title: "Why artists need reusable application materials",
    excerpt:
      "Most opportunities ask for familiar pieces: a bio, statement, CV, portfolio, proposal, work samples, and links. KLEIO begins with the idea that artists should not have to rebuild those materials from scratch every time.",
  },
  {
    label: "Institution workflow",
    title: "What institutions need beyond an intake form",
    excerpt:
      "A form collects submissions. A review workspace helps teams manage eligibility, missing materials, reviewer progress, committee notes, shortlists, decisions, and reports.",
  },
  {
    label: "Product principle",
    title: "KLEIO Assist is a drafting layer, not a decision layer",
    excerpt:
      "The role of assistive technology in KLEIO is to prepare fields, organize context, and surface gaps. Artists and institutions decide what becomes official.",
  },
  {
    label: "Build note",
    title: "From dashboard to submission lifecycle",
    excerpt:
      "The current KLEIO demo is moving from a single dashboard into a full journey: homepage, role choice, onboarding, artist passport, institution workspace, review queue, shortlist, and reports.",
  },
]

export default function Page() {
  return (
    <PublicPageShell active="journal">
      <PublicEyebrow>Journal</PublicEyebrow>
      <PublicHero
        title="Field notes on applications, review, and cultural memory."
        subtitle="The KLEIO Journal is a place for short notes on what we are building, what we are learning from artists and institutions, and where the submission process needs better tools."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <PublicCard key={article.title}>
            <span className="inline-flex items-center rounded-full bg-[#F1ECFB] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#5B4B8A]">
              {article.label}
            </span>
            <h2 className="mt-3 font-serif text-[1.2rem] font-semibold leading-snug tracking-tight text-[#292631]">
              {article.title}
            </h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#5A5468]">{article.excerpt}</p>
          </PublicCard>
        ))}
      </div>

      <p className="mt-8 max-w-[720px] text-[0.9rem] leading-relaxed text-[#6F6882]">
        These early notes are part of the build process. As KLEIO develops, the Journal will document product
        decisions, artist pain points, institutional workflows, and pilot learnings.
      </p>

      <div
        className="mt-16 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.06)" }}
      >
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          Follow the build. Test the workflow.
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          KLEIO is being shaped through working demos, institutional conversations, and artist-centered product
          decisions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]">
            Explore Demo
          </ExploreArthouseLink>
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            Create Artist Passport
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            Create Institution Workspace
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
