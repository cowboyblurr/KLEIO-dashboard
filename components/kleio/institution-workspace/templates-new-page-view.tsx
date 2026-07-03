import Link from "next/link"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const templateTypes = [
  "Open Call",
  "Review Criteria",
  "Applicant Message",
  "Report Outline",
  "Application Requirement",
  "Committee Workflow",
]

const draftFields = [
  "Template title",
  "Category",
  "Reusable body text",
  "Required fields checklist",
  "Preview notes",
]

export function TemplatesNewPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Template builder"
          title="Create Template"
          description="Start a reusable structure for open calls, review criteria, messages, or reports."
          prototypeNote="This foundation page outlines where reusable templates will be created. Full editing controls will be added in a later build pass."
          primaryCta={{ label: "Back to Templates", href: "/templates/" }}
          secondaryCta={{ label: "Programs", href: "/programs/" }}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkflowCard title="Template type selection" body="Choose the structure you want to reuse across future programs.">
            <div className="grid gap-2 sm:grid-cols-2">
              {templateTypes.map((type) => (
                <div key={type} className="rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "#E7E1F7", color: inkColor }}>
                  {type}
                </div>
              ))}
            </div>
          </WorkflowCard>

          <WorkflowCard title="Draft outline" body="Define the reusable fields your team will fill in later.">
            <ul className="space-y-2">
              {draftFields.map((field) => (
                <li key={field} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#E7E1F7", color: mutedColor }}>
                  {field}
                </li>
              ))}
            </ul>
          </WorkflowCard>
        </div>

        <WorkflowCard title="Preview card" body="Open Call template · Required materials · Applicant communication · Review criteria attachment">
          <Link href="/programs/new/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Apply to new open call →
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
