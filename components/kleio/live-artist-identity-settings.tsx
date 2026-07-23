"use client"

/* eslint-disable @next/next/no-img-element -- private profile images use signed Supabase URLs */

import { useEffect, useState } from "react"
import Link from "next/link"
import { EyeOff, ImageIcon, Loader2, Save, ShieldCheck, Trash2 } from "lucide-react"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { loadArtistPassport, loadPortfolioWorks, type ArtistPassportRecord, type PortfolioWorkRecord } from "@/lib/kleio-live-data"
import {
  loadArtistProfilePresentation,
  saveArtistProfilePresentation,
  uploadArtistProfileImage,
  type ArtistProfilePresentationRecord,
} from "@/lib/kleio-profile-presentation"
import {
  loadMyArtistDiscoveryProfile,
  saveMyArtistDiscoveryProfile,
  type DiscoveryContactMode,
  type DiscoveryVisibility,
} from "@/lib/kleio-artist-discovery"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 text-sm font-semibold text-white disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"
const availabilityOptions = ["residencies", "exhibitions", "commissions", "collaborations", "public art"]

export function LiveArtistIdentitySettings() {
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [presentation, setPresentation] = useState<ArtistProfilePresentationRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [visibility, setVisibility] = useState<DiscoveryVisibility>("private")
  const [contactMode, setContactMode] = useState<DiscoveryContactMode>("opportunity_invites")
  const [availability, setAvailability] = useState<string[]>([])
  const [themes, setThemes] = useState("")
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([loadArtistPassport(), loadArtistProfilePresentation(), loadPortfolioWorks(), loadMyArtistDiscoveryProfile()])
      .then(([profile, profilePresentation, portfolio, discovery]) => {
        if (!active) return
        setPassport(profile)
        setPresentation(profilePresentation)
        setWorks(portfolio)
        setVisibility(discovery?.visibility || "private")
        setContactMode(discovery?.contact_mode || "opportunity_invites")
        setAvailability(discovery?.availability || [])
        setThemes((discovery?.themes || []).join(", "))
        setSelectedWorkIds(discovery?.selected_work_ids?.length ? discovery.selected_work_ids : portfolio.slice(0, 6).map((work) => work.id))
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  async function upload(file: File | null) {
    if (!file || !presentation) return
    setBusy(true); setError(""); setMessage("")
    try {
      const result = await uploadArtistProfileImage(file)
      const saved = await saveArtistProfilePresentation({ ...presentation, profile_image_path: result.path })
      setPresentation(saved)
      setMessage("Profile photo updated across your artist profile and workspace identity.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update the profile photo.") }
    finally { setBusy(false) }
  }

  async function savePresentation() {
    if (!presentation) return
    setBusy(true); setError("")
    try { setPresentation(await saveArtistProfilePresentation(presentation)); setMessage("Profile presentation saved.") }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save profile presentation.") }
    finally { setBusy(false) }
  }

  async function saveDiscovery() {
    if (!passport) return
    if (visibility === "institutions" && !passport.professional_name.trim()) { setError("Add your professional name before enabling institution discovery."); return }
    setBusy(true); setError(""); setMessage("")
    try {
      const saved = await saveMyArtistDiscoveryProfile({
        visibility,
        contact_mode: visibility === "institutions" ? contactMode : "none",
        availability,
        themes: themes.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
        selected_work_ids: selectedWorkIds,
      })
      setVisibility(saved.visibility)
      setMessage(saved.visibility === "institutions" ? "Institution discovery is active with the selected profile fields and works." : saved.visibility === "applications_only" ? "Your profile is visible only through applications you submit." : "Your discovery profile is private.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save discovery settings.") }
    finally { setBusy(false) }
  }

  function toggleAvailability(value: string) { setAvailability((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]) }
  function toggleWork(id: string) { setSelectedWorkIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 8 ? [...current, id] : current) }

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[980px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Settings" description="Manage your shared profile identity and decide whether authenticated institutions may discover your artist-approved presentation." />
        {busy && !presentation && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading artist settings…</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {presentation && (
          <section className={card}>
            <div className="grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-[#D8D0F2] bg-[#F7F4FF]">
                {presentation.profile_image_url ? <img src={presentation.profile_image_url} alt="Profile preview" className="size-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} /> : <InitialAvatar name={passport?.professional_name || "Artist"} className="size-20 text-xl" />}
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold">Profile photo</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">JPG, PNG, or WebP, up to 5 MB. This portrait is reused by your Creative Passport, artist profile, and any discovery publication you approve.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className={`${secondary} cursor-pointer`}><ImageIcon className="size-4" />{presentation.profile_image_url ? "Replace photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => void upload(event.target.files?.[0] ?? null)} /></label>
                  {presentation.profile_image_path && <button type="button" className={secondary} disabled={busy} onClick={() => { setPresentation({ ...presentation, profile_image_path: null, profile_image_url: null, profile_image_position_x: 50, profile_image_position_y: 50 }); setMessage("Photo removal is ready. Select Save changes to confirm.") }}><Trash2 className="size-4" />Remove</button>}
                  <button type="button" className={primary} disabled={busy} onClick={() => void savePresentation()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save changes</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#5B4B8A]"><Link href="/artist-dashboard/passport/">Edit Creative Passport</Link><Link href="/artist-dashboard/profile/">Preview artist profile</Link></div>
              </div>
            </div>
          </section>
        )}

        {passport && (
          <section className={`${card} relative overflow-hidden`}>
            <div aria-hidden="true" className="absolute -right-24 -top-24 size-64 rounded-full bg-[#EEE8FA]/70 blur-3xl" />
            <div className="relative">
              <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F1ECFB] text-[#5B4B8A]">{visibility === "institutions" ? <ShieldCheck className="size-5" /> : <EyeOff className="size-5" />}</span><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#6A5896]">Artist-controlled discovery</p><h2 className="mt-1 font-serif text-2xl tracking-[-0.03em]">Choose who can find your profile</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#746E80]">Discovery is off by default. Institutions never receive your private CV, application drafts, account details, private email, references, reviewer notes, or unrelated application history through this setting.</p></div></div>

              <fieldset className="mt-6 grid gap-3 lg:grid-cols-3">
                {[
                  { value: "private", title: "Private", body: "Only you can view the live profile outside a submitted application." },
                  { value: "applications_only", title: "Applications only", body: "Institutions see preserved snapshots only when you submit to them." },
                  { value: "institutions", title: "Institution discovery", body: "Authenticated institution accounts may browse this approved publication." },
                ].map((option) => <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 ${visibility === option.value ? "border-[#A997E8] bg-[#F8F5FD]" : "border-[#E7E1F7] bg-white"}`}><input type="radio" name="discovery-visibility" value={option.value} checked={visibility === option.value} onChange={() => setVisibility(option.value as DiscoveryVisibility)} className="sr-only" /><span className="text-sm font-semibold text-[#292631]">{option.title}</span><span className="mt-1 block text-xs leading-5 text-[#7F7890]">{option.body}</span></label>)}
              </fieldset>

              {visibility === "institutions" && <div className="mt-6 space-y-6 border-t border-[#E7E1F7] pt-6">
                <div><h3 className="text-sm font-semibold text-[#292631]">Opportunity invitations</h3><p className="mt-1 text-xs leading-5 text-[#7F7890]">Institutions may initiate contact only through an active listing they own or manage. You cannot be added to general bulk outreach.</p><label className="mt-3 flex items-start gap-3 rounded-xl border border-[#E7E1F7] p-3"><input type="checkbox" checked={contactMode === "opportunity_invites"} onChange={(event) => setContactMode(event.target.checked ? "opportunity_invites" : "none")} className="mt-1" /><span><strong className="text-sm text-[#292631]">Allow active-listing invitations</strong><span className="mt-1 block text-xs text-[#7F7890]">You may review, reply, express interest, decline, or apply. An invitation never creates an application.</span></span></label></div>
                <div><h3 className="text-sm font-semibold text-[#292631]">Availability shown to institutions</h3><div className="mt-3 flex flex-wrap gap-2">{availabilityOptions.map((value) => <button key={value} type="button" onClick={() => toggleAvailability(value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${availability.includes(value) ? "border-[#A997E8] bg-[#F1ECFB] text-[#5B4B8A]" : "border-[#E7E1F7] bg-white text-[#746E80]"}`}>{value}</button>)}</div></div>
                <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Practice themes — comma separated</span><input value={themes} onChange={(event) => setThemes(event.target.value)} placeholder="Community memory, ecology, public space" className="h-10 rounded-xl border border-[#E7E1F7] px-3 text-sm font-normal text-[#292631]" /></label>
                <div><div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#292631]">Works included in discovery</h3><p className="mt-1 text-xs text-[#7F7890]">Choose up to eight works. Other portfolio records remain private unless submitted in an application.</p></div><span className="text-xs font-semibold text-[#6A5896]">{selectedWorkIds.length}/8</span></div>{works.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{works.map((work) => <button key={work.id} type="button" onClick={() => toggleWork(work.id)} className={`overflow-hidden rounded-xl border text-left ${selectedWorkIds.includes(work.id) ? "border-[#A997E8] ring-2 ring-[#A997E8]/15" : "border-[#E7E1F7]"}`}><div className="grid aspect-[4/3] place-items-center bg-[#F7F4FF]">{work.image_url ? <img src={work.image_url} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5 text-[#7F7890]" />}</div><div className="p-3"><p className="truncate text-sm font-semibold text-[#292631]">{work.title}</p><p className="mt-1 truncate text-xs text-[#7F7890]">{[work.year, work.medium].filter(Boolean).join(" · ")}</p></div></button>)}</div> : <p className="mt-3 rounded-xl bg-[#F7F4FF] p-4 text-sm text-[#7F7890]">Add portfolio works before publishing an artwork-led discovery profile.</p>}</div>
              </div>}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] pt-5"><p className="max-w-2xl text-xs leading-5 text-[#7F7890]">Turning discovery off removes this publication from future institution searches. It does not delete applications, submitted snapshots, or legitimate existing conversations.</p><button type="button" disabled={busy} onClick={() => void saveDiscovery()} className={primary}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save discovery settings</button></div>
            </div>
          </section>
        )}
        {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      </div>
    </main>
  )
}
