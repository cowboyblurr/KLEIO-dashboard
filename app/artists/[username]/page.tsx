import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, FileText } from "lucide-react"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { getArtistMaterialReadiness } from "@/lib/kleio-artist-analytics"
import { getArtistProfileByUsername, kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { assetPath } from "@/lib/asset-path"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

export function generateStaticParams() {
  return kleioSyntheticArtistProfiles.map((artist) => ({ username: artist.username }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const artist = getArtistProfileByUsername(username)

  if (!artist) return { title: "Artist Review | KLEIO" }

  return {
    title: `${artist.displayName} | KLEIO Review Profile`,
    description: `Institution review profile for ${artist.displayName}. Synthetic demo record with submitted materials, selected works, and review context.`,
  }
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const artist = getArtistProfileByUsername(username)

  if (!artist) notFound()

  const readiness = getArtistMaterialReadiness(artist)
  const materialEntries = Object.entries(artist.materialsReady)

  return (
    <DashboardShell>
      <main className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto min-w-[760px] max-w-[1120px] space-y-5">
          <Link href="/artists/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] transition-opacity hover:opacity-75">
            <ArrowLeft className="size-3.5" /> Back to artist directory
          </Link>

          <section className="rounded-[1.6rem] border bg-white p-6" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="size-20 overflow-hidden rounded-2xl border bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(artist.portrait)} alt={artist.displayName} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Creative Passport · Institution review view</p>
                  <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight" style={{ color: inkColor }}>{artist.displayName}</h1>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>{artist.role} · {artist.location}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/artist/${artist.username}/`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ExternalLink className="size-3.5" /> Public profile</Link>
                    <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: lavenderDeep }}>Open review queue</Link>
                  </div>
                </div>
              </div>

              <div className="min-w-[220px] rounded-2xl border bg-[#FDFBFF] p-4" style={{ borderColor: lavenderSoftLine }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Materials readiness</p>
                <p className="mt-2 font-serif text-3xl font-semibold" style={{ color: inkColor }}>{readiness.pct}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1ECFB]"><div className="h-full rounded-full bg-[#5B4B8A]" style={{ width: `${readiness.pct}%` }} /></div>
                <p className="mt-2 text-xs" style={{ color: mutedColor }}>{readiness.readyCount} of {readiness.totalCount} core materials ready.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Artist bio</p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{artist.shortBio}</p>
              </section>

              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Artist statement</p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{artist.artistStatement}</p>
              </section>

              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Selected works</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {artist.selectedWorks.map((work) => (
                    <Link key={work.title} href={`/artist/${artist.username}/`} className="overflow-hidden rounded-xl border transition-colors hover:border-[#A997E8]" style={{ borderColor: lavenderSoftLine }}>
                      <span className="block aspect-[4/3] bg-[#F7F4FF]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetPath(work.image)} alt={work.title} className="h-full w-full object-cover" />
                      </span>
                      <span className="block px-3 py-2 text-sm font-medium" style={{ color: inkColor }}>{work.title}</span>
                      <span className="block px-3 pb-3 text-xs" style={{ color: mutedColor }}>{work.year} · {work.medium}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Submitted materials</p>
                <div className="mt-3 space-y-2">
                  {materialEntries.map(([label, ready]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2" style={{ borderColor: lavenderSoftLine }}>
                      <span className="flex items-center gap-2 text-xs font-medium" style={{ color: inkColor }}><FileText className="size-3.5 text-[#7F7890]" /> {label.replace(/([A-Z])/g, " $1")}</span>
                      <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ backgroundColor: ready ? "#F0FBF6" : "#FFF7E8", color: ready ? "#2F7A55" : "#9A6A1F" }}>{ready ? "Ready" : "Needs attention"}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Practice tags</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {artist.practiceTags.map((tag) => <span key={tag} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.65rem] font-medium text-[#5B4B8A]">{tag}</span>)}
                </div>
              </section>

              <section className="rounded-2xl border bg-[#FDFBFF] p-4" style={{ borderColor: lavenderSoftLine }}>
                <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>Synthetic demo profile. This internal view is for review workflow context; the public artist passport remains available separately.</p>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
