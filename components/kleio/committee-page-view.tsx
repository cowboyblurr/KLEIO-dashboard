"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { analytics, getReviewerProgress, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { internalArtistHref, reviewerAnchorHref, submissionHref } from "@/lib/kleio-entity-routes"
import { calculateReviewTeamStats, formatReviewAccessScope, formatReviewInviteStatus, formatReviewPermission, formatReviewTeamRole, readReviewTeamDemoState, type ReviewTeamMember } from "@/lib/kleio-review-team"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { ReviewerInviteFlow } from "@/components/kleio/reviewer-invite-flow"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function roleLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = { Reviewer: "Revisor", "Guest Juror": "Jurado invitado", "Committee Member": "Miembro del comité", Curator: "Curador", "Grant Administrator": "Administrador de becas", Viewer: "Observador" }
  return labels[value] ?? value
}

function reviewStatusLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = { Completed: "Completado", "In Progress": "En revisión", Pending: "Pendiente", "Not Started": "Sin iniciar", Submitted: "Entregado", Draft: "Borrador" }
  return labels[value] ?? value
}

function recommendationLabel(value: string | undefined, es: boolean) {
  if (!value) return ""
  if (!es) return value
  const labels: Record<string, string> = { Advance: "Avanzar", Shortlist: "Lista corta", Hold: "Mantener", Decline: "Rechazar" }
  return labels[value] ?? value
}

function openInstitutionMessenger() {
  window.dispatchEvent(new CustomEvent("kleio:open-institution-messenger"))
  const launcher = document.querySelector<HTMLButtonElement>(
    '[aria-label="Open institution messenger"], [aria-label="Abrir mensajería institucional"], [aria-label="Open demo internal threads"], [aria-label="Abrir hilos internos demo"]',
  )
  launcher?.click()
}

