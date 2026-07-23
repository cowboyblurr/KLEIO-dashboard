import Link from "next/link"
import { FileText, MapPin } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { internalArtistHref } from "@/lib/kleio-entity-routes"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"

export function ApplicantRecordsPreview() {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFD] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Guided demonstration · synthetic records"
          title="Applicant Records"
          description="Preserved application snapshots and review context for artists who submitted to this sample institution. These are not live user records."
          secondaryCta={{ label: "Artist Discovery", href: "/artists/" }}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kleioSyntheticArtistProfiles.map((artist, index) => (
            <article key={artist.username} className="rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]">
              <div className="flex items-start gap-3">
                <div className="size-14 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(artist.portrait)} alt="" className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-serif text-lg font-semibold text-[#292631]">{artist.displayName}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7F7890]"><MapPin className="size-3" />{artist.location}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-[#625C70]">{artist.shortBio}</p>
              <div className="mt-4 border-t border-[#E7E1F7] pt-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6A5896]">Submitted snapshot</p>
                <p className="mt-2 text-xs text-[#7F7890]">Sample application {index + 1} · Review context preserved separately from the artist&rsquo;s current profile.</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={internalArtistHref(artist.username)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3 text-xs font-semibold text-white"><FileText className="size-3.5" />Review record</Link>
                <Link href="/submissions/" className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-[#D8D0F2] px-3 text-xs font-semibold text-[#5B4B8A]">Submissions</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
