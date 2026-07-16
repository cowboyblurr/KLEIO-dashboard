"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, FilePlus2, RefreshCw, Users } from "lucide-react"
import { getPersistenceMode, listInstitutionApplications, listInstitutionCalls, type ApplicationRecord, type OpenCallRecord } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function statusLabel(status: OpenCallRecord["status"], es: boolean) {
  const labels = es
    ? { draft: "Borrador", open: "Abierta", closed: "Cerrada", under_review: "En revisión", completed: "Completada", archived: "Archivada" }
    : { draft: "Draft", open: "Open", closed: "Closed", under_review: "Under review", completed: "Completed", archived: "Archived" }
  return labels[status]
}

function statusClass(status: OpenCallRecord["status"]) {
  if (status === "open") return "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]"
  if (status === "draft") return "bg-[#F7F4FF] text-[#5B4B8A]"
  return "bg-muted text-muted-foreground"
}

export function ConnectedInstitutionCallsView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [calls, setCalls] = useState<OpenCallRecord[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [nextCalls, nextApplications] = await Promise.all([listInstitutionCalls(), listInstitutionApplications()])
      setCalls(nextCalls)
      setApplications(nextApplications)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudieron cargar las convocatorias." : "Unable to load open calls."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const metrics = useMemo(() => ({
    total: calls.length,
    open: calls.filter((call) => call.status === "open").length,
    drafts: calls.filter((call) => call.status === "draft").length,
    applicants: applications.length,
  }), [calls, applications])

  function applicantCount(callId: string) {
    return applications.filter((application) => application.call_id === callId && application.status !== "draft").length
  }

  return (
    <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Convocatorias conectadas" : "Connected open calls"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Programas y convocatorias" : "Programs and open calls"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Cada conteo de postulantes se deriva de postulaciones vinculadas a esta convocatoria." : "Every applicant count is derived from applications linked to that call."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/programs/new/" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><FilePlus2 className="size-4" />{es ? "Crear convocatoria" : "Create open call"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[[es ? "Total" : "Total calls", metrics.total], [es ? "Abiertas" : "Open", metrics.open], [es ? "Borradores" : "Drafts", metrics.drafts], [es ? "Postulantes" : "Applicants", metrics.applicants]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl font-semibold">{value}</p></div>)}
        </section>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{error}</p>}
        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando registros…" : "Loading records…"}</div> : calls.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="font-serif text-xl font-semibold">{es ? "Aún no hay convocatorias" : "No calls yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{es ? "Crea un borrador y publícalo cuando esté listo." : "Create a draft and publish it when it is ready."}</p><Link href="/programs/new/" className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Crear primera convocatoria" : "Create first call"}</Link></div> : <section className="grid gap-4 md:grid-cols-2">
          {calls.map((call) => {
            const count = applicantCount(call.id)
            return <article key={call.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{call.opportunity_type}</p><h2 className="mt-2 font-serif text-xl font-semibold">{call.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(call.status)}`}>{statusLabel(call.status, es)}</span></div><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{call.summary || call.description}</p><div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{call.deadline_at || (es ? "Sin fecha límite" : "No deadline")}</span><span className="flex items-center gap-2"><Users className="size-4 text-primary" />{count} {es ? "postulantes" : "applicants"}</span></div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/applications/connected/?call=${encodeURIComponent(call.id)}`} className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground">{es ? "Ver postulantes" : "View applicants"}</Link><Link href={`/artist-dashboard/calls/?call=${encodeURIComponent(call.id)}`} className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:bg-accent/50">{es ? "Vista de artista" : "Artist view"}</Link></div></article>
          })}
        </section>}
      </div>
    </main>
  )
}
