"use client"

import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const navLinkStyle = { color: "#6F6882", letterSpacing: "0.04em" } as const

export function KleioLocaleToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useKleioLocale()

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={className ?? "flex items-center gap-1 text-[0.78rem] font-medium tracking-wide"}
      style={navLinkStyle}
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
    >
      {locale === "en" ? "EN" : "ES"}
    </button>
  )
}
