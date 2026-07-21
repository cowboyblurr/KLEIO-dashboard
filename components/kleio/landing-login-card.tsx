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
    <section id="login" aria-labelledby="login-heading" className="scroll-mt-6 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_24px_64px_rgba(82,64,130,0.1)] sm:p-6">
      <h2 id="login-heading" className="font-serif text-2xl font-semibold tracking-[-0.025em] text-[#292631]">{es ? "Iniciar sesión" : "Log In"}</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#7F7890]">{es ? "Continúa en tu espacio persistente de artista o institución." : "Continue to your persistent artist or institution workspace."}</p>
      <div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-[oklch(0.99_0.003_287)] p-4">
        <RealLoginForm onSuccess={(account) => router.push(getDashboardForRole(account.profile.role))} />
      </div>
    </section>
  )
}
