import Image from "next/image"
import Link from "next/link"
import { assetPath } from "@/lib/asset-path"

export function SignupShell({
  children,
  step,
  totalSteps,
  title,
}: {
  children: React.ReactNode
  step?: number
  totalSteps?: number
  title?: string
}) {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_287)]">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/signup/" className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border">
            <Image src={assetPath("/kleio-wordmark.png")} alt="KLEIO" width={1024} height={189} priority className="h-6 w-auto" />
          </Link>
          {step && totalSteps && (
            <p className="text-xs font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        {title && (
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