export function CommitteePageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const [preparedReviewTeam, setPreparedReviewTeam] = useState<ReviewTeamMember[]>([])

  useEffect(() => { setPreparedReviewTeam(readReviewTeamDemoState()) }, [])
  const preparedReviewTeamStats = useMemo(() => calculateReviewTeamStats(preparedReviewTeam), [preparedReviewTeam])
  const pendingVoteSubmissions = allSubmissions.filter((submission) => submission.status === "Pending Vote")
  const reviewerProgress = getReviewerProgress()
  const sofiaScenario = pendingVoteSubmissions.find((submission) => submission.id === "sofia-karim")
  const reviewerSeatCta = es ? "Abrir asiento de revisor" : "Open reviewer seat"

  return (
    <DemoPageShell title={t("institution.workspace.committee.title")} description={es ? "Gestiona revisores, asientos limitados, votos pendientes y seguimiento del comité en un solo espacio de coordinación." : "Manage reviewers, limited review seats, pending votes, and committee follow-up from one coordination workspace."} actions={<div className="flex flex-wrap items-center gap-2"><Link href="/demo/roles/" className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">{es ? "Límites de rol" : "Role boundaries"}</Link><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15">{reviewerSeatCta}</Link></div>}>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl"><DemoStatRow label={t("institution.workspace.committee.metric.pendingVote")} value={analytics.pendingVoteCount} href="/shortlist/" /><DemoStatRow label={t("institution.workspace.committee.metric.pendingActions")} value={analytics.pendingReviewerActionsCount} href="#reviewer-progress" /><DemoStatRow label={t("institution.workspace.committee.metric.completion")} value={analytics.reviewerCompletionRate} href="#reviewer-progress" /></div>

      <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-sm" data-kleio-guide-target="reviewer-seat-preview">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Acceso de revisores" : "Reviewer access"}</p>
        <h2 className="mt-1 font-serif text-lg font-semibold text-foreground">{es ? "Asigna revisores sin abrir todo el espacio institucional." : "Assign reviewers without opening the full institution workspace."}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{es ? "Cada asiento de revisor puede limitarse a programas, postulaciones, rúbricas, fechas y acciones específicas. El equipo mantiene control sobre qué contexto ve cada colaborador." : "Each reviewer seat can be limited to specific programs, submissions, rubrics, deadlines, and review actions. The institution controls which context each collaborator can access."}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">{reviewerSeatCta}</Link><Link href="/demo/roles/" className="inline-flex h-9 items-center rounded-full border border-primary/20 bg-white px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/5">{es ? "Ver límites de rol" : "View role boundaries"}</Link></div>
      </section>

      <ReviewerInviteFlow />
      <section className="mb-4 rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.preparedReviewTeam")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("institution.workspace.committee.preparedReviewTeamNote")}</p></div><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15">{reviewerSeatCta}</Link></div><div className="grid grid-cols-2 gap-3 border-b border-border p-5 md:grid-cols-4"><DemoStatRow label={t("institution.workspace.committee.metric.collaborators")} value={preparedReviewTeamStats.totalCollaborators} href="#prepared-review-team" /><DemoStatRow label={t("institution.workspace.committee.metric.preparedInvites")} value={preparedReviewTeamStats.preparedInvites} href="#prepared-review-team" /><DemoStatRow label={t("institution.workspace.committee.metric.limitedSeats")} value={preparedReviewTeamStats.limitedReviewSeats} href="#prepared-review-team" /><DemoStatRow label={t("institution.workspace.committee.metric.programsCovered")} value={preparedReviewTeamStats.assignedProgramCount} href="/programs/" /></div><ul id="prepared-review-team" className="divide-y divide-border">{preparedReviewTeam.map((member) => <li id={`reviewer-${member.id}`} key={member.id} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/collaborator-dashboard/" className="font-medium text-foreground transition-colors hover:text-primary">{member.name}</Link><p className="text-sm text-muted-foreground">{member.email}</p><p className="mt-1 text-xs text-muted-foreground">{formatReviewTeamRole(member.role, locale)} · {member.assignedProgramTitle} · {formatReviewAccessScope(member.accessScope, locale)}</p><p className="mt-1 text-[0.65rem] font-medium text-primary">{formatReviewInviteStatus(member.inviteStatus, locale)} · {t("institution.workspace.committee.limitedReviewSeat")}</p><div className="mt-2 flex flex-wrap gap-1.5">{member.permissions.map((permission) => <Link key={permission} href="/demo/roles/" className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary transition-colors hover:bg-primary/15">{formatReviewPermission(permission, locale)}</Link>)}</div></div><Link href="/collaborator-dashboard/" className="text-xs text-muted-foreground transition-colors hover:text-primary">{formatReviewInviteStatus(member.inviteStatus, locale)}</Link></div></li>)}</ul></section>

      {sofiaScenario && <section className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Pendiente de comité" : "Committee follow-up"}</p><p className="mt-2 font-medium text-foreground"><Link href={internalArtistHref(sofiaScenario.artistId)} className="hover:text-primary transition-colors">{sofiaScenario.artist}</Link>{" — "}<Link href={submissionHref(sofiaScenario.id)} className="hover:text-primary transition-colors">{sofiaScenario.projectTitle}</Link></p><p className="mt-1 text-sm text-muted-foreground">{es ? "Dos revisiones están completas. Todavía falta un voto del comité antes de avanzar esta candidatura." : "Two reviews are complete. One committee vote is still pending before this finalist can advance."}</p><p className="mt-2 text-xs text-muted-foreground">{(() => { const progress = getSubmissionReviewerProgress(sofiaScenario.id); return t("institution.workspace.committee.reviewerProgress", { completed: progress.completed, total: progress.total, pending: progress.pending }) })()} · <Link href={submissionHref(sofiaScenario.id)} className="font-medium text-primary hover:text-primary/80">{es ? "Abrir expediente" : "Open record"}</Link></p></section>}

      <div className="grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.section.awaitingVote")}</h2></div><ul className="divide-y divide-border">{pendingVoteSubmissions.map((submission) => { const progress = getSubmissionReviewerProgress(submission.id); return <li id={`submission-${submission.id}`} key={submission.id} className="px-5 py-4 transition-colors hover:bg-accent/30"><Link href={internalArtistHref(submission.artistId)} className="font-medium text-foreground transition-colors hover:text-primary">{submission.artist}</Link><p className="text-sm text-muted-foreground"><Link href={submissionHref(submission.id)} className="transition-colors hover:text-primary">{submission.projectTitle}</Link></p><p className="mt-2 text-xs text-muted-foreground"><Link href={submissionHref(submission.id)} className="transition-colors hover:text-primary">{t("institution.workspace.committee.reviewsCompleted", { completed: progress.completed, total: progress.total })}</Link>{progress.pending > 0 ? ` · ${t("institution.workspace.committee.reviewsPending", { pending: progress.pending })}` : ""}</p><ul className="mt-2 space-y-1">{progress.reviews.map((review) => <li key={review.reviewerId} className="flex justify-between gap-3 text-xs"><Link href={reviewerAnchorHref(review.reviewerId)} className="text-foreground transition-colors hover:text-primary">{review.reviewerName}</Link><span className="text-muted-foreground">{reviewStatusLabel(review.status, es)}{review.recommendation ? ` · ${recommendationLabel(review.recommendation, es)}` : ""}</span></li>)}</ul></li> })}</ul></section>

        <section id="reviewer-progress" className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.section.reviewerProgress")}</h2><Link href="/collaborator-dashboard/" className="text-xs font-medium text-primary hover:text-primary/80">{reviewerSeatCta}</Link></div><ul className="divide-y divide-border">{reviewerProgress.map((reviewer) => <li id={`reviewer-${reviewer.reviewerId}`} key={reviewer.reviewerId} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/30"><Link href="/collaborator-dashboard/"><InitialAvatar name={reviewer.name} className="size-9 text-xs transition-opacity hover:opacity-80" /></Link><div className="min-w-0 flex-1"><Link href="/collaborator-dashboard/" className="font-medium text-foreground transition-colors hover:text-primary">{reviewer.name}</Link><p className="text-xs text-muted-foreground">{roleLabel(reviewer.role, es)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(reviewer.rate * 100)}%` }} /></div></div><div className="text-right"><Link href={reviewerAnchorHref(reviewer.reviewerId)} className="text-sm font-medium text-foreground tabular-nums transition-colors hover:text-primary">{reviewer.completed}/{reviewer.assigned}</Link>{reviewer.reviewerId === "celeste-rowan" && <Link href="/collaborator-dashboard/" className="mt-1 block text-[0.65rem] font-medium text-primary hover:text-primary/80">{reviewerSeatCta}</Link>}</div></li>)}</ul></section></div>

      <p className="mt-4 text-xs text-muted-foreground">{analytics.pendingReviewerActionsCount === 1 ? t("institution.workspace.committee.footer.assignmentsOne", { count: analytics.pendingReviewerActionsCount }) : t("institution.workspace.committee.footer.assignmentsOther", { count: analytics.pendingReviewerActionsCount })}{" "}<button type="button" onClick={openInstitutionMessenger} className="font-medium text-primary hover:text-primary/80">{t("institution.workspace.committee.cta.messagePendingReviewers")}</button></p>
    </DemoPageShell>
  )
}
