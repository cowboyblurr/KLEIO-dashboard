"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import {
  getDashboardForRole,
  loginDemoUser,
  validateDemoCredentials,
} from "@/lib/kleio-demo-auth"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function LandingLoginCard() {
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function routeForRole(role: "artist" | "institution" | "collaborator") {
    router.push(getDashboardForRole(role))
  }

  function handleLogin() {
    setError("")
    const session = validateDemoCredentials(email, password)
    if (!session) {
      setError(t("landing.login.error"))
      return
    }
    routeForRole(session.role)
  }

  function handleInstitutionDemo() {
    setError("")
    loginDemoUser("institution")
    routeForRole("institution")
  }

  function handleArtistDemo() {
    setError("")
    loginDemoUser("artist")
    routeForRole("artist")
  }

  function handleCollaboratorDemo() {
    setError("")
    loginDemoUser("collaborator")
    routeForRole("collaborator")
  }

  function handleStartGuidedDemo() {
    setError("")
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
    <div
      className="landing-login-card flex flex-col rounded-[1.1rem] p-3.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E7E1F7",
        boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)",
      }}
    >
      <div className="rounded-[0.95rem] border border-[#E7E1F7] bg-[#F7F4FF] p-3">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
          {locale === "es" ? "Primer paso recomendado" : "Recommended first step"}
        </p>
        <h2 className="mt-1 font-serif text-[1rem] font-semibold text-[#292631]">
          {locale === "es" ? "Comienza con el demo guiado" : "Start with the guided demo"}
        </h2>
        <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">
          {locale === "es"
            ? "El recorrido abre las pantallas correctas y explica qué estás viendo, sin asumir que ya conoces KLEIO."
            : "The walkthrough opens the right screens and explains what you are seeing, without assuming you already know KLEIO."}
        </p>
        <button
          type="button"
          onClick={handleStartGuidedDemo}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-[#5B4B8A] px-4 text-[0.72rem] font-semibold text-white shadow-[0_10px_24px_rgba(82,64,130,0.16)] transition-opacity hover:opacity-90"
        >
          {t("demoGuide.startGuidedDemo")}
          <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="kleio-demo-workspace">
        <p className="kleio-demo-workspace-label">
          {locale === "es" ? "O entra directo a un espacio demo" : "Or enter a demo workspace directly"}
        </p>

        <div className="kleio-demo-workspace-actions" aria-label={t("landing.login.demoWorkspace")}>
          <button type="button" onClick={handleInstitutionDemo} className="kleio-demo-workspace-button">
            {t("landing.login.enterInstitutionDemo")}
          </button>
          <button type="button" onClick={handleArtistDemo} className="kleio-demo-workspace-button">
            {t("landing.login.enterArtistDemo")}
          </button>
          <button type="button" onClick={handleCollaboratorDemo} className="kleio-demo-workspace-button">
            {t("landing.login.enterCollaboratorDemo")}
          </button>
        </div>
      </div>

      <div className="landing-login-primary mt-3 border-t border-[#E7E1F7] pt-3">
        <h3 className="font-serif text-[0.86rem] font-semibold" style={{ color: "#292631" }}>
          {t("landing.login.title")}
        </h3>
        <p className="mt-0.5 text-[0.64rem]" style={{ color: "#7F7890" }}>
          {locale === "es"
            ? "Acceso manual para probar roles específicos del demo."
            : "Manual access for testing specific demo roles."}
        </p>

        <div className="mt-2.5 space-y-1.5">
          <input
            type="email"
            placeholder={t("landing.login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
            style={{ borderColor: "#DCD5F3", color: "#292631" }}
          />
          <input
            type="password"
            placeholder={t("landing.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
            style={{ borderColor: "#DCD5F3", color: "#292631" }}
          />
        </div>

        <div className="mt-1.5 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]/60 px-2.5 py-1.5 text-[0.64rem] leading-snug" style={{ color: "#6F6882" }}>
          <p className="font-semibold" style={{ color: "#5B4B8A" }}>{t("landing.login.demoAccessLabel")}</p>
          <p className="mt-0.5 break-words">{t("landing.login.demoAccessRoles")}</p>
          <p className="mt-0.5">{t("landing.login.demoAccessPassword")}</p>
        </div>

        {error && <p className="mt-1 text-[0.64rem] leading-snug" style={{ color: "oklch(0.45 0.14 55)" }}>{error}</p>}

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleLogin}
            className="flex h-8 items-center justify-center gap-1 rounded-full border px-3.5 text-[0.68rem] transition-colors hover:bg-[#1F1B29]"
            style={{ backgroundColor: "#292631", borderColor: "#292631", color: "#FFFFFF" }}
          >
            {t("landing.login.logIn")}
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
