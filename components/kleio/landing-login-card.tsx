"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { RealLoginForm } from "@/components/kleio/auth/real-login-form"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { isGoogleAuthenticationConfigured } from "@/lib/kleio-google-capabilities"
import { getKleioReturnRoute, readKleioReturnIntent } from "@/lib/kleio-return-intent"

export function LandingLoginCard() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const googleConfigured = isGoogleAuthenticationConfigured()

  return (
    <section
      id="login"
      aria-labelledby="login-heading"
      className="landing-login-card relative scroll-mt-24 overflow-hidden rounded-[1.4rem] border border-[#E2DAF2] bg-[radial-gradient(circle_at_14%_0%,rgba(226,217,248,0.30),transparent_46%),linear-gradient(145deg,rgba(255,255,255,0.99)_0%,rgba(252,250,255,0.99)_60%,rgba(249,246,253,0.99)_100%)] p-5 shadow-[0_22px_64px_rgba(82,64,130,0.10)] sm:p-6"
    >
      <div className="relative z-10">
        <h2 id="login-heading" className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#292631]">
          {es ? "Entra a tu espacio KLEIO" : "Enter your KLEIO workspace"}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#7F7890]">
          {es ? "Continúa a tu espacio de artista, institución o colaborador." : "Continue to your artist, institution, or collaborator workspace."}
        </p>
        <RealLoginForm
          variant="landing"
          className="mt-3"
          onSuccess={(account) => {
            const intent = readKleioReturnIntent()
            if (intent) {
              router.push(getKleioReturnRoute(intent))
              return
            }
            const role = account.profile.role
            const destination =
              !account.profile.onboarding_completed && (role === "artist" || role === "institution")
                ? `/signup/${role}/`
                : getDashboardForRole(role)
            router.push(destination)
          }}
        />

        {googleConfigured && <div className="mt-4 border-t border-[#E7E1F7] pt-4">
          <p className="text-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8A8296]">{es ? "Acceso con Google" : "Google access"}</p>
          <p className="mx-auto mt-2 max-w-sm text-center text-xs leading-5 text-[#7F7890]">{es ? "Elige el tipo de espacio de tu cuenta. Si tu correo de Google ya pertenece a KLEIO, conservará su rol existente. Gmail se autoriza por separado." : "Choose your account workspace type. If your Google email already belongs to KLEIO, its established role is preserved. Gmail is authorized separately."}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/signup/artist/?access=google" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] hover:bg-[#F8F6FC]">{es ? "Continuar como artista" : "Continue as artist"}</Link>
            <Link href="/signup/institution/?access=google" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] hover:bg-[#F8F6FC]">{es ? "Continuar como institución" : "Continue as institution"}</Link>
          </div>
          <p className="mt-2 text-center text-[0.68rem] leading-5 text-[#8A8296]">{es ? "Los colaboradores continúan usando el acceso por correo actual." : "Collaborators continue using the existing email sign-in."}</p>
        </div>}
      </div>
    </section>
  )
}
