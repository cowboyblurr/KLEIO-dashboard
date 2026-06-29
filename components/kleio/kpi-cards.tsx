import {
  ArrowUpRight,
  Bookmark,
  CalendarClock,
  ClipboardList,
  Eye,
  FileWarning,
  Users,
  type LucideIcon,
} from "lucide-react"
import { kpis } from "@/lib/kleio-data"

const iconMap: Record<string, LucideIcon> = {
  clipboard: ClipboardList,
  eye: Eye,
  bookmark: Bookmark,
  users: Users,
  calendar: CalendarClock,
  file: FileWarning,
}

export function KpiCards() {
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
    >
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon] ?? ClipboardList
        return (
          <div
            key={kpi.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground">
              {kpi.value}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              {kpi.trend === "up" && (
                <ArrowUpRight className="size-3.5 text-[oklch(0.5_0.13_150)]" />
              )}
              <span
                className={
                  kpi.trend === "up"
                    ? "font-medium text-[oklch(0.45_0.13_150)]"
                    : ""
                }
              >
                {kpi.delta}
              </span>
            </p>
          </div>
        )
      })}
    </section>
  )
}
