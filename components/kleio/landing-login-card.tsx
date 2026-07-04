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
  const { t } = useKleioLocale()
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
    })
  }

  return (
    <div
      className="flex min-h-0 flex-col rounded-[1.1rem] p-3.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E7E1F7",
        boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)",
      }}
    >
      <h2 className="font-serif text-[0.95rem] font-semibold" style={{ color: "#292631" }}>
        {t("landing.login.title")}
      </h2>
      <p className="mt-0.5 text-[0.68rem]" style={{ color: "#7F7890" }}>
        {t("landing.login.subtitle")}
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

      <div
        className="mt-1.5 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]/60 px-2.5 py-1.5 text-[0.64rem] leading-snug"
        style={{ color: "#6F6882" }}
      >
        <p className="font-semibold" style={{ color: "#5B4B8A" }}>
          {t("landing.login.demoAccessLabel")}
        </p>
        <p className="mt-0.5 break-words">{t("landing.login.demoAccessRoles")}</p>
        <p className="mt-0.5">{t("landing.login.demoAccessPassword")}</p>
      </div>

      {error && (
        <p className="mt-1 text-[0.64rem] leading-snug" style={{ color: "oklch(0.45 0.14 55)" }}>
          {error}
        </p>
      )}

      <div className="mt-2.5 flex justify-end">
        <button
          type="button"
          onClick={handleLogin}
          className="flex h-9 items-center justify-center gap-1 rounded-full border px-4 text-[0.72rem] transition-colors hover:bg-[#1F1B29]"
          style={{ backgroundColor: "#292631", borderColor: "#292631", color: "#FFFFFF" }}
        >
          {t("landing.login.logIn")}
          <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="kleio-demo-workspace">
        <p className="kleio-demo-workspace-label">{t("landing.login.demoWorkspace")}</p>

        <div className="kleio-demo-workspace-actions" aria-label={t("landing.login.demoWorkspace")}>
          <button
            type="button"
            onClick={handleInstitutionDemo}
            className="kleio-demo-workspace-button"
          >
            {t("landing.login.enterInstitutionDemo")}
          </button>
          <button
            type="button"
            onClick={handleArtistDemo}
            className="kleio-demo-workspace-button"
          >
            {t("landing.login.enterArtistDemo")}
          </button>
          <button
            type="button"
            onClick={handleCollaboratorDemo}
            className="kleio-demo-workspace-button"
          >
            {t("landing.login.enterCollaboratorDemo")}
          </button>
        </div>

        <button type="button" onClick={handleStartGuidedDemo} className="kleio-demo-workspace-guided">
          {t("demoGuide.startGuidedDemo")}
        </button>
      </div>
    </div>
  )
}
