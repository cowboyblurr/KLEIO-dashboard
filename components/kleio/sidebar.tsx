"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FileStack, FolderOpen, LayoutGrid, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import { getCurrentInstitution, type InstitutionRecord } from "@/lib/kleio-live-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const items = [
  { label: "Overview", labelEs: "Resumen", href: "/dashboard/connected/", icon: LayoutGrid, match: "/dashboard/connected" },
  { label: "Open Calls", labelEs: "Convocatorias", href: "/programs/connected/", icon: FolderOpen, match: "/programs" },
  { label: "Applicants", labelEs: "Postulantes", href: "/applications/connected/", icon: FileStack, match: "/applications" },
  { label: "Institution Profile", labelEs: "Perfil institucional", href: "/settings/connected/", icon: Settings, match: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const session = getDemoSession()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [institution, setInstitution] = useState<InstitutionRecord | null>(null)

  useEffect(() => { let active = true; void getCurrentInstitution().then((record) => { if (active) setInstitution(record) }).catch(() => { if (active) setInstitution(null) }); return () => { active = false } }, [])

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-6 pb-5 pt-6"><KleioWordmarkLink href="/dashboard/connected/" className="rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border" /></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4"><p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{es ? "Espacio institucional" : "Institution workspace"}</p><ul className="space-y-0.5">{items.map((item) => { const active = pathname.startsWith(item.match); const Icon = item.icon; return <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground/70 hover:bg-accent/60 hover:text-foreground")}><Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} /><span>{es ? item.labelEs : item.label}</span></Link></li> })}</ul></nav>
      <div className="border-t border-border p-3"><div className="flex items-center gap-3 rounded-lg px-2 py-2"><InitialAvatar name={session?.name || (es ? "Cuenta" : "Account")} className="size-9 text-xs" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{session?.name || (es ? "Cuenta institucional" : "Institution account")}</span><span className="block truncate text-xs text-muted-foreground">{session?.email || ""}</span></span></div><Link href="/settings/connected/" className="mt-1 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-2 py-2 text-left transition-colors hover:bg-accent/40"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Building2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{institution?.name || (es ? "Completar institución" : "Complete institution")}</span><span className="block truncate text-xs text-muted-foreground">{institution?.location || (es ? "Perfil conectado" : "Connected profile")}</span></span></Link></div>
    </aside>
  )
}
