"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { SignupShell } from "@/components/kleio/signup/signup-shell"
import { cn } from "@/lib/utils"

const steps = [
  "Basic profile",
  "Location & discipline",
  "Bio & statement",
  "Portfolio works",
  "CV & documents",
  "Availability",
  "Review",
]

const demoValues = {
  name: "Amina El Badri",
  email: "amina@aminaelbadri.com",
  location: "Cairo, Egypt",
  discipline: "Visual Artist",
  medium: "Installation",
  bio: "Amina builds immersive environments from fabric, sound, archival fragments, and light.",
  statement: "My work explores the relationship between memory, space, and visibility through minimal forms and subtle light.",
  works: "Echoes of Memory, Between Breaths, Thresholds, Liminal Field",
  documents: "CV, Artist Statement, Portfolio PDF, Project Deck",
  availability: "Residencies, Exhibitions, Open Calls, Commissions",
}

function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        readOnly
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
      />
    </label>
  )
}

function TextArea({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        defaultValue={value}
        readOnly
        rows={4}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
      />
    </label>
  )
}

export function ArtistOnboarding() {
  const [step, setStep] = useState(0)

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <SignupShell step={step + 1} totalSteps={steps.length} title="Create your Creative Passport">
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
            <h2 className="font-serif text-lg font-semibold text-foreground">Basic profile</h2>
            <Field label="Full name" value={demoValues.name} />
            <Field label="Email" value={demoValues.email} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Location and discipline</h2>
            <Field label="Location" value={demoValues.location} />
            <Field label="Discipline" value={demoValues.discipline} />
            <Field label="Primary medium" value={demoValues.medium} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Bio and artist statement</h2>
            <TextArea label="Short bio" value={demoValues.bio} />
            <TextArea label="Artist statement" value={demoValues.statement} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Portfolio works</h2>
            <p className="text-sm text-muted-foreground">Add featured works to your passport. Demo pre-filled with four works.</p>
            <Field label="Featured works" value={demoValues.works} />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">CV and documents</h2>
            <p className="text-sm text-muted-foreground">Upload materials that institutions commonly request.</p>
            <Field label="Documents" value={demoValues.documents} />
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Availability and opportunity preferences</h2>
            <Field label="Open to" value={demoValues.availability} />
          </div>
        )}
        {step === 6 && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h2 className="font-serif text-xl font-semibold text-foreground">Review your Creative Passport</h2>
            <p className="text-sm text-muted-foreground">
              Your passport will be ready to share with institutions. All fields are pre-filled for this demo.
            </p>
            <div className="rounded-xl border border-border bg-background p-4 text-left text-sm">
              <p className="font-medium text-foreground">{demoValues.name}</p>
              <p className="text-muted-foreground">{demoValues.discipline} · {demoValues.location}</p>
              <p className="mt-2 text-muted-foreground">{demoValues.statement}</p>
            </div>
          </div>
        )}
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
            href="/artist-dashboard/"
            className="flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Creative Passport
          </Link>
        )}
      </div>
    </SignupShell>
  )
}
