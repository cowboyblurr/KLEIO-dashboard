"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, FileText, WandSparkles, X } from "lucide-react"
import {
  artistOpportunityDirectory,
  getArtistOpportunityFundingTotal,
  getDueSoonOpportunityCount,
  getReadyOpportunityCount,
  type DirectoryOpportunity,
} from "@/lib/kleio-opportunities"
import { artistAnalytics, formatDemoDateDisplay } from "@/lib/kleio-artist-analytics"
import { formatKleioCurrency } from "@/lib/kleio-i18n"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function toneForPct(value: number): "success" | "warning" | "info" {
  if (value >= 88) return "success"
  if (value >= 78) return "info"
  return "warning"
}

function typeLabel(value: DirectoryOpportunity["type"], es: boolean) {
  if (!es) return value
  return ({ Grant: "Beca", Residency: "Residencia", "Open Call": "Convocatoria", Fellowship: "Fellowship" } as Record<string, string>)[value] ?? value
}

function urgencyLabel(value: string, es: boolean) {
  if (!es) return value
  return ({ "This week": "Esta semana", "Due soon": "Próxima", Upcoming: "Por venir" } as Record<string, string>)[value] ?? value
}

function effortLabel(value: string, es: boolean) {
  if (!es) return value
  return ({ Low: "Bajo", Medium: "Medio", High: "Alto" } as Record<string, string>)[value] ?? value
}

function missingLabel(value: string, es: boolean) {
  if (!es) return value
  return ({
    "Budget Template": "Plantilla de presupuesto",
    "Work sample": "Muestra de obra",
    "Support Materials": "Materiales de apoyo",
  } as Record<string, string>)[value] ?? value
}

function tagLabel(value: string, es: boolean) {
  if (!es) return value
  return ({
    Grant: "Beca",
    Residency: "Residencia",
    "Open Call": "Convocatoria",
    Fellowship: "Fellowship",
    Light: "Luz",
    Installation: "Instalación",
    Memory: "Memoria",
    Community: "Comunidad",
    "Public Art": "Arte público",
    International: "Internacional",
    "Follow-up": "Seguimiento",
    Decision: "Decisión",
    Awarded: "Otorgada",
    Contemporary: "Contemporáneo",
    Materials: "Materiales",
    Process: "Proceso",
  } as Record<string, string>)[value] ?? value
}

function draftBody(opportunity: DirectoryOpportunity, es: boolean) {
  return es
    ? `Estoy preparando una postulación para ${opportunity.title} porque la oportunidad se alinea con mi práctica actual de instalación en torno a memoria, presencia material, luz y experiencia espacial. El proyecto propuesto ampliaría mi cuerpo de obra mediante una presentación enfocada de entornos inmersivos construidos con tela, sonido, fragmentos de archivo y luz sutil.`
    : `I am preparing an application for ${opportunity.title} because the opportunity aligns with my current installation practice around memory, material presence, light, and spatial experience. The proposed project would expand my ongoing body of work through a focused presentation of immersive environments built from fabric, sound, archival fragments, and subtle light.`
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <section className="rounded-2xl border bg-white p-4" style={cardStyle}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: mutedColor }}>{detail}</p>
    </section>
  )
}

