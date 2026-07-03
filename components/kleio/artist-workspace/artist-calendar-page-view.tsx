"use client"

import Link from "next/link"
import {
  artistAnalytics,
  formatArtistDeadlineUrgency,
  formatArtistNextDeadline,
  formatDemoDateDisplay,
  getArtistDeadlineEntries,
} from "@/lib/kleio-artist-analytics"
import { translateStatus } from "@/lib/kleio-i18n"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ArtistCalendarPageView() {
  const { locale, t } = useKleioLocale()
  const analytics = artistAnalytics
  const deadlines = getArtistDeadlineEntries()

  const weekdayKeys = [
    "artist.workspace.calendar.weekday.sun",
    "artist.workspace.calendar.weekday.mon",
    "artist.workspace.calendar.weekday.tue",
    "artist.workspace.calendar.weekday.wed",
    "artist.workspace.calendar.weekday.thu",
    "artist.workspace.calendar.weekday.fri",
    "artist.workspace.calendar.weekday.sat",
  ] as const

  const eventDays = new Set(
    deadlines
      .map((entry) => {
        const formatted = formatDemoDateDisplay(entry.dateIso, locale)
        const match = formatted.match(/\b(\d{1,2})\b/)
        return match ? Number(match[1]) : null
      })
      .filter((day): day is number => day != null),
  )

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i + 1
    return { day: day <= 31 ? day : day - 31, hasEvent: eventDays.has(day <= 31 ? day : day - 31) }
  })

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.calendar.eyebrow")}
          title={t("artist.workspace.calendar.title")}
          description={t("artist.workspace.calendar.description")}
          primaryCta={{ label: t("artist.workspace.calendar.cta.viewApplications"), href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: t("artist.workspace.calendar.cta.exploreOpportunities"), href: "/artist-dashboard/opportunities/" }}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label={t("artist.workspace.calendar.metric.upcomingDeadlines")} value={analytics.upcomingDeadlines} />
          <WorkspaceMetricCard
            label={t("artist.workspace.calendar.metric.dueSoon")}
            value={analytics.dueSoon}
            helper={t("artist.workspace.calendar.metric.dueSoonHelper")}
          />
          <WorkspaceMetricCard label={t("artist.workspace.calendar.metric.overdueSignals")} value={analytics.overdueDecisions} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <WorkflowCard
            title={t("artist.workspace.calendar.monthView")}
            body={t("artist.workspace.calendar.nextDeadline", {
              date: formatArtistNextDeadline(analytics.nextDeadline, locale),
            })}
          >
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekdayKeys.map((key) => (
                <div key={key} className="py-2 font-medium" style={{ color: mutedColor }}>
                  {t(key)}
                </div>
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
            <WorkflowCard title={t("artist.workspace.calendar.upcomingDeadlines")}>
              <ul className="space-y-3">
                {deadlines.map((item) => (
                  <li key={item.title} className="rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: inkColor }}>{item.title}</p>
                        <p className="text-xs" style={{ color: mutedColor }}>
                          {formatDemoDateDisplay(item.dateIso, locale)} · {translateStatus(locale, item.type)}
                        </p>
                      </div>
                      <DemoStatusChip
                        label={formatArtistDeadlineUrgency(item.urgency, locale)}
                        tone={item.urgency === "thisWeek" ? "warning" : "info"}
                        translate={false}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </WorkflowCard>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard
            title={t("artist.workspace.calendar.decisionWindows.title")}
            body={t("artist.workspace.calendar.decisionWindows.body", { count: analytics.pendingDecisions })}
          />
          <WorkflowCard
            title={t("artist.workspace.calendar.followUpReminders.title")}
            body={
              analytics.overdueDecisions === 1
                ? t("artist.workspace.calendar.followUpReminders.body", { count: analytics.overdueDecisions })
                : t("artist.workspace.calendar.followUpReminders.bodyPlural", { count: analytics.overdueDecisions })
            }
          >
            <Link href="/artist-dashboard/messages/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              {t("artist.workspace.calendar.openMessages")}
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
