"use client"

import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { cn } from "@/lib/utils"

const navLinkStyle = { color: "#6F6882", letterSpacing: "0.04em" } as const

export function KleioLocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useKleioLocale()

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#DCD5F3] bg-white p-0.5 text-[0.72rem] font-semibold",
        className,
      )}
      style={navLinkStyle}
      role="group"
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn(
          "rounded-full px-2 py-0.5 transition-colors",
          locale === "en" ? "bg-[#292631] text-white" : "text-[#6F6882] hover:text-[#292631]",
        )}
        aria-label={t("common.locale.en")}
        aria-pressed={locale === "en"}
      >
        {t("common.locale.en")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={cn(
          "rounded-full px-2 py-0.5 transition-colors",
          locale === "es" ? "bg-[#292631] text-white" : "text-[#6F6882] hover:text-[#292631]",
        )}
        aria-label={t("common.locale.es")}
        aria-pressed={locale === "es"}
      >
        {t("common.locale.es")}
      </button>
    </div>
  )
}
