"use client"

import { useRouter } from "next/navigation"
import { RealLoginForm } from "@/components/kleio/auth/real-login-form"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"

export function LandingLoginCard() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"

  return (
    <section
      id="login"
      aria-labelledby="login-heading"
      className="landing-login-card relative scroll-mt-6 overflow-hidden rounded-[1.1rem] border border-[#E2DAF2] bg-[radial-gradient(circle_at_14%_0%,rgba(226,217,248,0.30),transparent_46%),linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(252,250,255,0.98)_60%,rgba(249,246,253,0.98)_100%)] p-4 shadow-[0_18px_48px_rgba(82,64,130,0.09)]"
    >
      <div className="relative z-10">
        <h2 id="login-heading" className="font-serif text-[0.98rem] font-semibold tracking-[-0.01em] text-[#292631]">
          {es ? "Entra a tu espacio KLEIO" : "Enter your KLEIO workspace"}
        </h2>
        <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">
          {es ? "Inicia sesión para continuar a tu espacio de artista o institución." : "Sign in to continue to your artist or institution workspace."}
        </p>
        <RealLoginForm
          variant="landing"
          className="mt-1"
          onSuccess={(account) => {
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
