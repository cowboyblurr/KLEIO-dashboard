"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, KeyRound } from "lucide-react"
import { getDashboardForRole, validateDemoCredentials } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type Role = "artist" | "institution" | "collaborator"

const previewAccess = ["institution@kleio.demo", "artist@kleio.demo", "reviewer@kleio.demo"]

export function LandingLoginCard() {
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const es = locale === "es"

  function routeForRole(role: Role) {
    router.push(getDashboardForRole(role))
  }

  function setPreviewGuideState() {
    persistDemoGuideState({
      isOpen: false,
      isMinimized: true,
      dismissed: true,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
  }

  function handleLogin() {
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
    <div
      className="landing-login-card flex flex-col rounded-[1.1rem] p-3.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E7E1F7",
        boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)",
      }}
    >
      <section className="rounded-[0.95rem] border border-[#E7E1F7] bg-white p-3.5" aria-labelledby="preview-access-title">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]">
            <KeyRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
              {es ? "Acceso de muestra" : "Sample preview access"}
            </p>
            <h2 id="preview-access-title" className="mt-1 font-serif text-[1rem] font-semibold text-[#292631]">
              {es ? "Explorar KLEIO Workspace" : "Explore KLEIO Workspace"}
            </h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">
              {es
                ? "Estas credenciales abren una vista previa con datos sintéticos. No crean una cuenta real ni envían información."
                : "These credentials open a synthetic-data product preview. They do not create a real account or submit information."}
            </p>
          </div>
        </div>

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault()
            handleLogin()
          }}
          noValidate
        >
          <div className="grid gap-2">
            <label htmlFor="preview-email" className="sr-only">
              {es ? "Correo de acceso de muestra" : "Sample access email"}
            </label>
            <input
              id="preview-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder={t("landing.login.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "preview-login-error" : "preview-login-help"}
              className="h-9 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
              style={{ borderColor: "#DCD5F3", color: "#292631" }}
            />
            <label htmlFor="preview-password" className="sr-only">
              {es ? "Contraseña de acceso de muestra" : "Sample access password"}
            </label>
            <input
              id="preview-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("landing.login.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "preview-login-error" : "preview-login-help"}
              className="h-9 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
              style={{ borderColor: "#DCD5F3", color: "#292631" }}
            />
          </div>

          <p id="preview-login-help" className="mt-2 text-[0.62rem] leading-relaxed text-[#7F7890]">
            {es ? "Selecciona un rol de muestra para completar las credenciales." : "Choose a sample role to fill the preview credentials."}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1.5" aria-label={es ? "Roles de muestra" : "Sample preview roles"}>
            {previewAccess.map((accessEmail) => {
              const role = accessEmail.replace("@kleio.demo", "")
              return (
                <button
                  key={accessEmail}
                  type="button"
                  onClick={() => fillCredentials(accessEmail)}
                  className="truncate rounded-full border border-[#E7E1F7] bg-[#F7F4FF]/70 px-2 py-1.5 text-[0.58rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]"
                  aria-label={es ? `Usar acceso de muestra: ${role}` : `Use ${role} sample access`}
                  title={accessEmail}
                >
                  {role}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.62rem] text-[#7F7890]">
              {es ? "Contraseña" : "Password"}: <span className="font-semibold text-[#5B4B8A]">kleio2026</span>
            </p>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#292631] px-4 text-[0.72rem] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8] focus-visible:ring-offset-2"
            >
              {es ? "Abrir vista previa" : "Open preview"}
              <ChevronRight className="size-3" aria-hidden="true" />
            </button>
          </div>

          {error && (
            <p id="preview-login-error" role="alert" aria-live="assertive" className="mt-2 text-[0.64rem] leading-snug" style={{ color: "oklch(0.45 0.14 55)" }}>
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
