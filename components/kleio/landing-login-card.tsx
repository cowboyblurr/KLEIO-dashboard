"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getDashboardForRole, loginDemoUser, validateDemoCredentials } from "@/lib/kleio-demo-auth"
import { setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type Role = "artist" | "institution" | "collaborator"

export function LandingLoginCard() {
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function routeForRole(role: Role) {
    router.push(getDashboardForRole(role))
  }

  function openWorkspace(role: Role, mode: KleioMode) {
    setError("")
    setKleioMode(mode)
    loginDemoUser(role)

    if (mode === "demo") {
      persistDemoGuideState({
        isOpen: true,
        isMinimized: false,
        dismissed: false,
        activeScenarioId: role === "institution" ? "review-and-shortlist" : null,
        activeStepId: role === "institution" ? "review-and-shortlist-1" : null,
        completedScenarioId: null,
      })
    } else {
      persistDemoGuideState({
        isOpen: false,
        isMinimized: true,
        dismissed: true,
        activeScenarioId: null,
        activeStepId: null,
        completedScenarioId: null,
      })
    }

    routeForRole(role)
  }

  function handleLogin() {
    setError("")
    setKleioMode("preview")
    const session = validateDemoCredentials(email, password)
    if (!session) {
      setError(t("landing.login.error"))
      return
    }
    routeForRole(session.role)
  }

  function handleStartGuidedDemo() {
    setError("")
    setKleioMode("demo")
    persistDemoGuideState({
      isOpen: true,
      isMinimized: false,
      dismissed: false,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
    router.push("/demo/")
  }

  return (
    <div className="landing-login-card flex flex-col rounded-[1.1rem] p-3.5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E1F7", boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)" }}>
      <div className="grid gap-3">
        <div className="rounded-[0.95rem] border border-[#E7E1F7] bg-[#F7F4FF] p-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Modo demo" : "Demo walkthrough"}</p>
          <h2 className="mt-1 font-serif text-[1rem] font-semibold text-[#292631]">{locale === "es" ? "Prueba el flujo de revisión institucional" : "Try the institution review flow"}</h2>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">
            {locale === "es" ? "Usa datos de muestra, guía y recorrido para ver cómo KLEIO mueve una convocatoria desde recepción hasta informe." : "Use sample records, guidance, and a walkthrough to see how KLEIO moves an open call from intake to report."}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => openWorkspace("institution", "demo")} className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#5B4B8A] px-4 text-[0.72rem] font-semibold text-white shadow-[0_10px_24px_rgba(82,64,130,0.16)] transition-opacity hover:opacity-90">
              {locale === "es" ? "Empezar demo" : "Start demo flow"}
              <ChevronRight className="size-3" />
            </button>
            <button type="button" onClick={handleStartGuidedDemo} className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-[#D8D0F2] bg-white px-4 text-[0.72rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">
              {t("demoGuide.startGuidedDemo")}
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>

        <div className="rounded-[0.95rem] border border-[#E7E1F7] bg-white p-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Vista previa" : "Product preview"}</p>
          <h2 className="mt-1 font-serif text-[1rem] font-semibold text-[#292631]">{locale === "es" ? "Entrar a KLEIO Workspace" : "Enter the KLEIO workspace"}</h2>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">
            {locale === "es" ? "Una vista más limpia de cómo se sentirá la plataforma real: sin guía abierta ni etiquetas de recorrido demo." : "A cleaner preview of how the platform itself should feel: no open guide, no walkthrough labels, less demo scaffolding."}
          </p>
          <button type="button" onClick={() => openWorkspace("institution", "preview")} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-[#292631] px-4 text-[0.72rem] font-semibold text-white transition-opacity hover:opacity-90">
            {locale === "es" ? "Entrar como institución" : "Enter as institution"}
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      <details className="group mt-3 rounded-[0.95rem] border border-[#E7E1F7] bg-white px-3 py-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.68rem] font-semibold text-[#5B4B8A] marker:hidden">
          <span>{locale === "es" ? "Acceso avanzado" : "Advanced role access"}</span>
          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
        </summary>
        <p className="mt-1 text-[0.64rem] leading-relaxed text-[#7F7890]">{locale === "es" ? "Elige rol y modo para probar rutas específicas." : "Choose a role and mode to test specific paths."}</p>

        <div className="mt-3 grid gap-2">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Demo mode</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <button type="button" onClick={() => openWorkspace("institution", "demo")} className="rounded-full border border-[#D8D0F2] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Institution</button>
            <button type="button" onClick={() => openWorkspace("artist", "demo")} className="rounded-full border border-[#D8D0F2] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Artist</button>
            <button type="button" onClick={() => openWorkspace("collaborator", "demo")} className="rounded-full border border-[#D8D0F2] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Reviewer</button>
          </div>
          <p className="pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Preview mode</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <button type="button" onClick={() => openWorkspace("institution", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Institution</button>
            <button type="button" onClick={() => openWorkspace("artist", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Artist</button>
            <button type="button" onClick={() => openWorkspace("collaborator", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Reviewer</button>
          </div>
        </div>

        <div className="mt-3 border-t border-[#E7E1F7] pt-3">
          <p className="text-[0.62rem] font-semibold text-[#292631]">{t("landing.login.title")}</p>
          <p className="mt-0.5 text-[0.62rem] leading-snug text-[#7F7890]">{locale === "es" ? "Credenciales manuales entran en modo vista previa." : "Manual credentials enter Product Preview mode."}</p>
          <div className="mt-2 space-y-1.5">
            <input type="email" placeholder={t("landing.login.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" style={{ borderColor: "#DCD5F3", color: "#292631" }} />
            <input type="password" placeholder={t("landing.login.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" style={{ borderColor: "#DCD5F3", color: "#292631" }} />
          </div>
          <div className="mt-1.5 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]/60 px-2.5 py-1.5 text-[0.62rem] leading-snug text-[#6F6882]">
            <p className="font-semibold text-[#5B4B8A]">{t("landing.login.demoAccessLabel")}</p>
            <p className="mt-0.5 break-words">{t("landing.login.demoAccessRoles")}</p>
            <p className="mt-0.5">{t("landing.login.demoAccessPassword")}</p>
          </div>
          {error && <p className="mt-1 text-[0.64rem] leading-snug" style={{ color: "oklch(0.45 0.14 55)" }}>{error}</p>}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={handleLogin} className="flex h-8 items-center justify-center gap-1 rounded-full border px-3.5 text-[0.68rem] transition-colors hover:bg-[#1F1B29]" style={{ backgroundColor: "#292631", borderColor: "#292631", color: "#FFFFFF" }}>
              {t("landing.login.logIn")}
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </details>
    </div>
  )
}
