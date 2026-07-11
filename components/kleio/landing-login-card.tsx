"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, KeyRound } from "lucide-react"
import { getDashboardForRole, loginDemoUser, validateDemoCredentials } from "@/lib/kleio-demo-auth"
import { setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type Role = "artist" | "institution" | "collaborator"

const previewAccess = [
  { label: "Institution", email: "institution@kleio.demo" },
  { label: "Artist", email: "artist@kleio.demo" },
  { label: "Reviewer", email: "reviewer@kleio.demo" },
]

export function LandingLoginCard() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const es = locale === "es"

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

  function handleLogin() {
    setError("")
    setKleioMode("preview")
    setPreviewGuideState()
    const session = validateDemoCredentials(email, password)
    if (!session) {
      setError(es ? "Usa las credenciales de vista previa o elige un rol de espacio de trabajo." : "Use the preview credentials or choose a workspace role to continue.")
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
    <div className="landing-login-card flex flex-col rounded-[1.1rem] p-3.5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E1F7", boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)" }}>
      <section className="rounded-[0.95rem] border border-[#E7E1F7] bg-white p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><KeyRound className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Acceso privado" : "Private preview access"}</p>
            <h2 className="mt-1 font-serif text-[1rem] font-semibold text-[#292631]">{es ? "Entrar a KLEIO Workspace" : "Log in to KLEIO Workspace"}</h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">{es ? "Estas credenciales abren una vista previa limpia del producto, sin recorridos superpuestos por defecto." : "These credentials open a clean product preview workspace, without walkthrough overlays by default."}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <input type="email" placeholder={es ? "Correo de acceso" : "Access email"} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="h-9 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" style={{ borderColor: "#DCD5F3", color: "#292631" }} />
          <input type="password" placeholder={es ? "Clave de acceso" : "Access key"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="h-9 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15" style={{ borderColor: "#DCD5F3", color: "#292631" }} />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {previewAccess.map((access) => (
            <button key={access.email} type="button" onClick={() => fillCredentials(access.email)} className="truncate rounded-full border border-[#E7E1F7] bg-[#F7F4FF]/70 px-2 py-1.5 text-[0.58rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]" title={access.label}>
              {access.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.62rem] text-[#7F7890]">{es ? "Clave:" : "Access key:"} <span className="font-semibold text-[#5B4B8A]">kleio2026</span></p>
          <button type="button" onClick={handleLogin} className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#292631] px-4 text-[0.72rem] font-semibold text-white transition-opacity hover:opacity-90">
            {es ? "Entrar" : "Log in"}
            <ChevronRight className="size-3" />
          </button>
        </div>
        {error && <p className="mt-1 text-[0.64rem] leading-snug" style={{ color: "oklch(0.45 0.14 55)" }}>{error}</p>}
      </section>

      <details className="group mt-3 rounded-[0.95rem] border border-[#E7E1F7] bg-white px-3 py-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.68rem] font-semibold text-[#5B4B8A] marker:hidden">
          <span>{es ? "Opciones de rol" : "Workspace role options"}</span>
          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{es ? "Recorrido" : "Guided"}</p>
            <div className="mt-2 grid gap-1.5">
              <button type="button" onClick={() => openWorkspace("institution", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">Institution</button>
              <button type="button" onClick={() => openWorkspace("artist", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">Artist</button>
              <button type="button" onClick={() => openWorkspace("collaborator", "demo")} className="rounded-full border border-[#D8D0F2] bg-white px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">Reviewer</button>
            </div>
          </section>
          <section className="rounded-xl border border-[#E7E1F7] bg-white p-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{es ? "Vista previa" : "Clean preview"}</p>
            <div className="mt-2 grid gap-1.5">
              <button type="button" onClick={() => openWorkspace("institution", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Institution</button>
              <button type="button" onClick={() => openWorkspace("artist", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Artist</button>
              <button type="button" onClick={() => openWorkspace("collaborator", "preview")} className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-1.5 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">Reviewer</button>
            </div>
          </section>
        </div>
      </details>
    </div>
  )
}
