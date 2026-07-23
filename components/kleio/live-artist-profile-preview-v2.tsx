"use client"

/* eslint-disable @next/next/no-img-element -- artist assets use short-lived signed Supabase URLs */

import Link from "next/link"
import { useEffect, useState } from "react"
import { ExternalLink, Loader2, MapPin, Pencil, UserRound } from "lucide-react"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { disciplineLabel } from "@/lib/kleio-artist-taxonomy"
import { loadEnhancedArtistProfile, type EnhancedArtistProfile } from "@/lib/kleio-artist-profile"
import { loadPortfolioWorks, type PortfolioWorkRecord } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"

function MultilineSection({ title, value, fallback }: { title: string; value: string; fallback?: string }) {
  if (!value && !fallback) return null
  return <section className={card}><h2 className="font-serif text-xl font-semibold">{title}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#4A4458]">{value || fallback}</p></section>
}

export function LiveArtistProfilePreviewV2() {
  const { locale } = useKleioLocale()
  const [profile, setProfile] = useState<EnhancedArtistProfile | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([loadEnhancedArtistProfile(), loadPortfolioWorks()])
      .then(([artist, portfolio]) => { if (active) { setProfile(artist); setWorks(portfolio) } })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-5 text-[#292631] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <ArtistProfileContextBar active="profile" showKleioAssistStatus />
        <WorkspacePageHeader eyebrow="Artist profile preview" title={profile?.professional_name?.trim() || "Your artist profile"} description="Preview the institution-facing presentation generated from your saved Creative Passport and portfolio." />
        <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-sm leading-relaxed text-[#625C70]"><strong className="text-[#292631]">Private preview.</strong> This page uses only records owned by your authenticated artist account.</div>

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading your artist profile…</div>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}
        {!loading && !error && !profile && <section className={`${card} text-center`}><UserRound className="mx-auto size-7 text-primary" /><h2 className="mt-3 font-serif text-xl font-semibold">Create your Creative Passport first</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">KLEIO will not substitute a synthetic or unrelated artist record.</p><Link href="/artist-dashboard/passport/" className={`${primary} mt-5`}>Create Creative Passport</Link></section>}

        {!loading && !error && profile && (
          <>
            <section className="relative overflow-hidden rounded-[1.75rem] border border-[#E7E1F7] bg-[linear-gradient(135deg,#F7F4FF_0%,#FFFFFF_48%,#F1ECFB_100%)] p-5 shadow-[0_20px_60px_rgba(82,64,130,0.08)] sm:p-8">
              <div className="relative grid gap-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
                <div className="flex justify-center lg:justify-start">
                  {profile.profile_image_url ? <img src={profile.profile_image_url} alt={`${profile.professional_name || "Artist"} profile`} className="size-32 rounded-full border-[6px] border-white object-cover shadow-[0_20px_46px_rgba(82,64,130,0.16)] sm:size-36" style={{ objectPosition: `${profile.profile_image_position_x}% ${profile.profile_image_position_y}%` }} /> : <InitialAvatar name={profile.professional_name || "Artist"} className="size-32 border-[6px] border-white text-3xl shadow-[0_20px_46px_rgba(82,64,130,0.16)] sm:size-36" />}
                </div>
                <div className="min-w-0 text-center lg:text-left">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#5B4B8A]">Artist-controlled profile preview</p>
                  <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{profile.professional_name || "Artist name not added"}</h1>
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-[#7F7890] lg:justify-start"><MapPin className="size-4" />{profile.location || "Location not added"}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">{profile.disciplines.map((tag) => <span key={tag} className="rounded-full border border-[#D8D0F2] bg-white/80 px-2.5 py-1 text-xs font-medium text-[#5B4B8A]">{disciplineLabel(tag, locale)}</span>)}{profile.mediums.map((tag) => <span key={`medium-${tag}`} className="rounded-full border border-[#E7E1F7] bg-white/70 px-2.5 py-1 text-xs text-[#625C70]">{tag}</span>)}</div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start"><Link href="/artist-dashboard/passport/" className={primary}><Pencil className="size-4" />Edit profile information</Link><Link href="/artist-dashboard/portfolio/" className={secondary}>Manage portfolio</Link></div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
              <div className="space-y-5">
                <MultilineSection title="Biography" value={profile.bio} fallback="Add a biography in your Creative Passport." />
                <MultilineSection title="Artist statement" value={profile.artist_statement} fallback="Add an artist statement in your Creative Passport." />
                <MultilineSection title="Practice description" value={profile.practice_description} />
                <section className={card}>
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-xl font-semibold">Selected works</h2><p className="mt-1 text-sm text-muted-foreground">Portfolio records owned by this artist account.</p></div><Link href="/artist-dashboard/portfolio/" className={secondary}>Manage works</Link></div>
                  {works.length === 0 ? <p className="mt-4 rounded-xl bg-[#F7F4FF] p-4 text-sm text-muted-foreground">No portfolio works have been added yet.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{works.map((work) => <article key={work.id} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white">{work.image_url ? <img src={work.image_url} alt={work.title} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[#F7F4FF] text-sm text-muted-foreground">No image uploaded</div>}<div className="p-3"><h3 className="text-sm font-semibold">{work.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{[work.year, work.medium].filter(Boolean).join(" · ")}</p>{work.description && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{work.description}</p>}</div></article>)}</div>}
                </section>
              </div>

              <div className="space-y-5">
                <MultilineSection title="Education" value={profile.education} />
                <MultilineSection title="Exhibition history" value={profile.exhibition_history} />
                <MultilineSection title="Awards" value={profile.awards} />
                {(profile.website_url || profile.instagram_url) && <section className={card}><h2 className="font-serif text-lg font-semibold">Links</h2><div className="mt-4 space-y-2">{profile.website_url && <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm hover:bg-[#F7F4FF]">Website<ExternalLink className="size-4 text-[#5B4B8A]" /></a>}{profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm hover:bg-[#F7F4FF]">Instagram<ExternalLink className="size-4 text-[#5B4B8A]" /></a>}</div></section>}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
