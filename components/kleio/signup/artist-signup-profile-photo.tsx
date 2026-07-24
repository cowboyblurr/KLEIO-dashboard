"use client"

/* eslint-disable @next/next/no-img-element -- the preview uses a local object URL before authentication */

import { useEffect, useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  clearPendingArtistProfileImage,
  finalizePendingArtistProfileImage,
  loadPendingArtistProfileImage,
  savePendingArtistProfileImage,
  updatePendingArtistProfileImageEmail,
} from "@/lib/kleio-pending-profile-image"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function currentSignupEmail() {
  const input = document.querySelector<HTMLInputElement>('input[type="email"]')
  return input?.value ?? ""
}

export function ArtistSignupProfilePhoto() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const previewUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  function replacePreview(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = file ? URL.createObjectURL(file) : null
    setPreviewUrl(previewUrlRef.current)
    setFileName(file?.name ?? "")
  }

  useEffect(() => {
    let active = true
    void loadPendingArtistProfileImage()
      .then((pending) => {
        if (!active || !pending) return
        replacePreview(pending.file)
        setMessage(es ? "Foto guardada para subir después de confirmar el correo." : "Photo saved for upload after email confirmation.")
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setBusy(false)
      })

    const synchronizeEmail = () => {
      void updatePendingArtistProfileImageEmail(currentSignupEmail()).catch(() => undefined)
    }
    document.addEventListener("input", synchronizeEmail, true)
    document.addEventListener("submit", synchronizeEmail, true)

    const supabase = getSupabaseBrowserClient()
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return
      void finalizePendingArtistProfileImage({ retries: 6, delayMs: 500 }).catch(() => undefined)
    }).data.subscription

    return () => {
      active = false
      document.removeEventListener("input", synchronizeEmail, true)
      document.removeEventListener("submit", synchronizeEmail, true)
      subscription.unsubscribe()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [es])

  async function choosePhoto(file: File | null) {
    if (!file) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await savePendingArtistProfileImage(file, currentSignupEmail())
      replacePreview(file)
      setMessage(es ? "La foto está lista y se subirá solo después de confirmar tu cuenta." : "Your photo is ready and will upload only after your account is confirmed.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (es ? "No se pudo preparar la foto." : "KLEIO could not prepare this photo."))
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    setError("")
    try {
      await clearPendingArtistProfileImage()
      replacePreview(null)
      setMessage(es ? "Foto eliminada de la configuración pendiente." : "Photo removed from pending signup.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (es ? "No se pudo eliminar la foto." : "KLEIO could not remove the photo."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-[#DED5F2] bg-[linear-gradient(145deg,#FFFFFF_0%,#FBF9FF_100%)] p-5 shadow-sm" aria-labelledby="artist-signup-photo-title">
      <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
        <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-[#D8D0F2] bg-[#F4F0FC] text-[#6A5896]">
          {previewUrl ? <img src={previewUrl} alt={es ? "Vista previa de la foto de perfil" : "Profile photo preview"} className="size-full object-cover" /> : <ImageIcon className="size-7" aria-hidden />}
        </div>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#6A5896]">{es ? "Identidad del artista" : "Artist identity"}</p>
          <h2 id="artist-signup-photo-title" className="mt-1 font-serif text-lg font-semibold text-foreground">{es ? "Añade una foto de perfil" : "Add a profile photo"} <span className="font-sans text-xs font-normal text-muted-foreground">({es ? "opcional" : "optional"})</span></h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {es
              ? "JPG, PNG o WebP, hasta 5 MB. KLEIO la conserva temporalmente en este navegador y solo la sube a tu carpeta privada después de confirmar el correo."
              : "JPG, PNG, or WebP, up to 5 MB. KLEIO keeps it temporarily in this browser and uploads it to your private folder only after email confirmation."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {previewUrl ? (es ? "Reemplazar" : "Replace") : (es ? "Elegir foto" : "Choose photo")}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => void choosePhoto(event.target.files?.[0] ?? null)} />
            </label>
            {previewUrl && <button type="button" onClick={() => void removePhoto()} disabled={busy} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-accent/50 disabled:opacity-50"><Trash2 className="size-3.5" />{es ? "Eliminar" : "Remove"}</button>}
            {fileName && <span className="max-w-[220px] truncate text-[0.68rem] text-muted-foreground">{fileName}</span>}
          </div>
          {message && <p role="status" className="mt-2 text-[0.7rem] leading-5 text-emerald-700">{message}</p>}
          {error && <p role="alert" className="mt-2 text-[0.7rem] leading-5 text-red-700">{error}</p>}
        </div>
      </div>
    </section>
  )
}
