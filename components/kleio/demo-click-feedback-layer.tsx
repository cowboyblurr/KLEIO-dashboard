"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type Feedback = {
  title: string
  body: string
}

function normalizedText(element: Element) {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase()
}

function cardHeading(button: Element) {
  const section = button.closest("section, article, aside, div")
  return normalizedText(section?.querySelector("h1, h2, h3") ?? section ?? button)
}

function routeForMessages(pathname: string | null) {
  if (pathname?.startsWith("/artist-dashboard")) return "/artist-dashboard/messages/"
  if (pathname?.startsWith("/collaborator-dashboard")) return "/collaborator-dashboard/messages/"
  return "/messages/"
}

function routeForApplications(pathname: string | null) {
  if (pathname?.startsWith("/artist-dashboard")) return "/artist-dashboard/applications/"
  return "/submissions/"
}

function routeForReviewQueue(pathname: string | null) {
  if (pathname?.startsWith("/collaborator-dashboard")) return "/collaborator-dashboard/review-queue/"
  return "/review-queue/"
}

export function DemoClickFeedbackLayer() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useKleioLocale()
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const copy = useMemo(() => {
    const es = locale === "es"
    return {
      demoOnlyTitle: es ? "Acción de demo" : "Demo action",
      demoOnlyBody: es
        ? "Este prototipo usa datos sintéticos y no modifica registros reales."
        : "This prototype uses synthetic data and does not change live records.",
      searchTitle: es ? "Búsqueda simulada" : "Simulated search",
      searchBody: es
        ? "La búsqueda visualiza cómo funcionaría el filtrado. Usa la navegación o KLEIO Assist para abrir una página específica."
        : "Search previews how filtering would work. Use the sidebar or KLEIO Assist to open a specific page.",
      programTitle: es ? "Filtro de programas" : "Program filter",
      programBody: es
        ? "El filtro de programas está preparado para el demo. Abre Aplicaciones u Oportunidades para ver registros estructurados."
        : "The program filter is prepared for the demo. Open Applications or Opportunities to view structured records.",
      notificationTitle: es ? "Notificaciones del demo" : "Demo notifications",
      notificationBody: es
        ? "Las alertas importantes aparecen como próximas acciones, fechas y mensajes dentro del espacio."
        : "Important alerts are represented as next actions, deadlines, and messages inside the workspace.",
      profileTitle: es ? "Perfil demo" : "Demo profile",
      profileBody: es
        ? "Este selector representa futuras opciones de cuenta. El perfil público y la configuración están disponibles desde la navegación."
        : "This selector represents future account options. Public profile and settings are available from navigation.",
      moreTitle: es ? "Más acciones" : "More actions",
      moreBody: es
        ? "En una versión activa, este menú abriría editar, duplicar, archivar o preparar materiales. En el demo, el registro queda sin cambios."
        : "In a live version, this menu would open edit, duplicate, archive, or prepare-material actions. In the demo, the record stays unchanged.",
      inviteTitle: es ? "Coincidencias en vista previa" : "Matches preview",
      inviteBody: es
        ? "Invitaciones y mensajes entre artistas están marcados como una capa futura. El demo mantiene el foco en Pasaporte, Oportunidades y Aplicaciones."
        : "Artist invites and peer messages are marked as a future layer. This demo keeps focus on Passport, Opportunities, and Applications.",
      reportTitle: es ? "Informe preparado" : "Report preview",
      reportBody: es
        ? "Este botón representa una exportación futura. Los datos del informe son sintéticos y no se genera un archivo real."
        : "This button represents a future export. Report data is synthetic and no real file is generated.",
      reviewerTitle: es ? "Asiento de revisor" : "Reviewer seat",
      reviewerBody: es
        ? "Esta acción abriría una vista limitada para revisores invitados. Usa el espacio de colaborador para ver esa experiencia."
        : "This action would open a limited view for invited reviewers. Use the collaborator workspace to preview that experience.",
    }
  }, [locale])

  function show(next: Feedback) {
    setFeedback(next)
    window.setTimeout(() => setFeedback(null), 3000)
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null
      const button = target?.closest("button")
      if (!button) return
      if (button.closest(".kleio-demo-guide-panel")) return
      if (button.closest("form")) return
      if (button.getAttribute("aria-expanded") != null) return
      if (button.closest("summary")) return

      const text = normalizedText(button)
      const aria = (button.getAttribute("aria-label") ?? "").toLowerCase()
      const heading = cardHeading(button)

      if (text.includes("new application") || text.includes("nueva aplicación")) {
        event.preventDefault()
        router.push("/artist-dashboard/opportunities/")
        return
      }

      if (text.includes("review passport") || text.includes("revisar pasaporte")) {
        event.preventDefault()
        router.push("/artist-dashboard/passport/")
        return
      }

      if (text.includes("view all applications") || text.includes("ver todas las aplicaciones")) {
        event.preventDefault()
        router.push(routeForApplications(pathname))
        return
      }

      if (text.includes("view all actions") || text.includes("ver todas las acciones")) {
        event.preventDefault()
        router.push(routeForApplications(pathname))
        return
      }

      if (text === "view all" || text === "ver todo") {
        event.preventDefault()
        if (heading.includes("timeline") || heading.includes("decisión") || heading.includes("decision")) {
          router.push(pathname?.startsWith("/artist-dashboard") ? "/artist-dashboard/calendar/" : "/activity-log/")
          return
        }
        if (heading.includes("match") || heading.includes("coincid")) {
          router.push("/artist-dashboard/collaborators/")
          return
        }
        router.push(routeForApplications(pathname))
        return
      }

      if (text.includes("all programs") || text.includes("todos los programas")) {
        event.preventDefault()
        show({ title: copy.programTitle, body: copy.programBody })
        return
      }

      if (aria.includes("notification") || aria.includes("notific")) {
        event.preventDefault()
        show({ title: copy.notificationTitle, body: copy.notificationBody })
        return
      }

      if (aria.includes("message") || aria.includes("mensaje")) {
        event.preventDefault()
        router.push(routeForMessages(pathname))
        return
      }

      if (aria.includes("actions for") || text.includes("more")) {
        event.preventDefault()
        show({ title: copy.moreTitle, body: copy.moreBody })
        return
      }

      if (text.includes("invite") || text.includes("invitar") || aria.includes("message ")) {
        event.preventDefault()
        show({ title: copy.inviteTitle, body: copy.inviteBody })
        return
      }

      if (text.includes("export") || text.includes("report") || text.includes("informe")) {
        event.preventDefault()
        show({ title: copy.reportTitle, body: copy.reportBody })
        return
      }

      if (text.includes("assign reviewer") || text.includes("preview reviewer") || text.includes("revisor")) {
        event.preventDefault()
        show({ title: copy.reviewerTitle, body: copy.reviewerBody })
        return
      }

      const isIconOnly = text.length === 0 && Boolean(aria)
      if (isIconOnly) {
        show({ title: copy.demoOnlyTitle, body: copy.demoOnlyBody })
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLInputElement | null
      if (!target || target.tagName !== "INPUT") return
      if (target.type !== "search") return
      if (event.key !== "Enter") return
      event.preventDefault()
      show({ title: copy.searchTitle, body: copy.searchBody })
    }

    document.addEventListener("click", onClick, true)
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [copy, pathname, router])

  if (!feedback) return null

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] w-[min(100vw-2rem,26rem)] -translate-x-1/2 rounded-2xl border border-[#E7E1F7] bg-white/95 px-4 py-3 shadow-[0_18px_48px_rgba(82,64,130,0.16)] backdrop-blur-md">
      <p className="text-sm font-semibold text-[#292631]">{feedback.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#6F6882]">{feedback.body}</p>
    </div>
  )
}
