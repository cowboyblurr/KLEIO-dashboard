import type { Metadata } from "next"
import Link from "next/link"
import {
  PublicCard,
  PublicEyebrow,
  PublicHero,
  PublicPageShell,
  PublicSection,
} from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"

export const metadata: Metadata = {
  title: "About KLEIO Arthouse",
  description:
    "KLEIO helps artists and institutions manage creative passports, submissions, reviews, and cultural records with clarity.",
}

const cards = [
  {
    title: "Creative Passport",
    body: "A reusable artist profile for bios, statements, CVs, portfolios, documents, links, and application answers.",
  },
  {
    title: "Institution Workspace",
    body: "A structured review environment for open calls, grants, residencies, committees, shortlists, and reports.",
  },
  {
    title: "Cultural Record",
    body: "A cleaner way to preserve review history, applicant context, program decisions, and institutional memory.",
  },
]

export default function Page() {
  return (
    <PublicPageShell active="about">
      <PublicEyebrow>About KLEIO</PublicEyebrow>
      <PublicHero
        title="A shared workspace for artists and the institutions that review them."
        subtitle="KLEIO brings artist materials, open calls, review workflows, committee decisions, and cultural records into one organized environment."
      />

      <div className="mt-14 space-y-10">
        <PublicSection heading="For artists, KLEIO reduces repeated application labor.">
          Artists are often asked to rebuild the same materials across grants, residencies, exhibitions, and open
          calls: bios, statements, CVs, portfolios, project descriptions, work samples, and links. KLEIO turns those
          materials into a reusable Creative Passport that can be reviewed, updated, and adapted for future
          opportunities.
        </PublicSection>
        <PublicSection heading="For institutions, KLEIO organizes the full review process.">
          Institutions need more than a form. They need a clear way to manage submissions, missing materials, reviewer
          assignments, committee notes, shortlists, decisions, and reports. KLEIO gives teams a structured workspace
          for the entire submission lifecycle.
        </PublicSection>
        <PublicSection heading="KLEIO Assist prepares drafts. People make decisions.">
          KLEIO can help prepare draft fields, surface missing materials, and organize next steps. Artists and
          institutions remain in control of what becomes official, what is shared, and what moves forward.
        </PublicSection>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <PublicCard key={card.title}>
            <h3 className="font-serif text-[1.1rem] font-semibold text-[#292631]">{card.title}</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#5A5468]">{card.body}</p>
          </PublicCard>
        ))}
      </div>

      <div
        className="mt-16 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.06)" }}
      >
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          Start with the path that fits your role.
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          Artists can begin building a Creative Passport. Institutions can explore a review workspace built for
          submissions and decisions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]"
          >
            Artist Signup
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8] hover:bg-white"
          >
            Institution Signup
          </Link>
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]">
            Explore Demo
          </ExploreArthouseLink>
        </div>
      </div>
    </PublicPageShell>
  )
}
