"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, FlaskConical } from "lucide-react"
import { getDashboardForRole, loginDemoUser, validateDemoCredentials } from "@/lib/kleio-demo-auth"
import { setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { RealLoginForm } from "@/components/kleio/auth/real-login-form"

type Role = "artist" | "institution" | "collaborator"

const previewAccess = ["institution@kleio.demo", "artist@kleio.demo", "reviewer@kleio.demo"]

export function LandingLoginCard() {
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function routeForRole(role: Role) {
    router.push(getDashboardForRole(role))
  }

  function setPreviewGuideState() {
    persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: true, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
  }

  function setDemoGuideState(role: Role) {
    persistDemoGuideState({
      isOpen: true,
      isMinimized: false,
      dismissed: false,
      activeScenarioId: role === "institution" ? "review-and-shortlist" : null,
      activeStepId: role === "institution" ? "review-and-shortlist-1" : null,
      completedScenarioId: null,
    })
  }

  function openWorkspace(role: Role, mode: KleioMode) {
    setError("")
    setKleioMode(mode)
    loginDemoUser(role)
    if (mode === "demo") setDemoGuideState(role)
    else setPreviewGuideState()
    routeForRole(role)
  }

  function handlePreviewLogin() {
    setError("")
    setKleioMode("preview")
    setPreviewGuideState()
    const session = validateDemoCredentials(email, password)
    if (!session) {
      setError(t("landing.login.error"))
      return
    }
    routeForRole(session.role)
  }

  function fillCredentials(nextEmail: string) {
    setEmail(nextEmail)
    setPassword("kleio2026")
    setError("")
  }

  return (
    <div id="login" className="landing-login-card flex scroll-mt-6 flex-col rounded-[1.1rem] p-3.5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E1F7", boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)" }}>
      <section className="rounded-[0.95rem] border border-[#E7E1F7] bg-white p-3.5">
        <RealLoginForm onSuccess={(account) => routeForRole(account.profile.role)} compact />
      </section>

      <details className="group mt-3 rounded-[0.95rem] border border-[#E7E1F7] bg-[#F7F4FF]/55 px-3 py-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.68rem] font-semibold text-[#5B4B8A] marker:hidden">
          <span className="inline-flex items-center gap-2"><FlaskConical className="size-3.5" />{locale === "es" ? "Vista previa con datos sintéticos" : "Synthetic-data preview access"}</span>
          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-3">
          <p className="text-[0.66rem] leading-relaxed text-[#7F7890]">{locale === "es" ? "Estas credenciales abren registros de muestra. No crean una cuenta ni envían mensajes reales." : "These credentials open sample records. They do not create an account or send real messages."}</p>
          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-[0.62rem] font-medium text-[#7F7890]"><span>{locale === "es" ? "Correo demo" : "Demo email"}</span><input type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handlePreviewLogin()} className="h-9 w-full rounded-full border border-[#DCD5F3] bg-white px-3.5 text-[0.72rem] text-[#292631] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" /></label>
            <label className="grid gap-1 text-[0.62rem] font-medium text-[#7F7890]"><span>{locale === "es" ? "Contraseña demo" : "Demo password"}</span><input type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handlePreviewLogin()} className="h-9 w-full rounded-full border border-[#DCD5F3] bg-white px-3.5 text-[0.72rem] text-[#292631] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" /></label>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {previewAccess.map((accessEmail) => (
              <button key={accessEmail} type="button" onClick={() => fillCredentials(accessEmail)} className="truncate rounded-full border border-[#E7E1F7] bg-white px-2 py-1.5 text-[0.58rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white/70" title={accessEmail}>
                {accessEmail.replace("@kleio.demo", "")}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.62rem] text-[#7F7890]">Demo password: <span className="font-semibold text-[#5B4B8A]">kleio2026</span></p>
            <button type="button" onClick={handlePreviewLogin} className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#5B4B8A] px-4 text-[0.72rem] font-semibold text-white transition-opacity hover:opacity-90">
              {locale === "es" ? "Abrir vista previa" : "Open preview"}
              <ChevronRight className="size-3" />
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-[0.64rem] leading-snug text-[oklch(0.45_0.14_55)]">{error}</p>}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <section className="rounded-xl border border-[#E7E1F7] bg-white p-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Demo</p>
              <div className="mt-2 grid gap-1.5">
                <button type="button" onClick={() => openWorkspace("institution", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Institution</button>
                <button type="button" onClick={() => openWorkspace("artist", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Artist</button>
                <button type="button" onClick={() => openWorkspace("collaborator", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">Reviewer</button>
              </div>
            </section>
            <section className="rounded-xl border border-[#E7E1F7] bg-white p-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Preview</p>
              <div className="mt-2 grid gap-1.5">
                <button type="button" onClick={() => openWorkspace("institution", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Institution</button>
                <button type="button" onClick={() => openWorkspace("artist", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Artist</button>
                <button type="button" onClick={() => openWorkspace("collaborator", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Reviewer</button>
              </div>
            </section>
          </div>
        </div>
      </details>
    </div>
  )
}
