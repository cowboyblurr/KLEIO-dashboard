"use client"

/* eslint-disable @next/next/no-img-element -- private profile images use signed URLs */

import { useEffect, useState } from "react"
import Link from "next/link"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { loadArtistPassport, type ArtistPassportRecord } from "@/lib/kleio-live-data"
import { loadArtistProfilePresentation, type ArtistProfilePresentationRecord } from "@/lib/kleio-profile-presentation"

export function ApplicationArtistIdentityBar() {
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [presentation, setPresentation] = useState<ArtistProfilePresentationRecord | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([loadArtistPassport(), loadArtistProfilePresentation()])
      .then(([profile, profilePresentation]) => { if (active) { setPassport(profile); setPresentation(profilePresentation) } })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  if (!passport || !presentation) return null

  return (
    <div className="shrink-0 border-b border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-[1120px] items-center gap-3">
        {presentation.profile_image_url ? <img src={presentation.profile_image_url} alt="" className="size-10 rounded-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} /> : <InitialAvatar name={passport.professional_name || "Artist"} className="size-10 text-xs" />}
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application identity</p><p className="truncate text-sm font-medium">{passport.professional_name || "Artist name not added"}</p></div>
        <Link href="/artist-dashboard/passport/" className="rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A]">Update Passport</Link>
      </div>
    </div>
  )
}
