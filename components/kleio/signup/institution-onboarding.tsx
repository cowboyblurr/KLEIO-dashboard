"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { institution } from "@/lib/kleio-data"
import { SignupShell } from "@/components/kleio/signup/signup-shell"
import { ImportAssistWidget } from "@/components/kleio/import-assist-widget"
import { cn } from "@/lib/utils"

const steps = [
  "Institution details",
  "Branding",
  "Team members",
  "Review roles",
  "Program categories",
  "Application materials",
  "Review rubric",
  "Review",
]

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        defaultValue={value}
        readOnly
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
      />
    </label>
  )
}

export function InstitutionOnboarding() {
  const [step, setStep] = useState(0)

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <SignupShell step={step + 1} totalSteps={steps.length} title="Create your institution workspace">
      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <span
            key={label}
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.65rem] font-medium",
              i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Institution name and type</h2>
            <Field label="Institution name" value={institution.name} />
            <Field label="Institution type" value={institution.type} />
            <Field label="Location" value={institution.location} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Branding</h2>
            <Field label="Workspace label" value={institution.workspaceLabel} />
            <Field label="Current cycle" value={institution.currentCycle} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Team members</h2>
            <Field label="Program Director" value="Mara Voss" />
            <Field label="Curator" value="Theo Malik" />
            <Field label="Grant Administrator" value="Lina Park" />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Review roles</h2>
            <Field label="Roles" value="Program Director, Curator, Reviewer, Guest Juror, Grant Administrator" />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Program categories</h2>
            <Field label="Categories" value="Residency, Fellowship, Exhibition, Open Call" />
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Default application materials</h2>
            <Field label="Required materials" value="Artist bio, Statement, CV, Portfolio, Project proposal, References" />
          </div>
        )}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Review rubric preference</h2>
            <Field label="Rubric criteria" value="Conceptual strength, Material clarity, Program fit, Feasibility, Research depth" />
          </div>
        )}
        {step === 7 && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h2 className="font-serif text-xl font-semibold text-foreground">Review your workspace</h2>
            <p className="text-sm text-muted-foreground">
              {institution.name} will be set up with demo programs, collaborators, and synthetic submissions.
            </p>
            <div className="rounded-xl border border-border bg-background p-4 text-left text-sm">
              <p className="font-medium text-foreground">{institution.name}</p>
              <p className="text-muted-foreground">{institution.type} · {institution.location}</p>
              <p className="mt-2 text-muted-foreground">{institution.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <ImportAssistWidget userType="institution" subjectId="kleio-arthouse" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Institution Workspace
          </Link>
        )}
      </div>
    </SignupShell>
  )
}
