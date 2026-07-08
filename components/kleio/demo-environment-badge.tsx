"use client"

import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { cn } from "@/lib/utils"

export function DemoEnvironmentBadge({ className, compact = false, showInPreview = false }: { className?: string; compact?: boolean; showInPreview?: boolean }) {
  const { locale } = useKleioLocale()
  const { isPreview } = useKleioMode()

  if (isPreview && !showInPreview) return null

  const label = isPreview
    ? locale === "es"
      ? "Vista previa privada"
      : "Product preview"
    : locale === "es"
      ? compact
        ? "Demo de trabajo · Registros de muestra"
        : "Demo de trabajo · Registros de muestra · Sin cuentas o postulaciones reales"
      : compact
        ? "Working demo · Sample records"
        : "Working demo · Sample records · No real accounts or live submissions"

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/85 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#7F7890] shadow-[0_8px_24px_rgba(82,64,130,0.05)] backdrop-blur-sm", className)} aria-label={label}>
      <span className="size-1.5 rounded-full bg-[#A997E8]" aria-hidden />
      {label}
    </span>
  )
}
