import Link from "next/link"
import { inkColor, mutedColor, lavenderDeep } from "@/lib/workspace-styles"

export type WorkspaceCta = {
  label: string
  href: string
  variant?: "primary" | "secondary"
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  prototypeNote,
  primaryCta,
  secondaryCta,
}: {
  eyebrow?: string
  title: string
  description: string
  prototypeNote?: string
  primaryCta?: WorkspaceCta
  secondaryCta?: WorkspaceCta
}) {
  return (
    <header className="space-y-3">
      {eyebrow && (
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: lavenderDeep }}>
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight xl:text-3xl" style={{ color: inkColor }}>
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
            {description}
          </p>
          {prototypeNote && (
            <p className="mt-3 inline-flex items-center rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-medium" style={{ color: lavenderDeep }}>
              {prototypeNote}
            </p>
          )}
        </div>
        {(primaryCta || secondaryCta) && (
          <div className="flex flex-wrap gap-2">
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-[#F7F4FF]"
                style={{ borderColor: "#D8D0F2", color: lavenderDeep }}
              >
                {secondaryCta.label}
              </Link>
            )}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {primaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
