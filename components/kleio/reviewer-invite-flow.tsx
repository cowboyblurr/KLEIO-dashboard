import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

const steps = [
  "Invite reviewer",
  "Assign submissions",
  "Reviewer seat",
  "Review complete",
]

export function ReviewerInviteFlow() {
  return (
    <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-sm" data-kleio-guide-target="reviewer-invite-flow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reviewer invite flow</p>
          <h2 className="mt-1 font-serif text-lg font-semibold text-foreground">From committee invite to assigned review.</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This is the reviewer path institutions need to trust: invite the reviewer, assign only relevant submissions, open a limited reviewer seat, then preserve the completed review in the decision history.
          </p>
        </div>
        <Link href="/collaborator-dashboard/" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          Preview reviewer seat
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 max-md:grid-cols-1">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-3 text-sm text-[#6F6882]">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[#5B4B8A] shadow-sm">
              <CheckCircle2 className="size-3.5" />
            </span>
            <span className="font-medium text-[#292631]">{step}</span>
            {index < steps.length - 1 && <ArrowRight className="ml-auto size-3.5 text-[#A997E8] max-md:hidden" />}
          </div>
        ))}
      </div>
    </section>
  )
}
