"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { ArtistProfileImageControl } from "@/components/kleio/artist-profile-image-control"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { loadEnhancedArtistProfile, type EnhancedArtistProfile } from "@/lib/kleio-artist-profile"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]"

export function LiveArtistSettings() {
  const [profile, setProfile] = useState<EnhancedArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void loadEnhancedArtistProfile().then((record) => { if (active) setProfile(record) }).catch((reason: Error) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[900px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Settings" description="Manage your account-facing identity and move to the full Creative Passport editor for profile content." />
        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading artist settings…</div>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}
        {!loading && profile && <section className={card}><ArtistProfileImageControl name={profile.professional_name} value={{ path: profile.profile_image_path, url: profile.profile_image_url, positionX: profile.profile_image_position_x, positionY: profile.profile_image_position_y }} onChange={(image) => setProfile((current) => current ? { ...current, profile_image_path: image.path, profile_image_url: image.url, profile_image_position_x: image.positionX, profile_image_position_y: image.positionY } : current)} /><div className="mt-5 flex flex-wrap gap-2"><Link href="/artist-dashboard/passport/" className={secondary}>Edit Creative Passport</Link><Link href="/artist-dashboard/profile/" className={secondary}>Preview artist profile</Link><Link href="/artist-dashboard/portfolio/" className={secondary}>Manage portfolio</Link></div></section>}
      </div>
    </main>
  )
}
