"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { useState } from "react"
import { getReviewerProgress } from "@/lib/kleio-analytics"
import { programs, collaborators, institution } from "@/lib/kleio-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import workflowMotion from "@/components/kleio/workflow-motion.module.css"

const program = programs[0]
const committee = collaborators.filter((person) => program.committeeIds.includes(person.id))
const reviewerProgress = getReviewerProgress()

const applicationQuestionsEn = [
  "Artist statement (500 words max)",
  "Project proposal and timeline",
  "Portfolio upload (10 images or equivalent)",
  "Current CV / resume",
  "Budget outline and material needs",
  "Two professional references",
]

const applicationQuestionsEs = [
  "Declaración artística (máximo 500 palabras)",
  "Propuesta del proyecto y calendario",
  "Carga de portafolio (10 imágenes o equivalente)",
  "CV o currículum actualizado",
  "Resumen de presupuesto y necesidades materiales",
  "Dos referencias profesionales",
]

function setupSteps(es: boolean) {
  return es
    ? [
        ["01", "Detalles", "Define título, descripción, categoría y elegibilidad pública."],
        ["02", "Materiales", "Elige los archivos y campos que deben entregar los artistas."],
        ["03", "Rúbrica", "Establece los criterios que usarán los revisores."],
        ["04", "Comité", "Asigna revisores, jurados o equipo antes de recibir postulaciones."],
        ["05", "Publicar", "Abre la convocatoria y lleva postulantes a la cola de revisión."],
      ]
    : [
        ["01", "Call details", "Define title, description, category, and public-facing eligibility."],
        ["02", "Materials", "Choose the exact files and fields artists must provide."],
        ["03", "Rubric", "Set the criteria reviewers will use to evaluate submissions."],
        ["04", "Committee", "Assign reviewers, jurors, or staff before intake begins."],
        ["05", "Publish", "Open the call and route incoming applicants into the review queue."],
      ]
}

function workflowDelay(index: number): CSSProperties {
  return { "--workflow-delay": `${index * 95}ms` } as CSSProperties
}

function roleLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = {
    Reviewer: "Revisor",
    "Guest Juror": "Jurado invitado",
    "Committee Member": "Miembro del comité",
    Curator: "Curador",
    "Grant Administrator": "Administrador de becas",
    Viewer: "Observador",
  }
  return labels[value] ?? value
}

function inviteStatusLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = {
    "Prepared invite": "Invitación preparada",
    "Deferred invite": "Invitación aplazada",
    Prepared: "Preparado",
    Deferred: "Aplazado",
  }
  return labels[value] ?? value
}

