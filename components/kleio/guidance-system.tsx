"use client"

import { useEffect, useId, useState } from "react"
import { ChevronDown, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function InlineHelper({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>{children}</p>
}

export function TrustIndicator({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#6F6882]", className)}>
      <span className="size-1.5 rounded-full bg-[#A997E8]" aria-hidden />
      {children}
    </span>
  )
}

export function FocusLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#6A5896]", className)}>
      <span className="h-px w-5 bg-[#CFC4EC]" aria-hidden />
      {children}
    </p>
  )
}

export function ExpandableInfo({
  label,
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  label: string
  summary?: string
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const contentId = useId()

  return (
    <details className={cn("group border-t border-[#EEEAF7] pt-3", className)} open={defaultOpen || undefined}>
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md text-xs font-semibold text-[#5B4B8A] outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-primary/25 [&::-webkit-details-marker]:hidden"
        aria-controls={contentId}
      >
        <Info className="size-3.5 opacity-65" aria-hidden />
        <span>{label}</span>
        {summary && <span className="hidden font-normal text-muted-foreground sm:inline">· {summary}</span>}
        <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div id={contentId} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200">
        <div className="pt-3 text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </details>
  )
}

export function FirstUseHint({
  storageKey,
  title,
  children,
  className,
}: {
  storageKey: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(`kleio-guidance:${storageKey}`) !== "dismissed")
    } catch {
      setVisible(true)
    }
  }, [storageKey])

  function dismiss() {
    try {
      window.localStorage.setItem(`kleio-guidance:${storageKey}`, "dismissed")
    } catch {
      // Dismissal still works for this session when storage is unavailable.
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      setVisible(false)
      return
    }

    setClosing(true)
    window.setTimeout(() => setVisible(false), 200)
  }

  if (!visible) return null

  return (
    <aside
      className={cn(
        "flex items-start gap-3 border-l-2 border-[#D8D0F2] py-1 pl-3 pr-1 text-xs leading-relaxed text-muted-foreground transition-all duration-200 ease-out motion-reduce:transition-none",
        closing && "-translate-y-1 opacity-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#292631]">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#F7F4FF] hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        aria-label={`Dismiss ${title}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </aside>
  )
}
