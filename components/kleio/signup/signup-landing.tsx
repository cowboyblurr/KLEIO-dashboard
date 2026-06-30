import Image from "next/image"
import Link from "next/link"
import { Building2, Palette } from "lucide-react"
import { assetPath } from "@/lib/asset-path"

export function SignupLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.985_0.005_287)]">
      <header className="border-b border-border bg-white/80 px-5 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl justify-center">
          <Image src={assetPath("/kleio-wordmark.png")} alt="KLEIO" width={1024} height={189} priority className="h-8 w-auto" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Welcome to KLEIO</h1>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            One platform for artists and institutions — connected through reusable passports and structured review workflows.
          </p>
        </div>

        <div className="grid w-full gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10">
              <Palette className="size-6 text-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">I&apos;m an Artist</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Create a reusable artist passport for applications, portfolios, and opportunities.
            </p>
            <Link
              href="/signup/artist/"
              className="mt-6 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue as Artist
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-[oklch(0.93_0.04_287)]">
              <Building2 className="size-6 text-[oklch(0.42_0.16_287)]" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">I&apos;m an Institution</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Create a review workspace for open calls, submissions, committees, and shortlists.
            </p>
            <Link
              href="/signup/institution/"
              className="mt-6 flex h-11 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-accent/50"
            >
              Continue as Institution
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Demo environment — no account is created. All data is synthetic.
        </p>
      </main>
    </div>
  )
}
