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
      className="landing-login-card relative scroll-mt-6 overflow-hidden rounded-[1.1rem] border border-[#E3DCF5] bg-[radial-gradient(circle_at_12%_0%,rgba(222,213,251,0.46),transparent_42%),linear-gradient(145deg,#FFFFFF_0%,#FCFAFF_58%,#F8F4FF_100%)] p-4 shadow-[0_18px_48px_rgba(82,64,130,0.09)]"
    >
      <div className="pointer-events-none absolute -left-10 -top-14 size-36 rounded-full bg-[#DCD1FA]/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 right-2 size-32 rounded-full bg-[#EEE8FF]/45 blur-3xl" aria-hidden />

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
          onSuccess={(account) => router.push(getDashboardForRole(account.profile.role))}
        />
      </div>
    </section>
  )
}