function ApplicationDraftWizard({ opportunity, locale, onClose }: { opportunity: DirectoryOpportunity; locale: string; onClose: () => void }) {
  const es = locale === "es"
  const [step, setStep] = useState<"materials" | "draft" | "approve">("materials")
  const [proposal, setProposal] = useState(draftBody(opportunity, es))
  const [confirmed, setConfirmed] = useState(false)
  const missing = opportunity.missing.length ? opportunity.missing.map((item) => missingLabel(item, es)) : [es ? "No faltan materiales requeridos" : "No required materials missing"]

  return (
    <aside className="sticky top-6 rounded-2xl border bg-white" style={cardStyle}>
      <div className="flex items-start justify-between gap-3 border-b border-[#E7E1F7] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Herramienta de borrador" : "Application draft tool"}</p>
          <h2 className="mt-1 font-serif text-lg font-semibold" style={{ color: inkColor }}>{opportunity.title}</h2>
          <p className="mt-1 text-xs" style={{ color: mutedColor }}>{opportunity.institution} · {opportunity.fit}% {es ? "afinidad" : "match"} · {opportunity.readiness}% {es ? "listo" : "ready"}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={es ? "Cerrar herramienta" : "Close draft tool"} className="grid size-8 place-items-center rounded-lg text-[#7F7890] transition-colors hover:bg-[#F7F4FF] hover:text-[#292631]"><X className="size-4" /></button>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 text-[0.65rem] font-semibold">
          {[["materials", es ? "Materiales" : "Materials"], ["draft", es ? "Borrador" : "Draft"], ["approve", es ? "Aprobar" : "Approve"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setStep(id as "materials" | "draft" | "approve")} className={`rounded-full px-2 py-1.5 transition-colors ${step === id ? "bg-[#5B4B8A] text-white" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}>{label}</button>
          ))}
        </div>

        {step === "materials" && (
          <div className="mt-5 space-y-3">
            <KleioAssistObject mode="reviewing" title={es ? "Revisión del Pasaporte completa" : "Passport scan complete"} description={es ? "KLEIO comparó la oportunidad con el Pasaporte Creativo y separó materiales listos de los elementos que requieren atención." : "KLEIO matched the opportunity against the Creative Passport and separated ready materials from items needing attention."} size="sm" compact progress={opportunity.readiness} />
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Revisión de materiales" : "Materials check"}</p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: mutedColor }}>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_150)]" /> {es ? "Bio, declaración, portafolio y CV pueden tomarse del Pasaporte Creativo." : "Bio, statement, portfolio, and CV can be pulled from the Creative Passport."}</li>
                {missing.map((item) => <li key={item} className="flex gap-2"><FileText className="mt-0.5 size-4 shrink-0 text-[#5B4B8A]" /> {item}</li>)}
              </ul>
            </div>
            <button type="button" onClick={() => setStep("draft")} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Preparar borrador desde el Pasaporte" : "Prepare draft from passport"}</button>
          </div>
        )}

        {step === "draft" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Respuesta borrador" : "Draft answer"}</p>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>{es ? "Texto demo editable. El artista revisa y aprueba antes de guardar o enviar." : "Editable demo copy. The artist reviews and approves before anything is saved or submitted."}</p>
              <textarea value={proposal} onChange={(event) => setProposal(event.target.value)} rows={8} className="mt-3 w-full resize-none rounded-xl border border-[#E7E1F7] bg-white p-3 text-sm leading-relaxed outline-none transition-colors focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/15" style={{ color: inkColor }} />
            </div>
            <button type="button" onClick={() => setStep("approve")} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Revisar paquete de postulación" : "Review application package"}</button>
          </div>
        )}

        {step === "approve" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Paquete de postulación" : "Application package"}</p>
              <div className="mt-3 grid gap-2 text-sm" style={{ color: mutedColor }}>
                {(es ? ["Bio de artista adjunta", "Declaración artística adjunta", "PDF de portafolio adjunto", "Respuesta borrador preparada"] : ["Artist bio attached", "Artist statement attached", "Portfolio PDF attached", "Draft answer prepared"]).map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> {item}</div>)}
              </div>
            </div>
            {confirmed && <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">{es ? "Borrador demo guardado en Aplicaciones. Nada fue enviado fuera de este prototipo." : "Demo draft saved to Applications. Nothing was submitted outside this prototype."}</p>}
            <button type="button" onClick={() => setConfirmed(true)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><WandSparkles className="size-4" />{es ? "Guardar borrador en Aplicaciones" : "Save draft to Applications"}</button>
          </div>
        )}
      </div>
    </aside>
  )
}

export function ArtistOpportunitiesPageView() {
  const { locale, t } = useKleioLocale()
  const es = locale === "es"
  const [query, setQuery] = useState("")
  const [selectedOpportunity, setSelectedOpportunity] = useState<DirectoryOpportunity | null>(null)
  const analytics = artistAnalytics

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return artistOpportunityDirectory
    if (normalized === "fit" || normalized.includes("afinidad")) return artistOpportunityDirectory.filter((opportunity) => opportunity.fit >= 88)
    if (normalized === "due" || normalized.includes("próxima") || normalized.includes("pronta")) return artistOpportunityDirectory.filter((opportunity) => opportunity.urgency !== "Upcoming")
    if (normalized === "grant" || normalized === "grants" || normalized === "beca") return artistOpportunityDirectory.filter((opportunity) => opportunity.type === "Grant")
    if (normalized === "residency" || normalized === "residencies" || normalized === "residencia") return artistOpportunityDirectory.filter((opportunity) => opportunity.type === "Residency")
    return artistOpportunityDirectory.filter((opportunity) => `${opportunity.title} ${opportunity.institution} ${opportunity.type} ${opportunity.urgency} ${opportunity.effort} ${opportunity.tags.join(" ")}`.toLowerCase().includes(normalized))
  }, [query])

  const readyToApply = getReadyOpportunityCount()
  const dueSoon = getDueSoonOpportunityCount()
  const potentialFunding = getArtistOpportunityFundingTotal()
  const strongestOpportunity = artistOpportunityDirectory[0]
  const materialsGap = analytics.materialsTotalCount - analytics.materialsReadyCount

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={es ? "Directorio de becas y oportunidades" : "Grant & Opportunity Directory"}
          title={es ? "Encuentra oportunidades alineadas sin reconstruir cada postulación." : "Find aligned opportunities without rebuilding every application."}
          description={es ? "KLEIO compara el Pasaporte Creativo con becas, residencias, fellowships y convocatorias, y muestra afinidad, preparación, materiales faltantes, urgencia de fecha y esfuerzo de postulación." : "KLEIO matches the Creative Passport against grants, residencies, fellowships, and open calls, then shows fit, readiness, missing materials, deadline urgency, and application effort."}
          secondaryCta={{ label: t("artist.workspace.opportunities.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <section className="rounded-2xl border bg-white p-4" style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: inkColor }}>{es ? "Herramienta de borrador" : "Application draft tool"}</p>
              <p className="mt-0.5 text-sm" style={{ color: mutedColor }}>{es ? "Elige una oportunidad y KLEIO abrirá un borrador revisable sin enviarte a otra página." : "Choose an opportunity and KLEIO will open a reviewable draft wizard instead of sending you to another page."}</p>
            </div>
            <button type="button" onClick={() => setSelectedOpportunity(strongestOpportunity)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><WandSparkles className="size-4" />{es ? "Empezar mejor borrador" : "Start strongest draft"}</button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label={es ? "Oportunidades alineadas" : "Matched opportunities"} value={artistOpportunityDirectory.length} detail={es ? "Curadas desde señales del Pasaporte" : "Curated from passport signals"} />
          <Metric label={es ? "Listas para postular" : "Ready to apply"} value={readyToApply} detail={es ? `${materialsGap} materiales requieren atención` : `${materialsGap} materials need attention`} />
          <Metric label={es ? "Próximas" : "Due soon"} value={dueSoon} detail={es ? "Fechas con presión cercana" : "Deadlines with near-term pressure"} />
          <Metric label={es ? "Financiamiento potencial" : "Potential funding"} value={formatKleioCurrency(locale, potentialFunding)} detail={es ? "Calculado desde oportunidades compartidas" : "Calculated from shared opportunity records"} />
        </section>

        <section className="rounded-2xl border bg-white p-4" style={cardStyle}>
          <SearchFilterBar
            placeholder={es ? "Buscar beca, residencia, afinidad o fecha…" : "Search grant, residency, fit, or deadline…"}
            value={query}
            onChange={setQuery}
            filterChips={es ? ["Todas", "Beca", "Residencia", "Afinidad", "Próxima"] : ["All", "Grant", "Residency", "Fit", "Due"]}
          />
        </section>

        <div className={`grid gap-4 ${selectedOpportunity ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
          <section className="grid gap-4 md:grid-cols-2">
            {filtered.map((opportunity) => (
              <article key={opportunity.id} className="rounded-2xl border bg-white p-5" style={cardStyle}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{typeLabel(opportunity.type, es)} · {opportunity.institution}</p>
                    <h2 className="mt-1 font-serif text-xl font-semibold" style={{ color: inkColor }}>{opportunity.title}</h2>
                    <p className="mt-1 text-sm" style={{ color: mutedColor }}>{formatDemoDateDisplay(opportunity.deadline, locale)} · {urgencyLabel(opportunity.urgency, es)} · {effortLabel(opportunity.effort, es)} {es ? "esfuerzo" : "effort"}</p>
                  </div>
                  <DemoStatusChip label={`${opportunity.fit}% ${es ? "afinidad" : "fit"}`} tone={toneForPct(opportunity.fit)} translate={false} />
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: mutedColor }}>{es ? opportunity.why : opportunity.why}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium" style={{ color: mutedColor }}>{es ? "Preparación" : "Readiness"}</p>
                    <DemoStatusChip label={`${opportunity.readiness}%`} tone={toneForPct(opportunity.readiness)} translate={false} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium" style={{ color: mutedColor }}>{es ? "Monto" : "Amount"}</p>
                    <p className="text-sm font-semibold" style={{ color: inkColor }}>{opportunity.amount ? formatKleioCurrency(locale, opportunity.amount) : es ? "No especificado" : "Not specified"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {opportunity.tags.map((tag) => <span key={tag} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.65rem] font-medium text-[#5B4B8A]">{tagLabel(tag, es)}</span>)}
                </div>

                <div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Materiales faltantes" : "Missing materials"}</p>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>{opportunity.missing.length ? opportunity.missing.map((item) => missingLabel(item, es)).join(", ") : es ? "Ninguno" : "None"}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedOpportunity(opportunity)} className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{t("artist.workspace.opportunities.cta.prepareDraft")}</button>
                  <a href="/artist-dashboard/passport/" className="inline-flex h-9 items-center rounded-xl border border-[#D8D0F2] px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">{t("artist.workspace.opportunities.cta.reviewPassport")}</a>
                </div>
              </article>
            ))}
          </section>

          {selectedOpportunity && <ApplicationDraftWizard opportunity={selectedOpportunity} locale={locale} onClose={() => setSelectedOpportunity(null)} />}
        </div>
      </div>
    </main>
  )
}
