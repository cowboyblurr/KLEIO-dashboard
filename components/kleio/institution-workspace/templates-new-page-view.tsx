import Link from "next/link"
import { inkColor, mutedColor } from "@/lib/workspace-styles"
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
          eyebrow="Template planning"
          title="Template Builder"
          description="Outline reusable structures for open calls, review criteria, applicant messages, reports, and recurring committee workflows."
          primaryCta={{ label: "Back to Templates", href: "/templates/" }}
          secondaryCta={{ label: "Programs", href: "/programs/" }}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkflowCard title="Choose a template type" body="Select the kind of structure your team wants to reuse across programs.">
            <div className="grid gap-2 sm:grid-cols-2">
              {templateTypes.map((type) => (
                <div key={type} className="rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "#E7E1F7", color: inkColor }}>
                  {type}
                </div>
              ))}
            </div>
          </WorkflowCard>

          <WorkflowCard title="Define the reusable structure" body="Organize the fields, guidance, and language your team needs when preparing a program.">
            <ul className="space-y-2">
              {draftFields.map((field) => (
                <li key={field} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#E7E1F7", color: mutedColor }}>
                  {field}
                </li>
              ))}
            </ul>
          </WorkflowCard>
        </div>

        <WorkflowCard title="Use the structure in a program" body="Keep required materials, applicant communication, review criteria, and committee handoffs consistent as you configure an open call.">
          <Link href="/programs/new/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Create a new open call →
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
