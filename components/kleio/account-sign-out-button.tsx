"use client"

import { useState } from "react"
import { Loader2, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDemoSignOut } from "@/components/kleio/auth-gate"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type AccountSignOutButtonProps = {
  compact?: boolean
  className?: string
}

export function AccountSignOutButton({ compact = false, className }: AccountSignOutButtonProps) {
  const signOut = useDemoSignOut()
  const { locale } = useKleioLocale()
  const [pending, setPending] = useState(false)
  const es = locale === "es"
  const label = pending ? (es ? "Cerrando sesión…" : "Signing out…") : (es ? "Cerrar sesión" : "Sign out")

  async function handleSignOut() {
    if (pending) return
    setPending(true)
    try {
      await signOut()
    } catch {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={pending}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-wait disabled:opacity-60",
        compact ? "size-10 shrink-0" : "h-10 w-full gap-3 px-3 text-sm font-medium",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4 shrink-0" />}
      {!compact && <span>{label}</span>}
    </button>
  )
}
