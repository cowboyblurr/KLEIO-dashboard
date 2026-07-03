import Link from "next/link"
import { artistAnalytics, getArtistDeadlineEntries } from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

export function ArtistCalendarPageView() {
  const analytics = artistAnalytics
  const deadlines = getArtistDeadlineEntries()

  const eventDays = new Set(
    deadlines.map((entry) => {
      const match = entry.date.match(/\b(\d{1,2})\b/)
      return match ? Number(match[1]) : null
    }).filter((day): day is number => day != null),
  )

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i + 1
    return { day: day <= 31 ? day : day - 31, hasEvent: eventDays.has(day <= 31 ? day : day - 31) }
  })

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

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label="Upcoming deadlines" value={analytics.upcomingDeadlines} />
          <WorkspaceMetricCard label="Due soon" value={analytics.dueSoon} helper="Within 14 days" />
          <WorkspaceMetricCard label="Overdue signals" value={analytics.overdueDecisions} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <WorkflowCard title="Month view" body={`Next deadline: ${analytics.nextDeadline}`}>
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
          <WorkflowCard title="Decision windows" body={`${analytics.pendingDecisions} applications are currently awaiting institutional decisions.`} />
          <WorkflowCard title="Follow-up reminders" body={`${analytics.overdueDecisions} overdue signal${analytics.overdueDecisions === 1 ? "" : "s"} need follow-up attention.`}>
            <Link href="/artist-dashboard/messages/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Open messages →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
