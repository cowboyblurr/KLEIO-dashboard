export const publicRoutes = [
  "/",
  "/about/",
  "/manifesto/",
  "/journal/",
  "/signup/",
  "/signup/artist/",
  "/signup/institution/",
  "/auth/forgot-password/",
  "/auth/update-password/",
  "/landing/",
] as const

export const artistWorkspaceRoutes = [
  "/artist-dashboard/",
  "/artist-dashboard/passport/",
  "/artist-dashboard/portfolio/",
  "/artist-dashboard/opportunities/",
  "/artist-dashboard/applications/",
  "/artist-dashboard/collaborators/",
  "/artist-dashboard/calendar/",
  "/artist-dashboard/messages/",
  "/artist-dashboard/funding/",
  "/artist-dashboard/insights/",
  "/artist-dashboard/settings/",
] as const

export const institutionWorkspaceRoutes = [
  "/dashboard/",
  "/programs/",
  "/programs/new/",
  "/submissions/",
  "/artists/",
  "/review-queue/",
  "/review-room/",
  "/shortlist/",
  "/committee/",
  "/messages/",
  "/reports/",
  "/reports/new/",
  "/activity-log/",
  "/templates/",
  "/templates/new/",
  "/settings/",
] as const

export const collaboratorWorkspaceRoutes = [
  "/collaborator-dashboard/",
  "/collaborator-dashboard/assignments/",
  "/collaborator-dashboard/review-queue/",
  "/collaborator-dashboard/guidelines/",
  "/collaborator-dashboard/messages/",
  "/collaborator-dashboard/submitted/",
] as const

export const publicProfileRoutePatterns = [
  "/artist/[username]/",
  "/institution/[username]/",
] as const

/** Additional public or generated routes outside the primary workspace navigation. */
export const supplementalPublicRoutes = [
  "/artists/[artistId]/",
  "/submissions/[submissionId]/",
  "/programs/[programId]/",
  "/artist-dashboard/opportunities/[opportunityId]/",
] as const

export const allStaticWorkspaceRoutes = [
  ...publicRoutes,
  ...artistWorkspaceRoutes,
  ...institutionWorkspaceRoutes,
  ...collaboratorWorkspaceRoutes,
] as const

/** Backwards-compatible alias used by existing demo tooling. */
export const allDemoRoutes = allStaticWorkspaceRoutes
