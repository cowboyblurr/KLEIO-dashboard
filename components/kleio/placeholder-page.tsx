import { Construction } from "lucide-react"

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto px-6 py-10">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-border bg-card text-primary shadow-sm">
          <Construction className="size-6" />
        </span>
        <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">Coming soon</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </main>
  )
}
