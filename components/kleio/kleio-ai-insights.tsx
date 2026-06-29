import { Sparkles, ArrowRight, AlertCircle, Vote, BookmarkCheck } from "lucide-react"
import { analytics, demoScenarios } from "@/lib/kleio-data"

const insightItems = [
  {
    icon: AlertCircle,
    label: "Deadline triage",
    body: `${analytics.needsAttentionCount} submissions need attention. Start with the incomplete but promising applicant before the next deadline.`,
  },
  {
    icon: Vote,
    label: "Committee bottleneck",
    body: `${analytics.pendingVoteCount} submissions are pending vote. Surface reviewer progress before the next committee check-in.`,
  },
  {
    icon: BookmarkCheck,
    label: "Shortlist signal",
    body: `${analytics.shortlistedCount} candidates are already shortlisted. Compare them before adding more finalists.`,
  },
]

export function KleioAiInsights() {
  return (
    <section className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">KLEIO assist</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Quiet analytic prompts for the program team. AI supports the review flow; it does not make the decision.
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[0.65rem] font-medium text-muted-foreground">
          Demo insight
        </span>
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-3">
        {insightItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Icon className="size-3.5 text-primary" />
                {item.label}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Suggested walkthrough: {demoScenarios.map((scenario) => scenario.title).join(" → ")}.
        </p>
        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
          View scenario path
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </section>
  )
}
