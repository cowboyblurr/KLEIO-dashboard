"use client"

import { ChevronDown } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { applicationsOverTime } from "@/lib/kleio-data"

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
    >
      {label}
      <ChevronDown className="size-3.5 text-muted-foreground" />
    </button>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        Applications {payload[0].value}
      </p>
    </div>
  )
}

export function ApplicationsChart() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm kleio-card-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Applications Over Time
        </h2>
        <div className="flex items-center gap-2">
          <FilterChip label="All Programs" />
          <FilterChip label="Last 6 months" />
        </div>
      </div>

      <div className="mt-4 h-56 w-full 2xl:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={applicationsOverTime}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="appFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.2 287)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.55 0.2 287)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              domain={[0, "dataMax + 3"]}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="oklch(0.52 0.2 287)"
              strokeWidth={2.5}
              fill="url(#appFill)"
              dot={{ r: 3, fill: "oklch(0.52 0.2 287)", strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "oklch(0.52 0.2 287)",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
