"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { analytics, getReviewerProgress, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { artistProfileHref } from "@/lib/kleio-demo-auth"
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

export function CommitteePageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const [preparedReviewTeam, setPreparedReviewTeam] = useState<ReviewTeamMember[]>([])

  useEffect(() => { setPreparedReviewTeam(readReviewTeamDemoState()) }, [])
  const preparedReviewTeamStats = useMemo(() => calculateReviewTeamStats(preparedReviewTeam), [preparedReviewTeam])
  const pendingVoteSubmissions = allSubmissions.filter((submission) => submission.status === "Pending Vote")
  const reviewerProgress = getReviewerProgress()
  const sofiaScenario = pendingVoteSubmissions.find((submission) => submission.id === "sofia-karim")
  const previewCta = t("institution.workspace.committee.cta.previewCollaboratorSeat")

  return (
    <DemoPageShell title={t("institution.workspace.committee.title")} description={t("institution.workspace.committee.description")} actions={<div className="flex flex-wrap items-center gap-2"><Link href="/demo/roles/" className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">{es ? "Vista de roles" : "Roles preview"}</Link><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15">{previewCta}</Link></div>}>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl"><DemoStatRow label={t("institution.workspace.committee.metric.pendingVote")} value={analytics.pendingVoteCount} /><DemoStatRow label={t("institution.workspace.committee.metric.pendingActions")} value={analytics.pendingReviewerActionsCount} /><DemoStatRow label={t("institution.workspace.committee.metric.completion")} value={analytics.reviewerCompletionRate} /></div>

      <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-sm" data-kleio-guide-target="reviewer-seat-preview">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Ruta de acceso para revisores" : "Reviewer access path"}</p>
        <h2 className="mt-1 font-serif text-lg font-semibold text-foreground">{es ? "Invita revisores sin abrir todo el espacio institucional." : "Invite reviewers without opening the full workspace."}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{es ? "KLEIO debe permitir que las instituciones asignen revisores a programas y postulaciones específicas. La vista de asiento de revisor muestra una experiencia de acceso limitado: trabajo asignado, contexto de rúbrica, fechas y acciones de revisión." : "KLEIO should let institutions assign reviewers to specific programs and submissions. The reviewer seat preview shows the intended limited-access experience: assigned work, rubric context, deadlines, and review actions only."}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">{es ? "Ver asiento de revisor" : "Preview reviewer seat"}</Link><Link href="/demo/roles/" className="inline-flex h-9 items-center rounded-full border border-primary/20 bg-white px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/5">{es ? "Ver límites de rol" : "View role boundaries"}</Link></div>
      </section>

      <ReviewerInviteFlow />
      <section className="mb-4 rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.preparedReviewTeam")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("institution.workspace.committee.preparedReviewTeamNote")}</p></div><Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15">{previewCta}</Link></div><div className="grid grid-cols-2 gap-3 border-b border-border p-5 md:grid-cols-4"><DemoStatRow label={t("institution.workspace.committee.metric.collaborators")} value={preparedReviewTeamStats.totalCollaborators} /><DemoStatRow label={t("institution.workspace.committee.metric.preparedInvites")} value={preparedReviewTeamStats.preparedInvites} /><DemoStatRow label={t("institution.workspace.committee.metric.limitedSeats")} value={preparedReviewTeamStats.limitedReviewSeats} /><DemoStatRow label={t("institution.workspace.committee.metric.programsCovered")} value={preparedReviewTeamStats.assignedProgramCount} /></div><ul className="divide-y divide-border">{preparedReviewTeam.map((member) => <li key={member.id} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-foreground">{member.name}</p><p className="text-sm text-muted-foreground">{member.email}</p><p className="mt-1 text-xs text-muted-foreground">{formatReviewTeamRole(member.role, locale)} · {member.assignedProgramTitle} · {formatReviewAccessScope(member.accessScope, locale)}</p><p className="mt-1 text-[0.65rem] font-medium text-primary">{formatReviewInviteStatus(member.inviteStatus, locale)} · {t("institution.workspace.committee.limitedReviewSeat")}</p><div className="mt-2 flex flex-wrap gap-1.5">{member.permissions.map((permission) => <span key={permission} className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary">{formatReviewPermission(permission, locale)}</span>)}</div></div><span className="text-xs text-muted-foreground">{formatReviewInviteStatus(member.inviteStatus, locale)}</span></div></li>)}</ul></section>

      {sofiaScenario && <section className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("institution.workspace.committee.scenario.eyebrow")}</p><p className="mt-2 font-medium text-foreground"><Link href={artistProfileHref(sofiaScenario.artistId)} className="hover:text-primary transition-colors">{sofiaScenario.artist}</Link>{" — "}{sofiaScenario.projectTitle}</p><p className="mt-1 text-sm text-muted-foreground">{t("institution.workspace.committee.scenario.body")}</p><p className="mt-2 text-xs text-muted-foreground">{(() => { const progress = getSubmissionReviewerProgress(sofiaScenario.id); return t("institution.workspace.committee.reviewerProgress", { completed: progress.completed, total: progress.total, pending: progress.pending }) })()}</p></section>}

      <div className="grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.section.awaitingVote")}</h2></div><ul className="divide-y divide-border">{pendingVoteSubmissions.map((submission) => { const progress = getSubmissionReviewerProgress(submission.id); return <li key={submission.id} className="px-5 py-4"><Link href={artistProfileHref(submission.artistId)} className="font-medium text-foreground transition-colors hover:text-primary">{submission.artist}</Link><p className="text-sm text-muted-foreground">{submission.projectTitle}</p><p className="mt-2 text-xs text-muted-foreground">{t("institution.workspace.committee.reviewsCompleted", { completed: progress.completed, total: progress.total })}{progress.pending > 0 ? ` · ${t("institution.workspace.committee.reviewsPending", { pending: progress.pending })}` : ""}</p><ul className="mt-2 space-y-1">{progress.reviews.map((review) => <li key={review.reviewerId} className="flex justify-between text-xs"><span className="text-foreground">{review.reviewerName}</span><span className="text-muted-foreground">{reviewStatusLabel(review.status, es)}{review.recommendation ? ` · ${recommendationLabel(review.recommendation, es)}` : ""}</span></li>)}</ul></li> })}</ul></section>

        <section className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{t("institution.workspace.committee.section.reviewerProgress")}</h2><Link href="/collaborator-dashboard/" className="text-xs font-medium text-primary hover:text-primary/80">{previewCta}</Link></div><ul className="divide-y divide-border">{reviewerProgress.map((reviewer) => <li key={reviewer.reviewerId} className="flex items-center gap-3 px-5 py-4"><InitialAvatar name={reviewer.name} className="size-9 text-xs" /><div className="min-w-0 flex-1"><p className="font-medium text-foreground">{reviewer.name}</p><p className="text-xs text-muted-foreground">{roleLabel(reviewer.role, es)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(reviewer.rate * 100)}%` }} /></div></div><div className="text-right"><span className="text-sm font-medium text-foreground tabular-nums">{reviewer.completed}/{reviewer.assigned}</span>{reviewer.reviewerId === "celeste-rowan" && <Link href="/collaborator-dashboard/" className="mt-1 block text-[0.65rem] font-medium text-primary hover:text-primary/80">{t("institution.workspace.committee.cta.previewReviewerSeat")}</Link>}</div></li>)}</ul></section></div>

      <p className="mt-4 text-xs text-muted-foreground">{analytics.pendingReviewerActionsCount === 1 ? t("institution.workspace.committee.footer.assignmentsOne", { count: analytics.pendingReviewerActionsCount }) : t("institution.workspace.committee.footer.assignmentsOther", { count: analytics.pendingReviewerActionsCount })}{" "}<Link href="/messages/" className="font-medium text-primary hover:text-primary/80">{t("institution.workspace.committee.cta.messagePendingReviewers")}</Link></p>
    </DemoPageShell>
  )
}
