"use client"

import { useState } from "react"
import Link from "next/link"
import { analytics, getLatestSubmissionNote, getShortlistGroups, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { internalArtistHref, programHref, submissionHref } from "@/lib/kleio-entity-routes"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { StatusPill } from "@/components/kleio/pills"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function groupLabel(label: string, es: boolean) {
  if (!es) return label
  const labels: Record<string, string> = {
    Shortlisted: "Lista corta",
    Finalists: "Finalistas",
    "Pending Vote": "Voto pendiente",
    Interview: "Entrevista",
    Selected: "Seleccionados",
  }
  return labels[label] ?? label
}

export function ShortlistPageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const [exportConfirmation, setExportConfirmation] = useState<string | null>(null)
  const groups = getShortlistGroups()
  const selectedCount = groups.reduce((sum, group) => sum + group.submissions.length, 0)

  return (
    <DemoPageShell title={t("institution.shortlist.title")} description={t("institution.shortlist.description")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl">
          <DemoStatRow label={t("institution.shortlist.stat.shortlisted")} value={analytics.shortlistedCount} href="/shortlist/" />
          <DemoStatRow label={t("institution.shortlist.stat.pendingVote")} value={analytics.pendingVoteCount} href="/committee/" />
          <DemoStatRow label={t("institution.shortlist.stat.finalist")} value={groups[1].submissions.length} href="/review-room/" />
        </div>
        <button type="button" onClick={() => setExportConfirmation(t(selectedCount === 1 ? "institution.shortlist.exportConfirmation" : "institution.shortlist.exportConfirmationOther", { count: String(selectedCount) }))} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          {t("institution.shortlist.cta.export")}
        </button>
      </div>

      {exportConfirmation && <p className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">{exportConfirmation}</p>}

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id} className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">{groupLabel(group.label, es)}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">{group.submissions.length}</span>
            </div>
            {group.submissions.length ? (
              <ul className="divide-y divide-border">
                {group.submissions.map((submission) => {
                  const note = getLatestSubmissionNote(submission.id)
                  const progress = getSubmissionReviewerProgress(submission.id)
                  return (
                    <li key={submission.id} id={`submission-${submission.id}`} className="px-5 py-4 transition-colors hover:bg-accent/30">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link href={internalArtistHref(submission.artistId)} className="font-medium text-foreground hover:text-primary">{submission.artist}</Link>
                          <p className="text-sm text-muted-foreground"><Link href={submissionHref(submission.id)} className="transition-colors hover:text-primary">{submission.projectTitle}</Link> · <Link href={programHref(submission.programId)} className="transition-colors hover:text-primary">{submission.program}</Link></p>
                        </div>
                        <Link href={submissionHref(submission.id)} aria-label={es ? `Abrir expediente de ${submission.artist}` : `Open ${submission.artist}'s submission record`}><StatusPill status={submission.status} /></Link>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <Link href="/committee/" className="transition-colors hover:text-primary">{es ? "Voto del comité" : "Committee vote"}: {progress.completed}/{progress.total} {es ? "revisiones" : "reviews"}</Link>
                        <Link href={submissionHref(submission.id)} className="transition-colors hover:text-primary">{es ? "Completitud" : "Completeness"}: {submission.completeness}%</Link>
                      </div>
                      {note && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium"><Link href={submissionHref(submission.id)} className="text-primary hover:text-primary/80">{es ? "Abrir expediente →" : "Open record →"}</Link><Link href={internalArtistHref(submission.artistId)} className="text-muted-foreground hover:text-primary">{es ? "Perfil del artista" : "Artist profile"}</Link></div>
                    </li>
                  )
                })}
              </ul>
            ) : <p className="px-5 py-4 text-sm text-muted-foreground">{es ? "No hay candidatos en esta etapa." : "No candidates in this stage."}</p>}
          </section>
        ))}
      </div>
    </DemoPageShell>
  )
}
