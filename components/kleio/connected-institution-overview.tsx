"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, FileStack, FolderOpen, Plus } from "lucide-react"
import { getCurrentInstitution, listInstitutionApplications, listInstitutionCalls, type InstitutionRecord } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ConnectedInstitutionOverview() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [institution, setInstitution] = useState<InstitutionRecord | null>(null)
  const [callCount, setCallCount] = useState(0)
  const [applicationCount, setApplicationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([getCurrentInstitution(), listInstitutionCalls(), listInstitutionApplications()])
      .then(([nextInstitution, calls, applications]) => {
        if (!active) return
        setInstitution(nextInstitution)
        setCallCount(calls.length)
        setApplicationCount(applications.length)
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load the institution workspace.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-[1160px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Espacio institucional conectado" : "Connected institution workspace"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{institution?.name || (es ? "Tu institución" : "Your institution")}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Convocatorias, postulantes y revisiones se limitan a la institución que posees o administras." : "Open calls, applicants, and reviews are scoped to the institution you own or actively manage."}</p></div><Link href="/programs/new/" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4" />{es ? "Crear convocatoria" : "Create open call"}</Link></header>
        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{error}</p>}
        <section className="grid gap-3 md:grid-cols-3">
          <Metric label={es ? "Institución" : "Institution"} value={loading ? "—" : institution ? (es ? "Activa" : "Active") : (es ? "Incompleta" : "Incomplete")} icon={Building2} href="/settings/connected/" />
          <Metric label={es ? "Convocatorias" : "Open calls"} value={loading ? "—" : callCount} icon={FolderOpen} href="/programs/connected/" />
          <Metric label={es ? "Postulantes" : "Applicants"} value={loading ? "—" : applicationCount} icon={FileStack} href="/applications/connected/" />
        </section>
        {!loading && !institution && <EmptyState title={es ? "Completa el perfil institucional" : "Complete the institution profile"} body={es ? "KLEIO no carga una institución sintética cuando falta tu registro. Completa el perfil para crear la primera convocatoria." : "KLEIO does not load a synthetic institution when your record is missing. Complete the profile before creating your first call."} href="/settings/connected/" cta={es ? "Completar perfil" : "Complete profile"} />}
        {!loading && institution && callCount === 0 && <EmptyState title={es ? "Crea tu primera convocatoria" : "Create your first open call"} body={es ? "Esta institución todavía no tiene convocatorias, postulantes, revisiones, mensajes ni informes." : "This institution has no calls, applicants, reviews, messages, or reports yet."} href="/programs/new/" cta={es ? "Crear convocatoria" : "Create open call"} />}
      </div>
    </main>
  )
}

function Metric({ label, value, icon: Icon, href }: { label: string; value: string | number; icon: typeof Building2; href: string }) {
  return <Link href={href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-3 font-serif text-3xl font-semibold">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><Icon className="size-4" /></span></div></Link>
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return <section className="rounded-2xl border border-dashed border-[#D8D0F2] bg-white p-7 text-center"><h2 className="font-serif text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p><Link href={href} className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{cta}</Link></section>
}
