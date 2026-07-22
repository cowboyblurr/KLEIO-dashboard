"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FileText, Loader2, MapPin, TriangleAlert, UserRound } from "lucide-react"
import { loadInstitutionApplications, type ApplicationRecord } from "@/lib/kleio-live-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"

type ApplicantArtist = {
  id: string
  name: string
  email: string
  location: string
  bio: string
  disciplines: string[]
  applications: ApplicationRecord[]
}

function snapshotString(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  return typeof value === "string" ? value.trim() : ""
}

function snapshotList(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []
}

export function LiveInstitutionArtists() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    loadInstitutionApplications()
      .then((rows) => {
        if (active) setApplications(rows)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load applicant profiles.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const artists = useMemo(() => {
    const byArtist = new Map<string, ApplicantArtist>()
    for (const application of applications) {
      const existing = byArtist.get(application.artist_user_id)
      if (existing) {
        existing.applications.push(application)
        continue
      }
      const snapshot = application.profile_snapshot || {}
      byArtist.set(application.artist_user_id, {
        id: application.artist_user_id,
        name: application.artist_name || "Applicant artist",
        email: application.artist_email || "",
        location: snapshotString(snapshot, "location"),
        bio: snapshotString(snapshot, "bio") || snapshotString(snapshot, "practice_description"),
        disciplines: snapshotList(snapshot, "disciplines"),
        applications: [application],
      })
    }
    return [...byArtist.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [applications])

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Institution workspace"
          title="Applicant artist records"
          description="Creative Passport snapshots from artists who submitted to calls owned by this institution. No guided-demo profiles are shown here."
          primaryCta={{ label: "Open submissions", href: "/submissions/" }}
        />

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading applicant records…</div>}
        {error && <div role="alert" className={`${card} flex items-start gap-3 border-red-200 text-sm text-red-700`}><TriangleAlert className="mt-0.5 size-4 shrink-0" />{error}</div>}

        {!loading && !error && !artists.length && (
          <section className={`${card} text-center`}>
            <UserRound className="mx-auto size-6 text-primary" />
            <h2 className="mt-3 font-serif text-xl font-semibold">No applicant profiles yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Artist records will appear after artists submit to one of this institution’s calls.</p>
          </section>
        )}

        {!loading && !error && artists.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {artists.map((artist) => (
              <article key={artist.id} className={card}>
                <div className="flex items-start gap-3">
                  <InitialAvatar name={artist.name} className="size-11 text-sm" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-serif text-lg font-semibold text-[#292631]">{artist.name}</h2>
                    {artist.location && <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7F7890]"><MapPin className="size-3" />{artist.location}</p>}
                  </div>
                </div>

                {artist.disciplines.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {artist.disciplines.slice(0, 4).map((discipline) => <span key={discipline} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A]">{discipline}</span>)}
                  </div>
                )}

                <p className="mt-4 line-clamp-4 min-h-20 text-sm leading-relaxed text-[#6F6882]">{artist.bio || "No biography was included in the submitted Creative Passport snapshot."}</p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E7E1F7] pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7F7890]"><FileText className="size-3.5" />{artist.applications.length} {artist.applications.length === 1 ? "application" : "applications"}</span>
                  <Link href="/submissions/" className="text-xs font-semibold text-[#5B4B8A]">Review submissions →</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
