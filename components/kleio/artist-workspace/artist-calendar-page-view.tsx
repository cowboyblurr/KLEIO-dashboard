import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const deadlines = [
  { title: "Lumen Arts Grant", date: "May 28, 2025", type: "Application", urgency: "This week" },
  { title: "Global Perspectives Residency", date: "May 30, 2025", type: "Interview", urgency: "This week" },
  { title: "Caribbean Futures Fund", date: "Jun 2, 2025", type: "Decision window", urgency: "Upcoming" },
  { title: "Citywide Artist Award", date: "Jun 6, 2025", type: "Final draft", urgency: "Upcoming" },
]

const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = i + 1
  const hasEvent = [28, 30, 2, 6].includes(day % 32 || day)
  return { day: day <= 31 ? day : day - 31, hasEvent }
})

export function ArtistCalendarPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Deadline calendar"
          title="Calendar"
          description="View upcoming deadlines, application milestones, follow-ups, and decision windows."
          primaryCta={{ label: "View Applications", href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: "Explore Opportunities", href: "/artist-dashboard/opportunities/" }}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <WorkflowCard title="Month view" body="Foundation calendar grid for deadline planning.">
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 font-medium" style={{ color: mutedColor }}>{d}</div>
              ))}
              {calendarDays.map((cell, i) => (
                <div
                  key={i}
                  className={`rounded-lg py-2 ${cell.hasEvent ? "bg-[#F1ECFB] font-semibold" : ""}`}
                  style={{ color: cell.hasEvent ? "#5B4B8A" : inkColor }}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          </WorkflowCard>

          <div className="space-y-4">
            <WorkflowCard title="Upcoming deadlines">
              <ul className="space-y-3">
                {deadlines.map((item) => (
                  <li key={item.title} className="rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: inkColor }}>{item.title}</p>
                        <p className="text-xs" style={{ color: mutedColor }}>{item.date} · {item.type}</p>
                      </div>
                      <DemoStatusChip label={item.urgency} tone={item.urgency === "This week" ? "warning" : "info"} />
                    </div>
                  </li>
                ))}
              </ul>
            </WorkflowCard>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Decision windows" body="Two programs enter decision review in early June. Responses may arrive without additional action required." />
          <WorkflowCard title="Follow-up reminders" body="Harbor Foundation Grant is waiting on a follow-up note from the institution contact.">
            <Link href="/artist-dashboard/messages/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Open messages →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
