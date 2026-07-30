"use client"

import { useRouter } from "next/navigation"
import { RealLoginForm } from "@/components/kleio/auth/real-login-form"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { getKleioReturnRoute, readKleioReturnIntent } from "@/lib/kleio-return-intent"

export function LandingLoginCard() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"

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
      </div>
    </section>
  )
}
