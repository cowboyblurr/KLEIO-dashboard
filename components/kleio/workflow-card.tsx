import { inkColor, mutedColor, lavenderDeep, cardStyle } from "@/lib/workspace-styles"

export function WorkflowCard({
  title,
  body,
  meta,
  children,
  className = "",
}: {
  title: string
  body?: string
  meta?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border bg-white p-5 ${className}`} style={cardStyle}>
      <h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: inkColor }}>
        {title}
      </h2>
      {body && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>
          {body}
        </p>
      )}
      {meta && (
        <p className="mt-2 text-xs font-medium" style={{ color: lavenderDeep }}>
          {meta}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}