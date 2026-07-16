import {
  LayoutGrid,
  FolderOpen,
  FileStack,
  Users,
  ListChecks,
  Bookmark,
  Vote,
  MessageSquare,
  BarChart3,
  History,
  LayoutTemplate,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { analytics } from "@/lib/kleio-analytics"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export type NavSection = {
  heading: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    heading: "Overview",
    // Institution workspace entry — not the public homepage (`/`).
    items: [{ label: "Overview", href: "/dashboard/", icon: LayoutGrid }],
  },
  {
    heading: "Core Review Flow",
    items: [
      { label: "Programs", href: "/programs/connected/", icon: FolderOpen },
      { label: "Submissions", href: "/applications/connected/", icon: FileStack },
      { label: "Artist Records", href: "/artists/", icon: Users },
      { label: "Review Queue", href: "/review-queue/", icon: ListChecks, badge: analytics.reviewQueueCount },
      { label: "Review Room", href: "/review-room/", icon: Vote, badge: analytics.pendingVoteCount },
      { label: "Shortlist", href: "/shortlist/", icon: Bookmark, badge: analytics.shortlistedCount },
    ],
  },
  {
    heading: "Collaborate",
    items: [
      { label: "Committee", href: "/committee/", icon: Vote, badge: analytics.pendingReviewerActionsCount },
      { label: "Messages", href: "/messages/", icon: MessageSquare, badge: analytics.messageBadgeCount },
    ],
  },
  {
    heading: "Report",
    items: [{ label: "Reports", href: "/reports/", icon: BarChart3 }],
  },
  {
    heading: "Admin / More",
    items: [
      { label: "Activity Log", href: "/activity-log/", icon: History },
      { label: "Templates", href: "/templates/", icon: LayoutTemplate },
      { label: "Settings", href: "/settings/connected/", icon: Settings },
    ],
  },
]
