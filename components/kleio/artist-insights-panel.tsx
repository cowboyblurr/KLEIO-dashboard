"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import type { Artist } from "@/lib/kleio-data"
import { CompletionRing } from "@/components/kleio/artist-passport-body"

export function ArtistInsightsPanel({ artist }: { artist: Artist }) {
  const insights = artist.insights

  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">KLEIO Assist</h3>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">Beta</span>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <CompletionRing value={artist.passportCompleteness} size={40} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Profile completeness</p>
              <p className="text-sm font-semibold text-foreground">{artist.passportCompleteness}%</p>
            </div>
          </div>

          {insights && (
            <>
              <div className="border-t border-border/60 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best-fit opportunities</p>
                <ul className="space-y-1">
                  {insights.bestFitOpportunities.map((item) => (
                    <li key={item} className="text-xs text-foreground">· {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strongest mediums</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{insights.strongestMediums}</p>
              </div>

              <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                <p className="mb-1 text-xs font-semibold text-primary">Next recommended</p>
                <p className="text-sm font-medium text-foreground">{insights.nextRecommended.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {insights.nextRecommended.institution} · Deadline {insights.nextRecommended.deadline}
                </p>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View opportunity
                </button>
              </div>
            </>
          )}

          <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
            Suggestions are based on your passport content. KLEIO Assist does not rank artists or make final decisions.
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/"
        className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        Switch to institution view →
      </Link>
    </aside>
  )
}
