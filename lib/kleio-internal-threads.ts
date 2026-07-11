import type { KleioDemoSession } from "@/lib/kleio-demo-auth"
import {
  programHref,
  reviewerAnchorHref,
  submissionHref,
} from "@/lib/kleio-entity-routes"

export type InternalThreadRole = "institution" | "collaborator"
export type InternalThreadScope = "program" | "submission" | "committee" | "reviewer" | "report"

export type InternalThreadMessage = {
  id: string
  author: string
  role: string
  body: string
  date: string
}

export type InternalThread = {
  id: string
  title: string
  scope: InternalThreadScope
  label: string
  relatedRecordLabel: string
  relatedRecordHref: string
  surfaceHrefs: string[]
  allowedRoles: InternalThreadRole[]
  reviewerIds?: string[]
  unreadCount: number
  lastUpdated: string
  messages: InternalThreadMessage[]
}

export const internalThreads: InternalThread[] = [
  {
    id: "committee-residency-cycle",
    title: "Residency committee alignment",
    scope: "committee",
    label: "Committee",
    relatedRecordLabel: "KLEIO Arthouse Residency 2026",
    relatedRecordHref: programHref("residency-2026"),
    surfaceHrefs: ["/dashboard/", "/committee/", "/review-room/", "/programs/residency-2026/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan", "theo-malik", "lina-park"],
    unreadCount: 2,
    lastUpdated: "Today · 9:42 AM",
    messages: [
      {
        id: "committee-residency-cycle-1",
        author: "Mara Voss",
        role: "Program Lead",
        body: "Please keep the shortlist discussion attached to the residency record. We need the final report to show why each candidate advanced.",
        date: "Today · 9:12 AM",
      },
      {
        id: "committee-residency-cycle-2",
        author: "Celeste Rowan",
        role: "Committee Reviewer",
        body: "Amina has the strongest alignment so far. I want Sofia held for one more vote before the final movement.",
        date: "Today · 9:42 AM",
      },
    ],
  },
  {
    id: "submission-amina-shortlist",
    title: "Amina shortlist decision",
    scope: "submission",
    label: "Applicant record",
    relatedRecordLabel: "Amina El Badri · Echoes of Memory",
    relatedRecordHref: submissionHref("amina-el-badri"),
    surfaceHrefs: ["/review-queue/", "/review-room/", "/shortlist/", "/submissions/amina-el-badri/", "/artists/amina-el-badri/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan", "theo-malik"],
    unreadCount: 1,
    lastUpdated: "Today · 10:04 AM",
    messages: [
      {
        id: "submission-amina-shortlist-1",
        author: "Theo Malik",
        role: "Reviewer",
        body: "Review complete. I recommend moving this application into final shortlist with the material sensitivity note preserved.",
        date: "Today · 9:58 AM",
      },
      {
        id: "submission-amina-shortlist-2",
        author: "Mara Voss",
        role: "Program Lead",
        body: "Agreed. Keep this thread linked to the submission so the report can reference the actual review rationale.",
        date: "Today · 10:04 AM",
      },
    ],
  },
  {
    id: "submission-mei-materials",
    title: "Mei missing-material cleanup",
    scope: "submission",
    label: "Materials",
    relatedRecordLabel: "Mei Lin Zhang · Trace",
    relatedRecordHref: submissionHref("mei-lin-zhang"),
    surfaceHrefs: ["/review-queue/", "/messages/", "/submissions/mei-lin-zhang/", "/artists/mei-lin-zhang/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["lina-park"],
    unreadCount: 0,
    lastUpdated: "Yesterday · 4:31 PM",
    messages: [
      {
        id: "submission-mei-materials-1",
        author: "Lina Park",
        role: "Reviewer",
        body: "The application should not move forward until the updated CV and dimensions are attached. The work is promising but the file is not review-ready yet.",
        date: "Yesterday · 4:31 PM",
      },
    ],
  },
  {
    id: "submission-sofia-pending-vote",
    title: "Sofia pending committee vote",
    scope: "committee",
    label: "Vote",
    relatedRecordLabel: "Sofia Karim · The Distance Between Light",
    relatedRecordHref: submissionHref("sofia-karim"),
    surfaceHrefs: ["/committee/", "/review-room/", "/shortlist/", "/submissions/sofia-karim/", reviewerAnchorHref("celeste-rowan")],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan"],
    unreadCount: 1,
    lastUpdated: "Today · 11:18 AM",
    messages: [
      {
        id: "submission-sofia-pending-vote-1",
        author: "Mara Voss",
        role: "Program Lead",
        body: "Celeste, can you add your final vote here before we move Sofia out of pending committee status?",
        date: "Today · 11:05 AM",
      },
      {
        id: "submission-sofia-pending-vote-2",
        author: "Celeste Rowan",
        role: "Committee Reviewer",
        body: "I am leaning hold, not decline. The research is strong, but the committee needs one more clarity note before final shortlist.",
        date: "Today · 11:18 AM",
      },
    ],
  },
  {
    id: "report-residency-memory",
    title: "Report language and decision memory",
    scope: "report",
    label: "Report",
    relatedRecordLabel: "Residency review report",
    relatedRecordHref: "/reports/",
    surfaceHrefs: ["/reports/", "/activity-log/", "/review-room/"],
    allowedRoles: ["institution"],
    unreadCount: 0,
    lastUpdated: "Today · 12:02 PM",
    messages: [
      {
        id: "report-residency-memory-1",
        author: "Mara Voss",
        role: "Program Lead",
        body: "When the report is prepared, keep the committee rationale clear and avoid presenting demo activity as a real institutional outcome.",
        date: "Today · 12:02 PM",
      },
    ],
  },
]

export function canAccessInternalThread(thread: InternalThread, session: KleioDemoSession | null) {
  if (!session || session.role === "artist") return false
  if (session.role === "institution") return thread.allowedRoles.includes("institution")
  if (!thread.allowedRoles.includes("collaborator")) return false
  if (!thread.reviewerIds?.length) return true
  return Boolean(session.collaboratorId && thread.reviewerIds.includes(session.collaboratorId))
}

export function getVisibleInternalThreads(session: KleioDemoSession | null) {
  return internalThreads.filter((thread) => canAccessInternalThread(thread, session))
}

export function getInternalThreadAccessLabel(session: KleioDemoSession | null) {
  if (!session) return "No active workspace session"
  if (session.role === "institution") return "Institution team access"
  if (session.role === "collaborator") return "Scoped reviewer access"
  return "Artist workspace excluded"
}
