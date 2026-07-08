"use client"

import Link from "next/link"
import { Building2, Users, FileCheck2, Lock } from "lucide-react"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function settingsGroups(es: boolean) {
  return es
    ? [
        { title: "Perfil institucional", icon: Building2, items: ["Espacio KLEIO Arthouse", "Cairo, Egypt", "Perfil público activo"] },
        { title: "Roles del equipo", icon: Users, items: ["12 revisores", "3 líderes de comité", "2 administradores de programa"] },
        { title: "Valores de revisión", icon: FileCheck2, items: ["Revisión por etapas activada", "Materiales faltantes señalados automáticamente", "La lista corta requiere voto de comité"] },
        { title: "Ajustes demo", icon: Lock, items: ["Datos sintéticos estáticos", "Sin correo saliente", "Espacio institucional demo"] },
      ]
    : [
        { title: "Institution profile", icon: Building2, items: ["KLEIO Arthouse workspace", "Cairo, Egypt", "Public profile active"] },
        { title: "Team roles", icon: Users, items: ["12 reviewers", "3 committee leads", "2 program administrators"] },
        { title: "Review defaults", icon: FileCheck2, items: ["Multi-stage review enabled", "Missing materials flagged automatically", "Shortlist requires committee vote"] },
        { title: "Demo settings", icon: Lock, items: ["Static synthetic data", "No outbound email", "Demo institution workspace"] },
      ]
}

export function InstitutionSettingsPageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow={t("institution.workspace.settings.eyebrow")} title={t("institution.workspace.settings.title")} description={t("institution.workspace.settings.description")} primaryCta={{ label: t("institution.workspace.settings.cta.viewProfile"), href: "/institution/kleio-arthouse/" }} secondaryCta={{ label: t("institution.workspace.settings.cta.backToDashboard"), href: "/dashboard/" }} />
        <div className="grid gap-4 md:grid-cols-2">{settingsGroups(es).map((group) => { const Icon = group.icon; return <WorkflowCard key={group.title} title={group.title}><Icon className="mb-2 size-4" style={{ color: "#5B4B8A" }} /><ul className="space-y-2">{group.items.map((item) => <li key={item} className="flex items-start gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A997E8] />{item}</li>)}</ul></WorkflowCard> })}</div>
        <section className="rounded-2xl border bg-[#F7F4FF] p-5" style={{ ...cardStyle, borderColor: lavenderSoftLine }}><p className="text-sm" style={{ color: mutedColor }}>{es ? "Los ajustes de este demo son controles base estáticos. La edición completa del equipo y las preferencias se agregará en una etapa posterior del producto." : "Workspace settings in this demo are static foundation controls. Full team and preference editing will be added in a later build pass."}</p><Link href="/committee/" className="mt-3 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{es ? "Gestionar comité →" : "Manage committee →"}</Link></section>
      </div>
    </main>
  )
}
