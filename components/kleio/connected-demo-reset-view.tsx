"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, RotateCcw } from "lucide-react"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { getPersistenceMode, resetPreviewData } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ConnectedDemoResetView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const mode = getPersistenceMode()
  const [done, setDone] = useState(false)

  function reset() {
    resetPreviewData()
    clearDemoSession()
    setDone(true)
  }

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Herramienta de test-run" : "Test-run utility"}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">{es ? "Restablecer datos conectados" : "Reset connected demo data"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{mode.mode === "preview" ? (es ? "Esto restaura el conjunto sintético local y cierra la sesión de vista previa. No afecta Supabase." : "This restores the local synthetic dataset and signs out the preview session. It does not affect Supabase.") : (es ? "La compilación está conectada a Supabase. Este control solo puede limpiar la copia local de respaldo; no elimina registros remotos." : "This build is connected to Supabase. This control can clear only the local fallback copy; it never deletes remote records.")}</p>
        {done && <p className="mt-5 flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="size-4" />{es ? "Datos locales restaurados." : "Local preview data restored."}</p>}
        <button type="button" onClick={reset} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"><RotateCcw className="size-4" />{es ? "Restablecer vista previa local" : "Reset local preview"}</button>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><Link href="/signup/institution/" className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold">{es ? "Empezar como institución" : "Start as institution"}</Link><Link href="/signup/artist/" className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold">{es ? "Empezar como artista" : "Start as artist"}</Link></div>
      </div>
    </main>
  )
}
