import Link from "next/link"
import { institution } from "@/lib/kleio-data"

export function DemoPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {institution.demoLabel}
        </span>
      </header>
      {children}
    </main>
  )
}

export function DemoStatRow({
  label,
  value,
  href,
}: {
  label: string
  value: string | number
  href?: string
}) {
  const content = (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}
