"use client"

/* eslint-disable @next/next/no-img-element -- artist profile images use signed Supabase URLs */

import Link from "next/link"
import { useEffect, useState } from "react"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { loadEnhancedArtistProfile, type EnhancedArtistProfile } from "@/lib/kleio-artist-profile"

export function ApplicationArtistIdentityBar() {
  const [profile, setProfile] = useState<EnhancedArtistProfile | null>(null)

  useEffect(() => {
    let active = true
    void loadEnhancedArtistProfile().then((record) => { if (active) setProfile(record) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  if (!profile) return null

  return (
    <div className="shrink-0 border-b border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-[1120px] items-center gap-3">
        {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" className="size-10 rounded-full object-cover" style={{ objectPosition: `${profile.profile_image_position_x}% ${profile.profile_image_position_y}%` }} /> : <InitialAvatar name={profile.professional_name || "Artist"} className="size-10 text-xs" />}
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application identity</p><p className="truncate text-sm font-medium">{profile.professional_name || "Artist name not added"}</p></div>
        <Link href="/artist-dashboard/passport/" className="rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A]">Update Passport</Link>
      </div>
    </div>
  )
}
