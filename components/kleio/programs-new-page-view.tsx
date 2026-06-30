"use client"

import { useState } from "react"
import { getReviewerProgress } from "@/lib/kleio-analytics"
import { programs, collaborators, institution } from "@/lib/kleio-data"

const program = programs[0]
const committee = collaborators.filter((person) => program.committeeIds.includes(person.id))
const reviewerProgress = getReviewerProgress()

const applicationQuestions = [
  "Artist statement (500 words max)",
  "Project proposal and timeline",
  "Portfolio upload (10 images or equivalent)",
  "Current CV / resume",
  "Budget outline and material needs",
  "Two professional references",
]

export function ProgramsNewPageView() {
  const [published, setPublished] = useState(false)

  return (
    <main className="min-h-0 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Program setup</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
              Create open call
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Demo setup for {institution.name}. Define the opportunity, required materials, rubric, and review
              committee before applications arrive.
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {institution.demoLabel}
          </span>
        </div>

        {published && (
          <p className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
            Open call published for {program.title} (demo only — no data leaves this session).
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Program details</h2>
            <p className="mt-1 text-sm text-muted-foreground">{program.category} · {program.cycle}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{program.description}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Timeline</h2>
            <div className="mt-4 space-y-3">
              <Info label="Application deadline" value={program.deadline} />
              <Info label="Review period starts" value={program.reviewStart} />
              <Info label="Decision date" value={program.decisionDate} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Required artist materials</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {program.requiredMaterials.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Application questions</h2>
            <div className="mt-4 space-y-2">
              {applicationQuestions.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Review rubric</h2>
            <div className="mt-4 space-y-2">
              {program.rubric.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <span className="text-foreground">{item}</span>
                  <span className="text-xs text-muted-foreground">1–5</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Committee assignment</h2>
            <div className="mt-4 space-y-3">
              {committee.map((person) => {
                const progress = reviewerProgress.find((entry) => entry.reviewerId === person.id)
                return (
                  <div key={person.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.role} · {person.inviteStatus}</p>
                    </div>
                    <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                      {progress ? `${progress.completed}/${progress.assigned}` : "0/0"} reviews
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setPublished(true)}
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Publish open call
          </button>
        </div>
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
