"use client"

import Link from "next/link"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { cn } from "@/lib/utils"

const navItems = [
  { key: "nav.about", href: "/about/", active: "about" as const },
  { key: "nav.manifesto", href: "/manifesto/", active: "manifesto" as const },
  { key: "nav.journal", href: "/journal/", active: "journal" as const },
]

const wordmarkGraphite = {
  filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)",
} as const

export function PublicPageShell({
  active,
  children,
}: {
  active?: "about" | "manifesto" | "journal"
  children: React.ReactNode
}) {
  const { t, locale } = useKleioLocale()
  const isSpanish = locale === "es"

  function navLabel(key: string) {
    if (key === "nav.journal") return isSpanish ? "Notas de campo" : "Field Notes"
    return t(key)
  }

  return (
    <div className="min-h-screen bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7]">
        <div className="relative mx-auto flex h-[88px] max-w-[1120px] items-center px-6 max-md:px-5">
          <nav className="flex items-center gap-7 max-md:gap-4">
            {navItems.map((item) => {
              const isActive = active && item.href === `/${active}/`
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "text-[0.78rem] font-medium tracking-wide transition-opacity hover:opacity-70",
                    isActive ? "text-[#5B4B8A]" : "text-[#6F6882]",
                  )}
                >
                  {navLabel(item.key)}
                </Link>
              )
            })}
          </nav>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <KleioWordmarkLink href="/" imageClassName="h-[clamp(1.75rem,2.2vw,2.4rem)] w-auto" imageStyle={wordmarkGraphite} priority />
          </div>

          <div className="ml-auto flex items-center gap-4 max-md:gap-3">
            <ExploreArthouseLink className="text-[0.78rem] font-medium tracking-wide text-[#6F6882] transition-opacity hover:opacity-70 max-md:hidden">
              {isSpanish ? "Demo guiado" : "Guided Demo"}
            </ExploreArthouseLink>
            <KleioLocaleToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-16 max-md:px-5 max-md:py-12">{children}</main>

      <footer className="border-t border-[#E7E1F7] py-8">
        <p className="text-center text-[0.7rem] tracking-[0.15em] text-[#B2A9C9]">{t("common.copyright")}</p>
      </footer>
    </div>
  )
}

export function PublicEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#5B4B8A]">{children}</p>
  )
}

export function PublicHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-[820px]">
      <h1
        className="mt-3 font-serif tracking-tight text-[#292631]"
        style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.85rem)", lineHeight: 1.05 }}
      >
        {title}
      </h1>
      <p className="mt-5 max-w-[640px] text-[1.02rem] leading-relaxed text-[#6F6882]">{subtitle}</p>
    </div>
  )
}

export function PublicCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-[#E7E1F7] bg-white p-6"
      style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.06)" }}
    >
      {children}
    </div>
  )
}

export function PublicSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-[1.35rem] font-semibold tracking-tight text-[#292631]">{heading}</h2>
      <p className="mt-3 max-w-[720px] text-[0.95rem] leading-relaxed text-[#5A5468]">{children}</p>
    </section>
  )
}
