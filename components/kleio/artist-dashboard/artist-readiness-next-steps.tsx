"use client"

import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
} from "lucide-react"
import type { ArtistDashboardProfile } from "@/lib/kleio-data"
import type { ArtistAnalytics } from "@/lib/kleio-artist-analytics"
import { formatArtistNextDeadline } from "@/lib/kleio-artist-analytics"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type ReadinessItem = {
  label: string
  title: string
  detail: string
  href: string
  action: string
  icon: typeof FileText
  tone: "attention" | "upcoming" | "ready"
}

const toneClasses: Record<ReadinessItem["tone"], string> = {
  attention: "border-amber-200/80 bg-amber-50/60 text-amber-800",
  upcoming: "border-[#DDD5F0] bg-[#F8F6FD] text-[#5B4B8A]",
  ready: "border-emerald-200/80 bg-emerald-50/60 text-emerald-800",
}

export function ArtistReadinessNextSteps({
  profile,
  analytics,
}: {
  profile: ArtistDashboardProfile
  analytics: ArtistAnalytics
}) {
  const { locale } = useKleioLocale()
  const incompleteItems = profile.passportCompleteness.filter((item) => item.status !== "complete")
  const missingPreview = incompleteItems.slice(0, 2).map((item) => item.label).join(", ")
  const passportReady = analytics.passportCompletenessPct >= 100

  const needsAttention: ReadinessItem = incompleteItems.length
    ? {
        label: locale === "es" ? "Necesita atención" : "Needs attention",
        title: locale === "es"
          ? `${incompleteItems.length} material${incompleteItems.length === 1 ? "" : "es"} del pasaporte por completar`
          : `${incompleteItems.length} Passport material${incompleteItems.length === 1 ? "" : "s"} to complete`,
        detail: missingPreview || (locale === "es" ? "Revisa los materiales principales." : "Review the remaining core materials."),
        href: "/artist-dashboard/passport/",
        action: locale === "es" ? "Revisar pasaporte" : "Review Passport",
        icon: FileText,
        tone: "attention",
      }
    : analytics.dueSoon > 0
      ? {
          label: locale === "es" ? "Necesita atención" : "Needs attention",
          title: locale === "es"
            ? `${analytics.dueSoon} solicitud${analytics.dueSoon === 1 ? "" : "es"} necesita atención pronto`
            : `${analytics.dueSoon} application${analytics.dueSoon === 1 ? "" : "s"} need attention soon`,
          detail: locale === "es"
            ? "Confirma los materiales y las fechas antes de enviar."
            : "Confirm materials and timing before submission.",
          href: "/artist-dashboard/applications/",
          action: locale === "es" ? "Abrir solicitudes" : "Open applications",
          icon: FileText,
          tone: "attention",
        }
      : {
          label: locale === "es" ? "Necesita atención" : "Needs attention",
          title: locale === "es" ? "Nada urgente en este momento" : "Nothing urgent right now",
          detail: locale === "es"
            ? "Tu espacio no muestra bloqueos inmediatos."
            : "Your workspace shows no immediate blockers.",
          href: "/artist-dashboard/opportunities/",
          action: locale === "es" ? "Explorar oportunidades" : "Explore opportunities",
          icon: CheckCircle2,
          tone: "ready",
        }

  const comingNext: ReadinessItem = analytics.nextDeadline
    ? {
        label: locale === "es" ? "Próximo" : "Coming next",
        title: locale === "es"
          ? `Próxima fecha: ${formatArtistNextDeadline(analytics.nextDeadline, locale)}`
          : `Next deadline: ${formatArtistNextDeadline(analytics.nextDeadline, locale)}`,
        detail: locale === "es"
          ? `${analytics.activeApplications} solicitud${analytics.activeApplications === 1 ? "" : "es"} activa${analytics.activeApplications === 1 ? "" : "s"}; ${analytics.dueSoon} requiere${analytics.dueSoon === 1 ? "" : "n"} atención pronto.`
          : `${analytics.activeApplications} active application${analytics.activeApplications === 1 ? "" : "s"}; ${analytics.dueSoon} need attention soon.`,
        href: "/artist-dashboard/applications/",
        action: locale === "es" ? "Ver calendario de solicitudes" : "View application timing",
        icon: CalendarDays,
        tone: "upcoming",
      }
    : {
        label: locale === "es" ? "Próximo" : "Coming next",
        title: locale === "es" ? "No hay una fecha activa" : "No active deadline",
        detail: locale === "es"
          ? "Explora oportunidades cuando estés listo para iniciar una nueva solicitud."
          : "Explore opportunities when you are ready to begin a new application.",
        href: "/artist-dashboard/opportunities/",
        action: locale === "es" ? "Buscar oportunidades" : "Find opportunities",
        icon: CalendarDays,
        tone: "upcoming",
      }

  const readyToMove: ReadinessItem = passportReady
    ? analytics.activeApplications > 0
      ? {
          label: locale === "es" ? "Listo para avanzar" : "Ready to move",
          title: locale === "es"
            ? `${analytics.activeApplications} solicitud${analytics.activeApplications === 1 ? "" : "es"} en marcha`
            : `${analytics.activeApplications} application${analytics.activeApplications === 1 ? "" : "s"} in motion`,
          detail: locale === "es"
            ? "Tu Pasaporte Creativo está listo para reutilizarse."
            : "Your Creative Passport is ready to reuse.",
          href: "/artist-dashboard/applications/",
          action: locale === "es" ? "Continuar solicitudes" : "Continue applications",
          icon: CheckCircle2,
          tone: "ready",
        }
      : {
          label: locale === "es" ? "Listo para avanzar" : "Ready to move",
          title: locale === "es" ? "Pasaporte listo para reutilizar" : "Passport ready to reuse",
          detail: locale === "es"
            ? "Puedes evaluar oportunidades y preparar una solicitud sin volver a empezar."
            : "You can evaluate opportunities and prepare an application without starting over.",
          href: "/artist-dashboard/opportunities/",
          action: locale === "es" ? "Explorar oportunidades" : "Explore opportunities",
          icon: CheckCircle2,
          tone: "ready",
        }
    : {
        label: locale === "es" ? "Listo para avanzar" : "Ready to move",
        title: locale === "es"
          ? `${analytics.materialsReadyCount} de ${analytics.materialsTotalCount} materiales principales listos`
          : `${analytics.materialsReadyCount} of ${analytics.materialsTotalCount} core materials ready`,
        detail: locale === "es"
          ? "Completa los materiales restantes para mejorar la preparación de solicitudes."
          : "Complete the remaining materials to improve application readiness.",
        href: "/artist-dashboard/passport/",
        action: locale === "es" ? "Completar materiales" : "Complete materials",
        icon: CheckCircle2,
        tone: "upcoming",
      }

  const items = [needsAttention, comingNext, readyToMove]

  return (
    <section
      aria-labelledby="artist-readiness-next-steps-title"
      className="rounded-[1.1rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.045)] md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-[#A997E8]">
            {locale === "es" ? "Orientación del espacio" : "Workspace guidance"}
          </p>
          <h2 id="artist-readiness-next-steps-title" className="mt-1 font-serif text-xl font-semibold text-[#292631]">
            {locale === "es" ? "Preparación y próximos pasos" : "Readiness & Next Steps"}
          </h2>
          <p className="mt-1 max-w-3xl text-[0.76rem] leading-relaxed text-[#7F7890]">
            {locale === "es"
              ? "Una vista práctica de lo que requiere atención, lo que viene después y lo que ya está listo."
              : "A practical view of what needs attention, what is coming next, and what is already ready."}
          </p>
        </div>
        <span className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A]">
          {analytics.passportCompletenessPct}% {locale === "es" ? "del perfil listo" : "profile ready"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-xl border border-[#E7E1F7] p-3.5 transition hover:border-[#CFC3EA] hover:bg-[#FDFBFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
            >
              <div className="flex items-start gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${toneClasses[item.tone]}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#8A8296]">
                    {item.label}
                  </p>
                  <h3 className="mt-1 text-[0.8rem] font-semibold leading-snug text-[#292631]">{item.title}</h3>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">{item.detail}</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-[#5B4B8A]">
                    {item.action}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
