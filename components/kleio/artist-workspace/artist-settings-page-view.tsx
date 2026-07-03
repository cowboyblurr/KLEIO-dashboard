import Link from "next/link"
import { Globe, Bell, Lock, User } from "lucide-react"
import { DEMO_ARTIST_PUBLIC_PROFILE, inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const settingsGroups = [
  {
    title: "Profile visibility",
    icon: Globe,
    items: ["Public profile active", "Bio and practice tags visible", "CV kept private by default"],
  },
  {
    title: "Material defaults",
    icon: User,
    items: ["Default portfolio set: Grant applications", "Auto-attach artist statement", "Reuse answers enabled"],
  },
  {
    title: "Notification preferences",
    icon: Bell,
    items: ["Deadline reminders: 7 days and 48 hours", "Missing material requests", "Collaborator messages"],
  },
  {
    title: "Demo settings",
    icon: Lock,
    items: ["Demo artist: Amina El Badri", "Static workspace data", "No outbound email in this build"],
  },
]

export function ArtistSettingsPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Workspace settings"
          title="Artist Settings"
          description="Manage artist workspace preferences, profile visibility, demo settings, and Creative Passport defaults."
          primaryCta={{ label: "View Public Profile", href: DEMO_ARTIST_PUBLIC_PROFILE }}
          secondaryCta={{ label: "Back to Artist Overview", href: "/artist-dashboard/" }}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {settingsGroups.map((group) => {
            const Icon = group.icon
            return (
              <WorkflowCard key={group.title} title={group.title}>
                <Icon className="mb-2 size-4" style={{ color: "#5B4B8A" }} />
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A997E8]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </WorkflowCard>
            )
          })}
        </div>

        <section className="rounded-2xl border bg-[#F7F4FF] p-5" style={{ ...cardStyle, borderColor: lavenderSoftLine }}>
          <p className="text-sm" style={{ color: mutedColor }}>
            Settings in this demo are static foundation controls. Full preference editing will be added in a later build pass.
          </p>
          <Link href="/artist-dashboard/passport/" className="mt-3 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Manage Creative Passport →
          </Link>
        </section>
      </div>
    </main>
  )
}
