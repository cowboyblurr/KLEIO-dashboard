"use client"

/* eslint-disable @next/next/no-img-element -- private profile images use signed Supabase URLs */

import { useEffect, useState } from "react"
import Link from "next/link"
import { ImageIcon, Loader2, Save, Trash2 } from "lucide-react"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { loadArtistPassport, type ArtistPassportRecord } from "@/lib/kleio-live-data"
import {
  loadArtistProfilePresentation,
  saveArtistProfilePresentation,
  uploadArtistProfileImage,
  type ArtistProfilePresentationRecord,
} from "@/lib/kleio-profile-presentation"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 text-sm font-semibold text-white disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"

export function LiveArtistIdentitySettings() {
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [presentation, setPresentation] = useState<ArtistProfilePresentationRecord | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([loadArtistPassport(), loadArtistProfilePresentation()])
      .then(([profile, profilePresentation]) => { if (active) { setPassport(profile); setPresentation(profilePresentation) } })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  async function upload(file: File | null) {
    if (!file || !presentation) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const result = await uploadArtistProfileImage(file)
      const saved = await saveArtistProfilePresentation({ ...presentation, profile_image_path: result.path })
      setPresentation(saved)
      setMessage("Profile photo updated across your artist profile and workspace identity.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the profile photo.")
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!presentation) return
    setBusy(true)
    setError("")
    try {
      const saved = await saveArtistProfilePresentation(presentation)
      setPresentation(saved)
      setMessage("Profile presentation saved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save profile presentation.")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!presentation) return
    setPresentation({ ...presentation, profile_image_path: null, profile_image_url: null, profile_image_position_x: 50, profile_image_position_y: 50 })
    setMessage("Photo removal is ready. Select Save changes to confirm.")
  }

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[900px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Settings" description="Manage the profile photo reused by your Creative Passport, artist profile, and workspace identity." />
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
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">JPG, PNG, or WebP, up to 5 MB. This is the same portrait managed from the Creative Passport.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className={`${secondary} cursor-pointer`}><ImageIcon className="size-4" />{presentation.profile_image_url ? "Replace photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => void upload(event.target.files?.[0] ?? null)} /></label>
                  {presentation.profile_image_path && <button type="button" className={secondary} disabled={busy} onClick={() => void remove()}><Trash2 className="size-4" />Remove</button>}
                  <button type="button" className={primary} disabled={busy} onClick={() => void save()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save changes</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#5B4B8A]"><Link href="/artist-dashboard/passport/">Edit Creative Passport</Link><Link href="/artist-dashboard/profile/">Preview artist profile</Link></div>
              </div>
            </div>
          </section>
        )}
        {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      </div>
    </main>
  )
}
