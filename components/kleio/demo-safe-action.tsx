"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function DemoSafeAction({
  children,
  message,
  className,
  type = "button",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  message?: string
  className?: string
  type?: "button" | "submit" | "reset"
  "aria-label"?: string
}) {
  const { locale } = useKleioLocale()
  const [visible, setVisible] = useState(false)
  const fallback =
    locale === "es"
      ? "Acción de demostración. Este prototipo no modifica datos reales."
      : "Demo action. This prototype does not change live data."

  function showMessage() {
    setVisible(true)
    window.setTimeout(() => setVisible(false), 2600)
  }

  return (
    <span className="relative inline-flex">
      <button type={type} aria-label={ariaLabel} onClick={showMessage} className={cn(className)}>
        {children}
      </button>
      {visible && (
        <span className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-left text-[0.7rem] leading-snug text-[#6F6882] shadow-[0_14px_38px_rgba(82,64,130,0.12)]">
          {message ?? fallback}
        </span>
      )}
    </span>
  )
}
