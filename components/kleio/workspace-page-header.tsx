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
    <header className="space-y-1.5">
      {eyebrow && (
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em]" style={{ color: lavenderDeep }}>
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: inkColor }}>
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 sm:text-sm" style={{ color: mutedColor }}>
            {description}
          </p>
          {prototypeNote && (
            <p className="mt-2 inline-flex items-center rounded-full bg-[#F7F4FF] px-2.5 py-0.5 text-[0.7rem] font-medium" style={{ color: lavenderDeep }}>
              {prototypeNote}
            </p>
          )}
        </div>
        {(primaryCta || secondaryCta) && (
          <div className="flex flex-wrap gap-2">
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]"
                style={{ borderColor: "#D8D0F2", color: lavenderDeep }}
              >
                {secondaryCta.label}
              </Link>
            )}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
