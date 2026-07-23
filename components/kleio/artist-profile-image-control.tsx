"use client"

/* eslint-disable @next/next/no-img-element -- profile images use short-lived signed Supabase URLs */

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import {
  removeArtistProfileImage,
  replaceArtistProfileImage,
  saveArtistProfileImagePosition,
} from "@/lib/kleio-artist-profile"

const button = "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] disabled:cursor-not-allowed disabled:opacity-50"

export type ArtistProfileImageValue = {
  path: string
  url: string | null
  positionX: number
  positionY: number
}

export function ArtistProfileImageControl({
  name,
  value,
  onChange,
  compact = false,
}: {
  name: string
  value: ArtistProfileImageValue
  onChange: (value: ArtistProfileImageValue) => void
  compact?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const result = await replaceArtistProfileImage(file, value.path)
      onChange({ path: result.path, url: result.url, positionX: value.positionX, positionY: value.positionY })
      setMessage("Profile image updated across your artist account.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the profile image.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function remove() {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await removeArtistProfileImage(value.path)
      onChange({ path: "", url: null, positionX: 50, positionY: 50 })
      setMessage("Profile image removed. Your initials are now used as the fallback.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove the profile image.")
    } finally {
      setBusy(false)
    }
  }

  async function commitPosition(positionX: number, positionY: number) {
    onChange({ ...value, positionX, positionY })
    if (!value.path) return
    try {
      const saved = await saveArtistProfileImagePosition(positionX, positionY)
      onChange({ ...value, positionX: saved.x, positionY: saved.y })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save image positioning.")
    }
  }

  return (
    <section className={compact ? "" : "rounded-2xl border border-[#E7E1F7] bg-[#FDFBFF] p-4"}>
      <div className={`flex ${compact ? "items-center" : "items-start"} gap-4`}>
        <div className="relative shrink-0">
          {value.url ? (
            <img
              src={value.url}
              alt={`${name || "Artist"} profile`}
              className={`${compact ? "size-16" : "size-28"} rounded-full border-4 border-white object-cover shadow-[0_14px_36px_rgba(82,64,130,0.14)]`}
              style={{ objectPosition: `${value.positionX}% ${value.positionY}%` }}
            />
          ) : (
            <InitialAvatar name={name || "Artist"} className={`${compact ? "size-16" : "size-28"} border-4 border-white text-xl shadow-[0_14px_36px_rgba(82,64,130,0.14)]`} />
          )}
          {busy && <span className="absolute inset-0 grid place-items-center rounded-full bg-white/75"><Loader2 className="size-5 animate-spin text-primary" /></span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ImagePlus className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Profile image</h2>
          </div>
          {!compact && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">JPG, PNG, or WebP, up to 5 MB. This is the single image used by your Creative Passport and artist profile.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={button} disabled={busy} onClick={() => fileRef.current?.click()}><Upload className="size-3.5" />{value.path ? "Replace image" : "Upload image"}</button>
            {value.path && <button type="button" className={button} disabled={busy} onClick={() => void remove()}><Trash2 className="size-3.5" />Remove</button>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0] ?? null)} />
          </div>
        </div>
      </div>
      {!compact && value.path && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Horizontal position</span><input type="range" min="0" max="100" value={value.positionX} onChange={(event) => onChange({ ...value, positionX: Number(event.target.value) })} onMouseUp={() => void commitPosition(value.positionX, value.positionY)} onTouchEnd={() => void commitPosition(value.positionX, value.positionY)} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Vertical position</span><input type="range" min="0" max="100" value={value.positionY} onChange={(event) => onChange({ ...value, positionY: Number(event.target.value) })} onMouseUp={() => void commitPosition(value.positionX, value.positionY)} onTouchEnd={() => void commitPosition(value.positionX, value.positionY)} /></label>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-medium text-red-700">{error}</p>}
      {message && <p role="status" className="mt-3 text-xs font-medium text-emerald-700">{message}</p>}
    </section>
  )
}