export function ProgramsNewPageView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [published, setPublished] = useState(false)
  const questions = es ? applicationQuestionsEs : applicationQuestionsEn

  return (
    <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto min-w-[760px] max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Creación de convocatoria" : "Open call creation"}</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">{es ? "Crear convocatoria" : "Create open call"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {es ? `Construye el punto de entrada institucional para ${institution.name}: detalles de la oportunidad, materiales requeridos, preguntas de postulación, rúbrica y cobertura del comité antes de recibir postulaciones.` : `Build the institutional entry point for ${institution.name}: opportunity details, required materials, application questions, rubric, and committee coverage before submissions arrive.`}
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">{es ? "Flujo demo de trabajo" : "Working demo workflow"}</span>
        </div>

        <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-[0_14px_38px_rgba(82,64,130,0.06)]">
          <div className="grid gap-3 md:grid-cols-5">
            {setupSteps(es).map(([number, title, body], index) => (
              <div key={title} className={`${workflowMotion.step} rounded-xl border border-[#E7E1F7] bg-white px-3 py-3`} style={workflowDelay(index)}>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{number}</p>
                <p className="mt-1 font-serif text-sm font-semibold text-[#292631]">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {published && (
          <div className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-3 text-sm text-[oklch(0.4_0.12_150)]">
            <p className="font-semibold">{es ? `Convocatoria publicada para ${program.title}.` : `Open call published for ${program.title}.`}</p>
            <p className="mt-1 text-xs opacity-80">{es ? "Las nuevas postulaciones ahora pasan a la Cola de revisión y a la Sala de revisión para recepción, avance de revisores, lista corta e informes." : "Incoming applicants now route to the Review Queue and Review Room for intake, reviewer progress, shortlist, and reporting."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Abrir cola de revisión" : "Open Review Queue"}</Link>
              <Link href="/review-room/" className="inline-flex h-9 items-center rounded-xl border border-[oklch(0.85_0.07_150)] bg-white px-3 text-xs font-semibold text-[oklch(0.4_0.12_150)] transition-colors hover:bg-white/70">{es ? "Entrar a sala de revisión" : "Enter Review Room"}</Link>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Esta es la convocatoria" : "Here is the open call"}</p>
            <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">{program.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{program.category} · {program.cycle}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{program.description}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "Calendario" : "Timeline"}</h2>
            <div className="mt-4 space-y-3"><Info label={es ? "Fecha límite de postulación" : "Application deadline"} value={program.deadline} /><Info label={es ? "Inicio del periodo de revisión" : "Review period starts"} value={program.reviewStart} /><Info label={es ? "Fecha de decisión" : "Decision date"} value={program.decisionDate} /></div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "Materiales requeridos del artista" : "Required artist materials"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{es ? "Estos campos se convierten en la lista de verificación dentro de la Cola de revisión." : "These fields become the completeness checklist inside the Review Queue."}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{program.requiredMaterials.map((item, index) => <div key={item} className={`${workflowMotion.step} rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground`} style={workflowDelay(index)}>{item}</div>)}</div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "Preguntas de postulación" : "Application questions"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{es ? "Las respuestas del artista pueden prepararse desde el Pasaporte Creativo y revisarse antes del envío." : "Artist answers can be drafted from a Creative Passport, then reviewed before submission."}</p>
            <div className="mt-4 space-y-2">{questions.map((item, index) => <div key={item} className={`${workflowMotion.step} rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground`} style={workflowDelay(index)}>{item}</div>)}</div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "Rúbrica de revisión" : "Review rubric"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{es ? "Los criterios permanecen visibles para revisores y se conservan para informes." : "Criteria stay visible to reviewers and preserved for reports."}</p>
            <div className="mt-4 space-y-2">{program.rubric.map((item, index) => <div key={item} className={`${workflowMotion.step} flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm`} style={workflowDelay(index)}><span className="text-foreground">{item}</span><span className="text-xs text-muted-foreground">1–5</span></div>)}</div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "Asignación de comité" : "Committee assignment"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{es ? "Los asientos de revisión se mantienen simples: asignado, en revisión, enviado o requiere conversación." : "Reviewer seats remain simple: assigned, in review, submitted, or needs discussion."}</p>
            <div className="mt-4 space-y-3">
              {committee.map((person, index) => {
                const progress = reviewerProgress.find((entry) => entry.reviewerId === person.id)
                return <div key={person.id} className={`${workflowMotion.step} flex items-center justify-between rounded-xl border border-border bg-background p-3`} style={workflowDelay(index)}><div><p className="text-sm font-medium text-foreground">{person.name}</p><p className="text-xs text-muted-foreground">{roleLabel(person.role, es)} · {inviteStatusLabel(person.inviteStatus, es)}</p></div><span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">{progress ? `${progress.completed}/${progress.assigned}` : "0/0"} {es ? "revisiones" : "reviews"}</span></div>
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPublished(true)} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">{es ? "Publicar convocatoria" : "Publish open call"}</button>
          <Link href="/programs/" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Volver a Programas" : "Back to Programs"}</Link>
          <Link href="/review-queue/" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Cola de revisión" : "Review Queue"}</Link>
        </div>
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div>
}
