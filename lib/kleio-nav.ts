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
    items: [{ label: "Overview", href: "/", icon: LayoutGrid }],
  },
  {
    heading: "Manage",
    items: [
      { label: "Programs", href: "/programs", icon: FolderOpen },
      { label: "Submissions", href: "/submissions", icon: FileStack },
      { label: "Artists", href: "/artists", icon: Users },
      { label: "Review Queue", href: "/review-queue", icon: ListChecks, badge: 23 },
      { label: "Shortlist", href: "/shortlist", icon: Bookmark, badge: 128 },
    ],
  },
  {
    heading: "Collaborate",
    items: [
      { label: "Committee", href: "/committee", icon: Vote },
      { label: "Messages", href: "/messages", icon: MessageSquare, badge: 8 },
    ],
  },
  {
    heading: "Analyze",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Activity Log", href: "/activity-log", icon: History },
    ],
  },
  {
    heading: "Configure",
    items: [
      { label: "Templates", href: "/templates", icon: LayoutTemplate },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]
