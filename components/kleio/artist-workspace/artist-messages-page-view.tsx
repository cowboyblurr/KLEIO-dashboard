"use client"

import { useState } from "react"
import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const messages = [
  { id: "1", subject: "Lumen Arts Grant — Missing budget upload", preview: "Please upload your budget outline before the May 28 deadline.", type: "Missing materials", date: "Aug 8, 2026" },
  { id: "2", subject: "Citywide Artist Award — Final draft reminder", preview: "Your final draft is due before committee review begins.", type: "Application", date: "Aug 7, 2026" },
  { id: "3", subject: "Global Perspectives Residency — Interview schedule", preview: "Interview window confirmed for May 30. Prepare project notes.", type: "Interview", date: "Aug 5, 2026" },
  { id: "4", subject: "Leila Martinez — Collaboration note", preview: "Interested in a shared research thread around archives and community practice.", type: "Collaborator", date: "Aug 3, 2026" },
]

import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ArtistMessagesPageView() {
  const { t } = useKleioLocale()
  const [selectedId, setSelectedId] = useState(messages[0].id)
  const selected = messages.find((m) => m.id === selectedId) ?? messages[0]

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.messages.eyebrow")}
          title={t("artist.workspace.messages.title")}
          description={t("artist.workspace.messages.description")}
          primaryCta={{ label: t("artist.workspace.messages.cta.reviewApplications"), href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: t("artist.workspace.messages.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-4 py-3" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="text-sm font-semibold" style={{ color: inkColor }}>Inbox</h2>
            </div>
            <ul>
              {messages.map((msg) => (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-[#F7F4FF] ${selectedId === msg.id ? "bg-[#F7F4FF]" : ""}`}
                    style={{ borderColor: lavenderSoftLine }}
                  >
                    <p className="text-sm font-medium" style={{ color: inkColor }}>{msg.subject}</p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: mutedColor }}>{msg.preview}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>{selected.subject}</h2>
              <DemoStatusChip label={selected.type} tone="info" />
            </div>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>{selected.date}</p>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: inkColor }}>{selected.preview}</p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>
              This foundation preview keeps message context connected to the related application, materials request, or collaborator thread.
            </p>
            <Link href="/artist-dashboard/applications/" className="mt-4 inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Open related application
            </Link>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <WorkflowCard title="Missing materials" body="One institution request is waiting on a budget upload for Lumen Arts Grant." />
          <WorkflowCard title="Collaborator notes" body="Leila Martinez shared a collaboration note connected to archives and social practice." />
          <WorkflowCard title="Application context" body="Messages stay linked to drafts, submissions, and interview milestones." />
        </div>
      </div>
    </main>
  )
}
