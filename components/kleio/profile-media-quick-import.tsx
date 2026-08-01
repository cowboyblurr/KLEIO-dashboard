"use client"

/* eslint-disable @next/next/no-img-element -- profile previews use private signed URLs */

import { useEffect, useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { loadArtistPassport } from "@/lib/kleio-live-data"
import { loadArtistProfilePresentation, type ArtistProfilePresentationRecord } from "@/lib/kleio-profile-presentation"
import { useMediaAsProfileImage } from "@/lib/kleio-media-destinations"

export function ProfileMediaQuickImport() {
  const [presentation, setPresentation] = useState<ArtistProfilePresentationRecord | null>(null)
  const [name, setName] = useState("Artist")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([loadArtistProfilePresentation(), loadArtistPassport()])
      .then(([nextPresentation, passport]) => {
        if (!active) return
        setPresentation(nextPresentation)
        setName(passport?.professional_name || "Artist")
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <section className="rounded-[24px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]" aria-labelledby="profile-media-quick-title">
      <div className="grid gap-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
        <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl border border-[#D8D0F2] bg-[#F2EFF7]">
          {loading ? <Loader2 className="size-5 animate-spin text-[#75639E]" /> : presentation?.profile_image_url ? <img src={presentation.profile_image_url} alt="Current profile preview" className="size-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} /> : <InitialAvatar name={name} className="size-20 text-xl" />}
        </div>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Quick Import</p>
          <h2 id="profile-media-quick-title" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em]">Choose a profile image from wherever it already lives</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#746E80]">Upload from your device, choose a specific Drive file, or reuse private KLEIO media. The current image stays in place until you confirm the replacement.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <QuickMediaImport
              context="profile_image"
              label={presentation?.profile_image_path ? "Replace profile image" : "Choose profile image"}
              onConfirm={async ({ items }) => {
                const item = items[0]
                if (!item) return
                setPresentation(await useMediaAsProfileImage(item))
                setMessage("Profile image updated across your workspace and artist profile.")
                setError("")
              }}
            />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="size-3.5" />Private selection and explicit confirmation</span>
          </div>
          {message && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
        </div>
      </div>
    </section>
  )
}
