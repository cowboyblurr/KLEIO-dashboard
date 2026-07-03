import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "About", href: "/about/" },
  { label: "Manifesto", href: "/manifesto/" },
  { label: "Journal", href: "/journal/" },
]

const wordmarkGraphite = {
  filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)",
} as const

/**
 * Shared shell for the public marketing pages (`/about/`, `/manifesto/`, `/journal/`).
 * Mirrors the landing page's white / graphite / lavender visual system without the
 * fixed-viewport hero grid, so these pages scroll normally.
 */
export function PublicPageShell({
  active,
  children,
}: {
  active?: "about" | "manifesto" | "journal"
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7]">
        <div className="relative mx-auto flex h-[88px] max-w-[1120px] items-center px-6 max-md:px-5">
          <nav className="flex items-center gap-7 max-md:gap-4">
            {navLinks.map((item) => {
              const isActive = active && item.href === `/${active}/`
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-[0.78rem] font-medium tracking-wide transition-opacity hover:opacity-70",
                    isActive ? "text-[#5B4B8A]" : "text-[#6F6882]",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <KleioWordmarkLink href="/" imageClassName="h-[clamp(1.75rem,2.2vw,2.4rem)] w-auto" imageStyle={wordmarkGraphite} priority />
          </div>

          <div className="ml-auto flex items-center gap-6 max-md:gap-4">
            <ExploreArthouseLink className="text-[0.78rem] font-medium tracking-wide text-[#6F6882] transition-opacity hover:opacity-70 max-md:hidden">
              Explore Arthouse
            </ExploreArthouseLink>
            <button type="button" className="flex items-center gap-1 text-[0.78rem] font-medium tracking-wide text-[#6F6882]">
              EN <ChevronDown className="size-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-16 max-md:px-5 max-md:py-12">{children}</main>

      <footer className="border-t border-[#E7E1F7] py-8">
        <p className="text-center text-[0.7rem] tracking-[0.15em] text-[#B2A9C9]">© 2026 KLEIO ARTHOUSE</p>
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
