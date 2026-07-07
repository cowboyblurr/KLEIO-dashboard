"use client"

import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { cn } from "@/lib/utils"

export function DemoEnvironmentBadge({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale } = useKleioLocale()
  const label =
    locale === "es"
      ? compact
        ? "Demo · Datos sintéticos"
        : "Entorno demo · Datos sintéticos · Sin postulaciones reales"
      : compact
        ? "Demo · Synthetic data"
        : "Demo environment · Synthetic data · No live submissions"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/85 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#7F7890] shadow-[0_8px_24px_rgba(82,64,130,0.05)] backdrop-blur-sm",
        className,
      )}
      aria-label={label}
    >
      <span className="size-1.5 rounded-full bg-[#A997E8]" aria-hidden />
      {label}
    </span>
  )
}
