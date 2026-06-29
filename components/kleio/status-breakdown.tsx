"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { statusBreakdown } from "@/lib/kleio-data"

export function StatusBreakdown() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Application Status Breakdown
      </h2>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="count"
                nameKey="label"
                innerRadius={62}
                outerRadius={92}
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
              1,248
            </span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {statusBreakdown.map((entry) => (
            <li key={entry.label} className="flex items-center gap-3 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="flex-1 text-foreground">{entry.label}</span>
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
