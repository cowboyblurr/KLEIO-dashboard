import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"

export function WorkspaceMetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={cardStyle}>
      <p className="text-xs font-medium" style={{ color: mutedColor }}>
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums" style={{ color: inkColor }}>
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-xs" style={{ color: mutedColor }}>
          {helper}
        </p>
      )}
    </div>
  )
}
