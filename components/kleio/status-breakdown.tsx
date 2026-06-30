"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { analytics, statusBreakdown } from "@/lib/kleio-analytics"

export function StatusBreakdown() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Application Status Breakdown
      </h2>

      <div className="mt-4 grid grid-cols-1 items-center gap-4 2xl:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="relative mx-auto h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="count"
                nameKey="label"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-2xl font-semibold text-foreground">
              {analytics.totalApplications.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        <ul className="min-w-0 space-y-2">
          {statusBreakdown.map((entry) => (
            <li key={entry.label} className="flex min-w-0 items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-foreground">{entry.label}</span>
              <span className="w-12 text-right text-muted-foreground tabular-nums">
                {entry.pct}
              </span>
              <span className="w-10 text-right font-medium text-foreground tabular-nums">
                {entry.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
