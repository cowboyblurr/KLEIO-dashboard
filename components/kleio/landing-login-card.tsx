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
      className="landing-login-card flex min-h-[430px] scroll-mt-6 flex-col rounded-[1.1rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_18px_48px_rgba(82,64,130,0.08)] max-lg:min-h-0"
    >
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
    </section>
  )
}
