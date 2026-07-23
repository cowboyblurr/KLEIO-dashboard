"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useDemoGuide, persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function DemoReturnControl() {
  const pathname = usePathname()
  const { locale } = useKleioLocale()
  const { isDemo, isResolved } = useKleioMode()
  const { returnToPlaylist } = useDemoGuide()

  const isDemoHome = pathname === "/demo" || pathname === "/demo/"
  if (!isResolved || !isDemo || isDemoHome) return null

  function prepareDemoHome() {
    returnToPlaylist()
    persistDemoGuideState({
      isOpen: false,
      isMinimized: true,
      dismissed: false,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
  }

  return (
    <Link
      href="/demo/"
      onClick={prepareDemoHome}
      className="fixed bottom-3 left-3 z-[55] inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#5B4B8A] shadow-[0_10px_30px_rgba(82,64,130,0.14)] backdrop-blur-sm transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 md:bottom-4 md:left-4"
      aria-label={locale === "es" ? "Volver a la página principal del demo guiado" : "Back to the guided demo home"}
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      <span>{locale === "es" ? "Volver al demo" : "Back to Demo"}</span>
    </Link>
  )
}
