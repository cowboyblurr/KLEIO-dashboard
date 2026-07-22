"use client"

/* eslint-disable @next/next/no-img-element -- signed Supabase image URLs are short-lived */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, MapPin, Pencil, Sparkles, UserRound } from "lucide-react"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  type ArtistPassportRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"

function splitHistory(value: string) {
  return value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function LiveArtistProfilePreview() {
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    Promise.all([loadArtistPassport(), loadPortfolioWorks()])
      .then(([profile, portfolio]) => {
        if (!active) return
        setPassport(profile)
        setWorks(portfolio)
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const history = useMemo(() => splitHistory(passport?.exhibition_history || ""), [passport?.exhibition_history])
  const awards = useMemo(() => splitHistory(passport?.awards || ""), [passport?.awards])

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-5 text-[#292631] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <ArtistProfileContextBar active="profile" showCleoStatus />
        <WorkspacePageHeader
          eyebrow="Artist profile preview"
          title={passport?.professional_name?.trim() || "Your artist profile"}
          description="Preview the presentation generated from your saved Creative Passport and portfolio. This is separate from the private workspace and the reusable source record."
        />

        <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-sm leading-relaxed text-[#625C70]">
          <strong className="text-[#292631]">Private preview.</strong> This route is visible only inside your authenticated Artist Workspace. Public sharing is not enabled, so KLEIO does not present this page as a live public profile or provide a share link.
        </div>

        {loading && (
          <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}>
            <Loader2 className="size-4 animate-spin" />
            Loading your profile preview…
          </div>
        )}

        {error && (
          <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>
            {error}
          </div>
        )}

        {!loading && !error && !passport && (
          <section className={`${card} text-center`}>
            <UserRound className="mx-auto size-7 text-primary" />
            <h2 className="mt-3 font-serif text-xl font-semibold">Create your Creative Passport first</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Your artist profile preview is generated only from information saved to your account. KLEIO will not substitute a synthetic artist or demo record.
            </p>
            <Link href="/artist-dashboard/passport/" className={`${primary} mt-5`}>
              Create Creative Passport
            </Link>
          </section>
        )}

        {!loading && !error && passport && (
          <>
            <section className="relative overflow-hidden rounded-[1.75rem] border border-[#E7E1F7] bg-[linear-gradient(135deg,#F7F4FF_0%,#FFFFFF_48%,#F1ECFB_100%)] p-5 shadow-[0_20px_60px_rgba(82,64,130,0.08)] sm:p-8">
              <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/80 blur-3xl" />
              <div className="relative grid gap-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
                <div className="flex justify-center lg:justify-start">
                  {works.find((work) => work.image_url)?.image_url ? (
                    <img
                      src={works.find((work) => work.image_url)?.image_url || ""}
                      alt={`${passport.professional_name || "Artist"} profile work`}
                      className="size-32 rounded-full border-[6px] border-white object-cover shadow-[0_20px_46px_rgba(82,64,130,0.16)] sm:size-36"
                    />
                  ) : (
                    <InitialAvatar name={passport.professional_name || "Artist"} className="size-32 border-[6px] border-white text-3xl shadow-[0_20px_46px_rgba(82,64,130,0.16)] sm:size-36" />
                  )}
                </div>

                <div className="min-w-0 text-center lg:text-left">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#5B4B8A]">Artist-controlled profile preview</p>
                  <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                    {passport.professional_name || "Artist name not added"}
                  </h1>
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-[#7F7890] lg:justify-start">
                    <MapPin className="size-4" />
                    {passport.location || "Location not added"}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                    {[...passport.disciplines, ...passport.mediums].map((tag) => (
                      <span key={tag} className="rounded-full border border-[#D8D0F2] bg-white/80 px-2.5 py-1 text-xs font-medium text-[#5B4B8A]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                    <Link href="/artist-dashboard/passport/" className={primary}>
                      <Pencil className="size-4" />
                      Edit profile information
                    </Link>
                    <Link href="/artist-dashboard/portfolio/" className={secondary}>
                      Manage portfolio
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
              <div className="space-y-5">
                <section className={card}>
                  <h2 className="font-serif text-xl font-semibold">About the practice</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#4A4458]">
                    {passport.bio || "Add a biography in your Creative Passport to introduce your practice."}
                  </p>
                  <h3 className="mt-6 text-sm font-semibold">Artist statement</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#7F7890]">
                    {passport.artist_statement || "Add an artist statement in your Creative Passport."}
                  </p>
                  {passport.practice_description && (
                    <>
                      <h3 className="mt-6 text-sm font-semibold">Practice description</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#7F7890]">{passport.practice_description}</p>
                    </>
                  )}
                </section>

                <section className={card}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl font-semibold">Selected works</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Works connected to this authenticated artist account.</p>
                    </div>
                    <Link href="/artist-dashboard/portfolio/" className={secondary}>
                      Manage works
                    </Link>
                  </div>

                  {works.length === 0 ? (
                    <p className="mt-4 rounded-xl bg-[#F7F4FF] p-4 text-sm text-muted-foreground">No portfolio works have been added yet.</p>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {works.map((work) => (
                        <article key={work.id} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white">
                          {work.image_url ? (
                            <img src={work.image_url} alt={work.title} className="aspect-[4/3] w-full object-cover" />
                          ) : (
                            <div className="grid aspect-[4/3] place-items-center bg-[#F7F4FF] text-sm text-muted-foreground">No image uploaded</div>
                          )}
                          <div className="p-3">
                            <h3 className="text-sm font-semibold">{work.title}</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">{[work.year, work.medium].filter(Boolean).join(" · ")}</p>
                            {work.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{work.description}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-5">
                <section className={card}>
                  <h2 className="font-serif text-lg font-semibold">Profile source and visibility</h2>
                  <dl className="mt-4 space-y-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</dt>
                      <dd className="mt-1">Saved Creative Passport and portfolio records owned by this account.</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visibility</dt>
                      <dd className="mt-1">Private preview only. No public sharing route is active.</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile completeness</dt>
                      <dd className="mt-1">{passport.profile_completion}%</dd>
                    </div>
                  </dl>
                </section>

                <section className={card}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F1ECFB] text-[#5B4B8A]">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <h2 className="font-serif text-lg font-semibold">Cleo Assist boundaries</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Cleo may eventually help draft or organize profile language, but suggestions must remain editable and require your approval. Cleo is not active on this connected profile screen and does not publish, verify, or overwrite your information.
                      </p>
                    </div>
                  </div>
                </section>

                {(passport.website_url || passport.instagram_url) && (
                  <section className={card}>
                    <h2 className="font-serif text-lg font-semibold">Links</h2>
                    <div className="mt-4 space-y-2">
                      {passport.website_url && (
                        <a href={passport.website_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm hover:bg-[#F7F4FF]">
                          Website
                          <ExternalLink className="size-4 text-[#5B4B8A]" />
                        </a>
                      )}
                      {passport.instagram_url && (
                        <a href={passport.instagram_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm hover:bg-[#F7F4FF]">
                          Instagram
                          <ExternalLink className="size-4 text-[#5B4B8A]" />
                        </a>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {(passport.education || history.length > 0 || awards.length > 0) && (
              <section className={card}>
                <h2 className="font-serif text-xl font-semibold">Experience and recognition</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{passport.education || "Not added"}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exhibitions and residencies</h3>
                    {history.length ? (
                      <ul className="mt-2 space-y-2 text-sm">
                        {history.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : <p className="mt-2 text-sm">Not added</p>}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Awards</h3>
                    {awards.length ? (
                      <ul className="mt-2 space-y-2 text-sm">
                        {awards.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : <p className="mt-2 text-sm">Not added</p>}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
