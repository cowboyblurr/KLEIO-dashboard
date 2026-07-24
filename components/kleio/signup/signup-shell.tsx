"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { ArtistSignupProfilePhoto } from "@/components/kleio/signup/artist-signup-profile-photo"

function cleanSignupLabel(label: string) {
  return label
    .replace("CV / document placeholder", "CV / Supporting documents")
    .replace("Featured works placeholder", "Featured works")
    .replace("placeholder", "")
    .trim()
}

export function SignupShell({ children, title, subtitle, stepLabel }: { children: React.ReactNode; title?: string; subtitle?: string; stepLabel?: string }) {
  const { t } = useKleioLocale()
  const { isDemo } = useKleioMode()
  const pathname = usePathname()
  const showArtistSignupPhoto = !isDemo && pathname.includes("/signup/artist")

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_287)]">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <KleioWordmarkLink href="/" className="rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border" />
          <div className="flex items-center gap-3">
            {isDemo && <DemoEnvironmentBadge compact className="hidden sm:inline-flex" />}
            {stepLabel && <p className="text-xs font-medium text-muted-foreground">{stepLabel}</p>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link href="/" className="mb-6 inline-flex text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t("signup.common.backToKleio")}
        </Link>

        {title && (
          <div className="mb-8">
            {isDemo && <div className="mb-3 sm:hidden"><DemoEnvironmentBadge compact /></div>}
            <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {showArtistSignupPhoto && <ArtistSignupProfilePhoto />}
        {children}
      </main>
      {isDemo && <KleioDemoGuide variant="workspace" />}
    </div>
  )
}

export function SignupProgress({ currentStep, totalSteps, label }: { currentStep: number; totalSteps: number; label: string }) {
  const progress = ((currentStep + 1) / totalSteps) * 100
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span key={i} className={cn("size-2 rounded-full transition-colors", i <= currentStep ? "bg-primary" : "bg-border")} aria-hidden />
        ))}
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary/70 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export function SignupStepCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</div>
}

export function SignupField({ label, value, onChange, placeholder, type = "text", origin, list }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: "text" | "url" | "email"; origin?: "suggested" | "edited"; list?: string }) {
  const { t } = useKleioLocale()
  const displayLabel = cleanSignupLabel(label)
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
        {origin === "suggested" && <span className="rounded-full bg-[oklch(0.93_0.04_287)] px-2 py-0.5 text-[0.6rem] font-medium text-[oklch(0.42_0.14_287)]">{t("signup.common.suggested")}</span>}
        {origin === "edited" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">{t("signup.common.edited")}</span>}
      </span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={list} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40" />
      {origin === "suggested" && <p className="mt-1 text-[0.65rem] text-muted-foreground">{t("signup.common.suggestedNote")}</p>}
    </label>
  )
}

export function SignupTextArea({ label, value, onChange, placeholder, rows = 4, origin, draftNote }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; origin?: "suggested" | "edited"; draftNote?: boolean }) {
  const { t } = useKleioLocale()
  const displayLabel = cleanSignupLabel(label)
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
        {draftNote && <span className="text-[0.6rem] text-muted-foreground">{t("signup.common.draftSuggested")}</span>}
        {origin === "suggested" && <span className="rounded-full bg-[oklch(0.93_0.04_287)] px-2 py-0.5 text-[0.6rem] font-medium text-[oklch(0.42_0.14_287)]">{t("signup.common.suggested")}</span>}
        {origin === "edited" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">{t("signup.common.edited")}</span>}
      </span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/40" />
      {origin === "suggested" && <p className="mt-1 text-[0.65rem] text-muted-foreground">{t("signup.common.suggestedNote")}</p>}
    </label>
  )
}

export function SignupReviewRow({ label, value, origin }: { label: string; value?: string; origin?: string }) {
  const { t } = useKleioLocale()
  const displayValue = value?.trim() || "—"
  const displayLabel = cleanSignupLabel(label)
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0 max-sm:flex-col max-sm:gap-1">
      <div className="w-40 shrink-0 text-xs font-medium text-muted-foreground max-sm:w-full">{displayLabel}</div>
      <div className="min-w-0 flex-1 text-sm text-foreground">
        <p className="break-words leading-relaxed">{displayValue}</p>
        {origin === "suggested" && <span className="mt-1 inline-flex rounded-full bg-[oklch(0.93_0.04_287)] px-2 py-0.5 text-[0.6rem] font-medium text-[oklch(0.42_0.14_287)]">{t("signup.common.suggested")}</span>}
        {origin === "edited" && <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">{t("signup.common.edited")}</span>}
      </div>
    </div>
  )
}

export function SignupStepControls({ step, totalSteps, onBack, onNext, onSubmit, submitLabel }: { step: number; totalSteps: number; onBack: () => void; onNext: () => void; onSubmit?: () => void; submitLabel: string }) {
  const { t } = useKleioLocale()
  const isFirst = step === 0
  const isLast = step === totalSteps - 1
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {!isFirst ? <button type="button" onClick={onBack} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t("signup.common.back")}</button> : <span />}
      <button type="button" onClick={isLast ? onSubmit : onNext} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
        {isLast ? submitLabel : t("signup.common.next")}
      </button>
    </div>
  )
}
