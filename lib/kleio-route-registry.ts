export const publicRoutes = [
  "/",
  "/about/",
  "/manifesto/",
  "/journal/",
  "/signup/artist/",
  "/signup/institution/",
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

/** Additional public routes outside workspace nav (still part of demo surface). */
export const supplementalPublicRoutes = [
  "/signup/",
  "/landing/",
  "/artists/",
  "/artists/[artistId]/",
] as const

export const allDemoRoutes = [
  ...publicRoutes,
  ...artistWorkspaceRoutes,
  ...institutionWorkspaceRoutes,
  ...collaboratorWorkspaceRoutes,
] as const
