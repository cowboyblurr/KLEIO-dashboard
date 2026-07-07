export type KleioPageGuide = {
  title: string
  role: "artist" | "institution" | "collaborator"
  description: string
  benefit: string
  realWorld: string
}

const guides: Record<string, KleioPageGuide> = {
  "/dashboard/": {
    title: "Overview",
    role: "institution",
    description: "This page gives the institution a shared view of the current cycle.",
    benefit: "It helps the team see status, deadlines, materials, and progress before opening individual records.",
    realWorld: "Use it like the first page of a meeting: where are we and what needs attention?",
  },
  "/artist-dashboard/": {
    title: "Overview",
    role: "artist",
    description: "This page gives the artist a quick read on readiness, applications, opportunities, and deadlines.",
    benefit: "It helps the artist understand what needs attention without digging through folders, portals, and notes.",
    realWorld: "For an artist balancing studio work and admin, this is the daily command center.",
  },
}

export function getKleioPageGuide(pathname: string | null | undefined): KleioPageGuide | undefined {
  if (!pathname) return undefined
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`
  return guides[normalized]
}
