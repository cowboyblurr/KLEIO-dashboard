import Link from "next/link"
import { collaboratorAnalytics, formatCollaboratorDeadline } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"

export function CollaboratorGuidelinesPageView() {
  const analytics = collaboratorAnalytics

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Review criteria"
          title="Guidelines"
          description="Program rubrics and required materials for your assigned review work only."
          primaryCta={{ label: "Open Review Queue", href: "/collaborator-dashboard/review-queue/" }}
        />

        <WorkflowCard
          title="Review conduct"
          body="Review only the materials assigned to you. Use the rubric provided by the institution. Flag conflicts before submitting a recommendation."
        />

        <div className="grid gap-4">
          {analytics.guidelinePrograms.map((program) => (
            <section key={program.id} className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: lavenderDeep }}>
                    {program.category}
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold" style={{ color: inkColor }}>
                    {program.title}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                    Deadline {formatCollaboratorDeadline(program.deadline)}
                  </p>
                </div>
                <Link href="/collaborator-dashboard/review-queue/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                  Open assigned reviews →
                </Link>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Rubric</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>
                    {program.rubric.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Required materials</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>
                    {program.requiredMaterials.map((material) => (
                      <li key={material}>{material}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5">
          <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
            Conflict of interest reminder
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>
            If you have a personal, professional, or financial relationship with an applicant, notify the program team
            before completing your review. Do not score or recommend on assignments where a conflict exists.
          </p>
        </section>
      </div>
    </main>
  )
}
