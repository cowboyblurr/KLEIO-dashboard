"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileWarning, MessageSquareText, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { artists, programs, type Submission } from "@/lib/kleio-data"
import { getLatestSubmissionNote, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { internalArtistHref, submissionHref } from "@/lib/kleio-entity-routes"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { SubmissionStatusBadge } from "@/components/kleio/submission-status-badge"

export function ArtistPassportView({ submission }: { submission: Submission }) {
  const artist = artists.find((entry) => entry.id === submission.artistId)
  const program = programs.find((entry) => entry.id === submission.programId)
  const latestNote = getLatestSubmissionNote(submission.id)
  const reviewerProgress = getSubmissionReviewerProgress(submission.id)

  return (
    <main className="flex h-full min-h-0 flex-col overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto w-full max-w-6xl">
        <Link href={submissionHref(submission.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to submission
        </Link>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <InitialAvatar name={submission.artist} className="size-14 text-sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Creative Passport</p>
                  <h1 className="mt-1 truncate font-serif text-2xl font-semibold text-foreground">{submission.artist}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{submission.location} · {submission.discipline}</p>
                </div>
              </div>
              <SubmissionStatusBadge status={submission.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Passport completeness</p><p className="mt-2 font-serif text-2xl font-semibold text-foreground">{artist?.passportCompleteness ?? submission.completeness}%</p></div>
              <div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Submitted project</p><p className="mt-2 text-sm font-semibold text-foreground">{submission.projectTitle}</p></div>
              <div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Program</p><p className="mt-2 text-sm font-semibold text-foreground">{program?.title ?? submission.program}</p></div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground">Artist statement</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{artist?.statement ?? submission.statement}</p>
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground">Practice</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{artist?.bio ?? submission.statement}</p>
                <div className="mt-3 flex flex-wrap gap-2">{(artist?.tags ?? [submission.medium, submission.discipline]).map((tag) => <span key={tag} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}</div>
              </div>
            </div>

            {artist?.works?.length ? (
              <div className="mt-7">
                <h2 className="font-serif text-lg font-semibold text-foreground">Selected work</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {artist.works.slice(0, 6).map((work) => <article key={work.id} className="overflow-hidden rounded-xl border border-border bg-background"><div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${work.image})` }} /><div className="p-3"><h3 className="text-sm font-semibold text-foreground">{work.title}</h3><p className="mt-1 text-xs text-muted-foreground">{work.year} · {work.medium}</p></div></article>)}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-foreground">Application readiness</h2>
              <div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Submission completeness</span><span className="text-sm font-semibold text-foreground">{submission.completeness}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${submission.completeness}%` }} /></div>

              {submission.missingMaterials?.length ? (
                <div className="mt-4 rounded-xl border border-[oklch(0.88_0.08_65)] bg-[oklch(0.97_0.04_75)] p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-[oklch(0.45_0.14_65)]"><FileWarning className="size-4" /> Missing materials</p>
                  <ul className="mt-2 space-y-1">
                    {submission.missingMaterials.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">· {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {reviewerProgress.total > 0 && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Reviewer progress</p>
                    <span className="text-xs font-semibold text-primary">{reviewerProgress.completed}/{reviewerProgress.total}</span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(reviewerProgress.completed / reviewerProgress.total) * 100}%` }} />
                  </div>
                  <ul className="space-y-1.5">
                    {reviewerProgress.reviews.map((review) => (
                      <li key={review.reviewerId} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2"><InitialAvatar name={review.reviewerName} className="size-5 text-[0.55rem]" /><span className="text-xs text-foreground">{review.reviewerName}</span></div>
                        <span className={cn("text-[0.65rem] font-medium", review.status === "Complete" ? "text-[oklch(0.4_0.13_150)]" : "text-muted-foreground")}>{review.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submission.score !== null && submission.score !== undefined && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
                  <div className="flex items-center gap-1.5"><Star className="size-3.5 text-[oklch(0.74_0.15_60)]" /><span className="text-xs font-medium text-foreground">Committee score</span></div>
                  <span className="text-sm font-bold text-foreground">{submission.score}/100</span>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-foreground">Internal context</h2>
              {latestNote ? <div className="mt-3 rounded-xl border border-border bg-background/70 p-3"><p className="text-sm leading-relaxed text-muted-foreground">{latestNote.body}</p><p className="mt-2 text-xs text-muted-foreground">{latestNote.author} · {latestNote.date}</p></div> : <p className="mt-3 text-sm text-muted-foreground">No internal note has been added.</p>}
              <div className="mt-3 grid gap-2">
                <Link href={`/messages/?thread=${submission.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><MessageSquareText className="size-4" /> Open message context</Link>
                <Link href={internalArtistHref(submission.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent/50"><CheckCircle2 className="size-4" /> View artist record</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
