"use client"

import Link from "next/link"
import { ArrowLeft, CalendarDays, CheckCircle2, DollarSign, FileText, WandSparkles } from "lucide-react"
import type { DirectoryOpportunity } from "@/lib/kleio-opportunities"
import { formatDemoDateDisplay } from "@/lib/kleio-artist-analytics"
import { formatKleioCurrency } from "@/lib/kleio-i18n"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { cardStyle, inkColor, lavenderSoftLine, mutedColor } from "@/lib/workspace-styles"

function toneForPct(value: number): "success" | "warning" | "info" {
  if (value >= 88) return "success"
  if (value >= 78) return "info"
  return "warning"
}

function missingLabel(value: string, es: boolean) {
  if (!es) return value
  return ({
    "Budget Template": "Plantilla de presupuesto",
    "Work sample": "Muestra de obra",
    "Support Materials": "Materiales de apoyo",
  } as Record<string, string>)[value] ?? value
}

function DetailMetric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof CalendarDays }) {
  return (
    <section className="rounded-2xl border bg-white p-4" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>{label}</p>
          <p className="mt-2 font-serif text-xl font-semibold" style={{ color: inkColor }}>{value}</p>
          <p className="mt-1 text-xs" style={{ color: mutedColor }}>{detail}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F7F4FF] text-[#5B4B8A]"><Icon className="size-4" /></span>
      </div>
    </section>
  )
}

export function ArtistOpportunityDetailPageView({ opportunity }: { opportunity: DirectoryOpportunity }) {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const missing = opportunity.missing.length ? opportunity.missing : []

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1040px] space-y-5">
        <Link href="/artist-dashboard/opportunities/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] transition-opacity hover:opacity-75">
          <ArrowLeft className="size-3.5" />
          {es ? "Volver a oportunidades" : "Back to opportunities"}
        </Link>

        <section className="rounded-[1.6rem] border bg-white p-6" style={cardStyle}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{opportunity.type} · {opportunity.institution}</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: inkColor }}>{opportunity.title}</h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{opportunity.why}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DemoStatusChip label={`${opportunity.fit}% ${es ? "afinidad" : "fit"}`} tone={toneForPct(opportunity.fit)} translate={false} />
              <DemoStatusChip label={`${opportunity.readiness}% ${es ? "listo" : "ready"}`} tone={toneForPct(opportunity.readiness)} translate={false} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/artist-dashboard/opportunities/" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <WandSparkles className="size-4" />
              {es ? "Preparar borrador" : "Prepare draft"}
            </Link>
            <Link href="/artist-dashboard/passport/" className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
              {es ? "Revisar Pasaporte" : "Review Passport"}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailMetric label={es ? "Fecha límite" : "Deadline"} value={formatDemoDateDisplay(opportunity.deadline, locale)} detail={opportunity.urgency} icon={CalendarDays} />
          <DetailMetric label={es ? "Monto" : "Amount"} value={opportunity.amount ? formatKleioCurrency(locale, opportunity.amount) : es ? "No especificado" : "Not specified"} detail={opportunity.type} icon={DollarSign} />
          <DetailMetric label={es ? "Esfuerzo" : "Effort"} value={opportunity.effort} detail={es ? "Estimado desde requisitos" : "Estimated from requirements"} icon={FileText} />
          <DetailMetric label={es ? "Preparación" : "Readiness"} value={`${opportunity.readiness}%`} detail={missing.length ? `${missing.length} ${es ? "pendiente(s)" : "missing"}` : es ? "Materiales listos" : "Materials ready"} icon={CheckCircle2} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Por qué coincide" : "Why this matches"}</p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{opportunity.why}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {opportunity.tags.map((tag) => <span key={tag} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.65rem] font-medium text-[#5B4B8A]">{tag}</span>)}
            </div>
          </div>

          <aside className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Materiales" : "Materials"}</p>
            <div className="mt-3 space-y-2 text-sm" style={{ color: mutedColor }}>
              <div className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_150)]" /> {es ? "Bio, declaración, CV y portafolio disponibles desde el Pasaporte." : "Bio, statement, CV, and portfolio available from the Passport."}</div>
              {missing.length ? missing.map((item) => (
                <div key={item} className="flex gap-2"><FileText className="mt-0.5 size-4 shrink-0 text-[#5B4B8A]" /> {missingLabel(item, es)}</div>
              )) : <div className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_150)]" /> {es ? "No faltan materiales requeridos." : "No required materials missing."}</div>}
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border bg-[#FDFBFF] p-4" style={{ borderColor: lavenderSoftLine }}>
          <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
            {es ? "Registro de demostración con datos sintéticos. KLEIO muestra preparación y borradores; el artista revisa y aprueba antes de enviar cualquier cosa." : "Synthetic demo record. KLEIO shows readiness and draft support; the artist reviews and approves before anything is submitted."}
          </p>
        </section>
      </div>
    </main>
  )
}
