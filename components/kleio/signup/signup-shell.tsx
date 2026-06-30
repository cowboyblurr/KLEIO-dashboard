import Link from "next/link"
import { cn } from "@/lib/utils"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

export function SignupShell({
  children,
  title,
  subtitle,
  stepLabel,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  stepLabel?: string
}) {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_287)]">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <KleioWordmarkLink className="rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border" />
          {stepLabel && (
            <p className="text-xs font-medium text-muted-foreground">{stepLabel}</p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to KLEIO
        </Link>

        {title && (
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export function SignupProgress({
  currentStep,
  totalSteps,
  label,
}: {
  currentStep: number
  totalSteps: number
  label: string
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full transition-colors",
              i <= currentStep ? "bg-primary" : "bg-border",
            )}
            aria-hidden
          />
        ))}
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function SignupStepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</div>
  )
}

export function SignupField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  origin,
  list,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "url"
  origin?: "suggested" | "edited"
  list?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {origin === "suggested" && (
          <span className="rounded-full bg-[oklch(0.93_0.04_287)] px-2 py-0.5 text-[0.6rem] font-medium text-[oklch(0.42_0.14_287)]">
            Suggested
          </span>
        )}
        {origin === "edited" && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">
            Edited
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
      />
      {origin === "suggested" && (
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          Prepared by KLEIO Assist. Review and edit before continuing.
        </p>
      )}
    </label>
  )
}

export function SignupTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  origin,
  draftNote,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  origin?: "suggested" | "edited"
  draftNote?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {draftNote && (
          <span className="text-[0.6rem] text-muted-foreground">· Draft suggested</span>
        )}
        {origin === "suggested" && (
          <span className="rounded-full bg-[oklch(0.93_0.04_287)] px-2 py-0.5 text-[0.6rem] font-medium text-[oklch(0.42_0.14_287)]">
            Suggested
          </span>
        )}
        {origin === "edited" && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">
            Edited
          </span>
        )}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
      />
      {origin === "suggested" && (
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          Prepared by KLEIO Assist. Review and edit before continuing.
        </p>
      )}
    </label>
  )
}

export function SignupStepControls({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  submitLabel,
}: {
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onSubmit?: () => void
  submitLabel: string
}) {
  const isFirst = step === 0
  const isLast = step === totalSteps - 1

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {!isFirst ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          Back
        </button>
      ) : (
        <span />
      )}

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Next
        </button>
      )}
    </div>
  )
}

export function SignupReviewRow({
  label,
  value,
  origin,
}: {
  label: string
  value: string
  origin?: "suggested" | "edited"
}) {
  if (!value.trim()) return null
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {origin === "suggested" && (
          <span className="text-[0.6rem] text-[oklch(0.42_0.14_287)]">Suggested · editable</span>
        )}
        {origin === "edited" && (
          <span className="text-[0.6rem] text-primary">Edited by user</span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  )
}
