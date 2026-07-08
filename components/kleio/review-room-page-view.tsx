"use client"

import Link from "next/link"
import { analytics, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { collaborators, programs, type Collaborator, type Submission } from "@/lib/kleio-data"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderMist = "#F7F4FF"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.06)"

const primaryProgram = programs[0]
const reviewSubmissions = analytics.reviewQueue.slice(0, 5)
const roomReviewers = collaborators.filter((person) =>
  primaryProgram.committeeIds.includes(person.id) || person.assignedProgramIds.includes(primaryProgram.id),
)

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

function reviewerStage(person: Collaborator): "Assigned" | "In Review" | "Submitted" | "Needs Discussion" {
  if (person.reviewsAssigned === 0) return "Needs Discussion"
  if (person.reviewsCompleted >= person.reviewsAssigned) return "Submitted"
  if (person.reviewsCompleted > 0) return "In Review"
  return "Assigned"
}

function stageClass(stage: string) {
  if (stage === "Submitted") return "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]"
  if (stage === "In Review") return "bg-primary/10 text-primary"
  if (stage === "Needs Discussion") return "bg-[oklch(0.95_0.04_75)] text-[oklch(0.48_0.12_65)]"
  return "bg-[#F1ECFB] text-[#5B4B8A]"
}

function missingCopy(submission: Submission) {
  const count = submission.missingMaterials?.length ?? 0
  if (!count) return "Complete file"
  if (count === 1) return "1 material still needs attention"
  return `${count} materials still need attention`
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-white ${className}`} style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
      {children}
    </section>
  )
}

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>{eyebrow}</p>
      <h2 className="mt-1 font-serif text-lg font-semibold" style={{ color: inkColor }}>{title}</h2>
      {body && <p className="mt-1 text-sm leading-relaxed" style={{ color: mutedColor }}>{body}</p>}
    </div>
  )
}

export function ReviewRoomPageView() {
  const shortlistCandidates = reviewSubmissions.filter((submission) => submission.status === "Shortlisted" || submission.status === "Interview" || submission.status === "Pending Vote")
  const discussionCandidates = reviewSubmissions.filter((submission) => (submission.missingMaterials?.length ?? 0) > 0 || submission.status === "Pending Info")

  return (
    <DemoPageShell
      title="Review Room"
      description="The Review Room gives the committee a calmer place to discuss applicants with the right context nearby, so promising work can move from review into shortlist, decision history, and reporting without losing the reason behind each step."
      actions={
        <>
          <Link href="/shortlist/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Committee Shortlist
          </Link>
          <Link href="/reports/" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">
            View Report
          </Link>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DemoStatRow label="Open call" value={primaryProgram.status} href="/programs/" />
        <DemoStatRow label="Applicants" value={analytics.reviewQueueCount} href="/review-queue/" />
        <DemoStatRow label="Reviewers" value={roomReviewers.length} href="/committee/" />
        <DemoStatRow label="Needs attention" value={analytics.incompleteCount} href="/review-queue/" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionHeader
            eyebrow="Open call context"
            title={primaryProgram.title}
            body="The call stays visible during review so the committee can discuss applicants against the actual requirements, dates, materials, and rubric that shaped the opportunity."
          />
          <div className="grid gap-3 p-5 md:grid-cols-3">
            <Info label="Deadline" value={formatDate(primaryProgram.deadline)} />
            <Info label="Review starts" value={formatDate(primaryProgram.reviewStart)} />
            <Info label="Decision date" value={formatDate(primaryProgram.decisionDate)} />
          </div>
          <div className="grid gap-4 border-t p-5 md:grid-cols-2" style={{ borderColor: lavenderSoftLine }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>Required materials</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {primaryProgram.requiredMaterials.map((item) => (
                  <span key={item} className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: lavenderSoftLine, color: inkColor }}>{item}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>Review criteria</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {primaryProgram.rubric.map((item) => (
                  <span key={item} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-medium" style={{ color: lavenderDeep }}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Applicant context"
            title="Applicants ready for discussion"
            body="Each applicant row keeps the project, material readiness, reviewer progress, and next action close enough for the committee to understand what is ready and what still needs care."
          />
          <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
            {reviewSubmissions.map((submission) => {
              const progress = getSubmissionReviewerProgress(submission.id)
              return (
                <li key={submission.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialAvatar name={submission.artist} className="size-10 text-xs" />
                      <div className="min-w-0">
                        <p className="truncate font-medium" style={{ color: inkColor }}>{submission.artist}</p>
                        <p className="truncate text-sm" style={{ color: mutedColor }}>{submission.projectTitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.65rem] font-semibold" style={{ color: lavenderDeep }}>{submission.completeness}% complete</span>
                      <span className="rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>{progress.completed}/{progress.total} reviews</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span style={{ color: mutedColor }}>{missingCopy(submission)}</span>
                    <Link href="/review-queue/" className="font-medium" style={{ color: lavenderDeep }}>Open applicant review →</Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader
            eyebrow="Reviewer progress"
            title="Simple reviewer states"
            body="Reviewer status stays intentionally easy to read, so the institution can see whether each seat is assigned, in review, submitted, or needs discussion."
          />
          <div className="space-y-3 p-5">
            {roomReviewers.map((person) => {
              const stage = reviewerStage(person)
              return (
                <div key={person.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3" style={{ borderColor: lavenderSoftLine }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <InitialAvatar name={person.name} className="size-9 text-xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: inkColor }}>{person.name}</p>
                      <p className="truncate text-xs" style={{ color: mutedColor }}>{person.role} · {person.reviewsCompleted}/{person.reviewsAssigned} reviews</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${stageClass(stage)}`}>{stage}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Decision movement"
            title="From discussion to shortlist"
            body="This area helps the committee separate what needs more context from what is ready to move forward, so the final report can explain the path clearly."
          />
          <div className="grid gap-3 p-5 md:grid-cols-3">
            <DecisionLane title="Needs Discussion" count={discussionCandidates.length} body="Use this lane for promising files that still need material clarification, reviewer context, or committee conversation." href="/review-queue/" />
            <DecisionLane title="Shortlist" count={shortlistCandidates.length || analytics.shortlistedCount} body="Use this lane for applicants with enough context to move toward final comparison or interview." href="/shortlist/" />
            <DecisionLane title="Report" count={programs.length} body="Use this lane to see how program context, reviewer progress, outcomes, and decision history become institutional memory." href="/reports/" />
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="p-6" style={{ backgroundColor: lavenderMist }}>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>Report readiness</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>The reason behind each decision stays attached.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: mutedColor }}>
              KLEIO should feel like a prepared editorial room, not a cold spreadsheet. As the committee reviews, the report can inherit program context, applicant movement, reviewer progress, shortlist notes, and decision history from the workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/reports/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Open report</Link>
              <Link href="/activity-log/" className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold transition-colors hover:bg-white/70" style={{ color: lavenderDeep }}>Decision history</Link>
            </div>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {[
              ["Open call", primaryProgram.title],
              ["Applicants", `${analytics.reviewQueueCount} active records`],
              ["Reviewers", `${roomReviewers.length} assigned seats`],
              ["Needs attention", `${analytics.incompleteCount} records need care`],
              ["Shortlist", `${analytics.shortlistedCount} candidates`],
              ["Report", "Decision context preserved"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border p-4" style={{ borderColor: lavenderSoftLine }}>
                <p className="text-xs font-medium" style={{ color: mutedColor }}>{label}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: inkColor }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </DemoPageShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-3" style={{ borderColor: lavenderSoftLine }}>
      <p className="text-xs font-medium" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: inkColor }}>{value}</p>
    </div>
  )
}

function DecisionLane({ title, count, body, href }: { title: string; count: number; body: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border bg-white p-4 transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{title}</h3>
        <span className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-xs font-semibold" style={{ color: lavenderDeep }}>{count}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{body}</p>
    </Link>
  )
}
