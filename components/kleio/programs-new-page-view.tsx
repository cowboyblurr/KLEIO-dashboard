"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { useState } from "react"
import { getReviewerProgress } from "@/lib/kleio-analytics"
import { programs, collaborators, institution } from "@/lib/kleio-data"
import workflowMotion from "@/components/kleio/workflow-motion.module.css"

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

const setupSteps = [
  ["01", "Call details", "Define title, description, category, and public-facing eligibility."],
  ["02", "Materials", "Choose the exact files and fields artists must provide."],
  ["03", "Rubric", "Set the criteria reviewers will use to evaluate submissions."],
  ["04", "Committee", "Assign reviewers, jurors, or staff before intake begins."],
  ["05", "Publish", "Open the call and route incoming applicants into the review queue."],
]

function workflowDelay(index: number): CSSProperties {
  return { "--workflow-delay": `${index * 95}ms` } as CSSProperties
}

export function ProgramsNewPageView() {
  const [published, setPublished] = useState(false)

  return (
    <main className="min-h-0 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Open call creation</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
              Create open call
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Build the institutional entry point for {institution.name}: opportunity details, required materials,
              application questions, rubric, and committee coverage before submissions arrive.
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Working demo workflow
          </span>
        </div>

        <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-[0_14px_38px_rgba(82,64,130,0.06)]">
          <div className="grid gap-3 md:grid-cols-5">
            {setupSteps.map(([number, title, body], index) => (
              <div
                key={title}
                className={`${workflowMotion.step} rounded-xl border border-[#E7E1F7] bg-white px-3 py-3`}
                style={workflowDelay(index)}
              >
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{number}</p>
                <p className="mt-1 font-serif text-sm font-semibold text-[#292631]">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {published && (
          <div className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-3 text-sm text-[oklch(0.4_0.12_150)]">
            <p className="font-semibold">Open call published for {program.title}.</p>
            <p className="mt-1 text-xs opacity-80">Incoming applicants now route to the Review Queue and Review Room for intake, reviewer progress, shortlist, and reporting.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Open Review Queue
              </Link>
              <Link href="/review-room/" className="inline-flex h-9 items-center rounded-xl border border-[oklch(0.85_0.07_150)] bg-white px-3 text-xs font-semibold text-[oklch(0.4_0.12_150)] transition-colors hover:bg-white/70">
                Enter Review Room
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Here is the open call</p>
            <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">{program.title}</h2>
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
            <p className="mt-1 text-sm text-muted-foreground">These fields become the completeness checklist inside the Review Queue.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {program.requiredMaterials.map((item, index) => (
                <div key={item} className={`${workflowMotion.step} rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground`} style={workflowDelay(index)}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Application questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Artist answers can be drafted from a Creative Passport, then reviewed before submission.</p>
            <div className="mt-4 space-y-2">
              {applicationQuestions.map((item, index) => (
                <div key={item} className={`${workflowMotion.step} rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground`} style={workflowDelay(index)}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Review rubric</h2>
            <p className="mt-1 text-sm text-muted-foreground">Criteria stay visible to reviewers and preserved for reports.</p>
            <div className="mt-4 space-y-2">
              {program.rubric.map((item, index) => (
                <div key={item} className={`${workflowMotion.step} flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm`} style={workflowDelay(index)}>
                  <span className="text-foreground">{item}</span>
                  <span className="text-xs text-muted-foreground">1–5</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
            <h2 className="font-serif text-xl font-semibold text-foreground">Committee assignment</h2>
            <p className="mt-1 text-sm text-muted-foreground">Reviewer seats remain simple: assigned, in review, submitted, or needs discussion.</p>
            <div className="mt-4 space-y-3">
              {committee.map((person, index) => {
                const progress = reviewerProgress.find((entry) => entry.reviewerId === person.id)
                return (
                  <div key={person.id} className={`${workflowMotion.step} flex items-center justify-between rounded-xl border border-border bg-background p-3`} style={workflowDelay(index)}>
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPublished(true)} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            Publish open call
          </button>
          <Link href="/programs/" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">
            Back to Programs
          </Link>
          <Link href="/review-queue/" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">
            Review Queue
          </Link>
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
