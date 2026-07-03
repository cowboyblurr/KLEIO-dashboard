import type { Metadata } from "next"
import Link from "next/link"
import { PublicEyebrow, PublicHero, PublicPageShell } from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"

export const metadata: Metadata = {
  title: "KLEIO Manifesto",
  description: "The principles behind KLEIO: artist control, institutional clarity, and cultural memory.",
}

const principles = [
  {
    heading: "Artists should remain the authors of their own record.",
    body: "A platform should help artists prepare, organize, and reuse their materials without flattening their voice. KLEIO supports the work around the work while leaving authorship with the artist.",
  },
  {
    heading: "Review should be structured without becoming cold.",
    body: "Committees need criteria, context, notes, progress, and accountability. Structure should make the process clearer, not less human.",
  },
  {
    heading: "Institutions need memory, not just intake.",
    body: "A submission system should not disappear after a deadline. KLEIO treats programs, applicants, reviews, shortlists, and reports as part of a living cultural record.",
  },
  {
    heading: "AI should assist. It should not decide.",
    body: "KLEIO Assist can prepare drafts, identify gaps, and organize next actions. It does not replace artistic judgment, curatorial context, or institutional responsibility.",
  },
  {
    heading: "The administrative layer should not exhaust the creative one.",
    body: "Applications, grants, residencies, and open calls are necessary pathways, but they often create repeated labor for artists and fragmented work for institutions. KLEIO is designed to reduce that drag.",
  },
]

export default function Page() {
  return (
    <PublicPageShell active="manifesto">
      <PublicEyebrow>Manifesto</PublicEyebrow>
      <PublicHero
        title="Creative work deserves better infrastructure."
        subtitle="KLEIO is built around a simple belief: artists should not have to keep rebuilding their professional identity, and institutions should not have to manage cultural decisions through scattered files, forms, and inboxes."
      />

      <ol className="mt-14 space-y-8">
        {principles.map((principle, index) => (
          <li key={principle.heading} className="flex gap-5 border-t border-[#E7E1F7] pt-8 first:border-t-0 first:pt-0">
            <span className="mt-1 shrink-0 font-serif text-[1.1rem] font-semibold text-[#A997E8] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-[1.3rem] font-semibold tracking-tight text-[#292631]">
                {principle.heading}
              </h2>
              <p className="mt-2 max-w-[720px] text-[0.95rem] leading-relaxed text-[#5A5468]">{principle.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <blockquote
        className="mt-14 rounded-2xl border-l-2 border-[#A997E8] bg-[#F7F4FF] px-6 py-6 font-serif text-[1.15rem] italic leading-relaxed text-[#3A3448]"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.05)" }}
      >
        KLEIO exists to make the path between creative work and institutional opportunity clearer, more organized, and
        easier to preserve.
      </blockquote>

      <div className="mt-14 text-center">
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          Build the record with intention.
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          Explore the demo as an artist or institution and see how KLEIO connects materials, review, and memory.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]">
            Explore Arthouse
          </ExploreArthouseLink>
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            Artist Signup
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            Institution Signup
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
