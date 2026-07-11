import type { KleioDemoSession } from "@/lib/kleio-demo-auth"
import {
  programHref,
  reviewerAnchorHref,
  submissionHref,
} from "@/lib/kleio-entity-routes"

export type InternalThreadRole = "institution" | "collaborator"
export type InternalThreadScope = "program" | "submission" | "committee" | "reviewer" | "report"
export type InternalThreadLocale = "en" | "es"

export type InternalThreadMessage = {
  id: string
  author: string
  role: string
  roleEs: string
  body: string
  bodyEs: string
  date: string
  dateEs: string
}

export type InternalThread = {
  id: string
  title: string
  titleEs: string
  scope: InternalThreadScope
  label: string
  labelEs: string
  relatedRecordLabel: string
  relatedRecordLabelEs: string
  relatedRecordHref: string
  surfaceHrefs: string[]
  allowedRoles: InternalThreadRole[]
  reviewerIds?: string[]
  unreadCount: number
  lastUpdated: string
  lastUpdatedEs: string
  messages: InternalThreadMessage[]
}

export const internalThreads: InternalThread[] = [
  {
    id: "committee-residency-cycle",
    title: "Residency committee alignment",
    titleEs: "Alineación del comité de residencia",
    scope: "committee",
    label: "Committee",
    labelEs: "Comité",
    relatedRecordLabel: "KLEIO Arthouse Residency 2026",
    relatedRecordLabelEs: "Residencia KLEIO Arthouse 2026",
    relatedRecordHref: programHref("residency-2026"),
    surfaceHrefs: ["/dashboard/", "/committee/", "/review-room/", "/programs/residency-2026/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan", "theo-malik", "lina-park"],
    unreadCount: 2,
    lastUpdated: "Today · 9:42 AM",
    lastUpdatedEs: "Hoy · 9:42 a. m.",
    messages: [
      {
        id: "committee-residency-cycle-1",
        author: "Mara Voss",
        role: "Program Lead",
        roleEs: "Responsable del programa",
        body: "Please keep the shortlist discussion attached to the residency record. We need the final report to show why each candidate advanced.",
        bodyEs: "Por favor mantengan la conversación sobre la lista corta vinculada al registro de la residencia. El informe final debe mostrar por qué avanzó cada candidatura.",
        date: "Today · 9:12 AM",
        dateEs: "Hoy · 9:12 a. m.",
      },
      {
        id: "committee-residency-cycle-2",
        author: "Celeste Rowan",
        role: "Committee Reviewer",
        roleEs: "Revisora del comité",
        body: "Amina has the strongest alignment so far. I want Sofia held for one more vote before the final movement.",
        bodyEs: "Amina es la candidatura con mejor alineación hasta ahora. Prefiero mantener a Sofia pendiente hasta recibir un voto más antes del movimiento final.",
        date: "Today · 9:42 AM",
        dateEs: "Hoy · 9:42 a. m.",
      },
    ],
  },
  {
    id: "submission-amina-shortlist",
    title: "Amina shortlist decision",
    titleEs: "Decisión de lista corta para Amina",
    scope: "submission",
    label: "Applicant record",
    labelEs: "Registro de postulante",
    relatedRecordLabel: "Amina El Badri · Echoes of Memory",
    relatedRecordLabelEs: "Amina El Badri · Echoes of Memory",
    relatedRecordHref: submissionHref("amina-el-badri"),
    surfaceHrefs: ["/review-queue/", "/review-room/", "/shortlist/", "/submissions/amina-el-badri/", "/artists/amina-el-badri/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan", "theo-malik"],
    unreadCount: 1,
    lastUpdated: "Today · 10:04 AM",
    lastUpdatedEs: "Hoy · 10:04 a. m.",
    messages: [
      {
        id: "submission-amina-shortlist-1",
        author: "Theo Malik",
        role: "Reviewer",
        roleEs: "Revisor",
        body: "Review complete. I recommend moving this application into final shortlist with the material sensitivity note preserved.",
        bodyEs: "Revisión completada. Recomiendo mover esta postulación a la lista corta final y conservar la nota sobre la sensibilidad material de la obra.",
        date: "Today · 9:58 AM",
        dateEs: "Hoy · 9:58 a. m.",
      },
      {
        id: "submission-amina-shortlist-2",
        author: "Mara Voss",
        role: "Program Lead",
        roleEs: "Responsable del programa",
        body: "Agreed. Keep this thread linked to the submission so the report can reference the actual review rationale.",
        bodyEs: "De acuerdo. Mantengan este hilo vinculado a la postulación para que el informe pueda citar el razonamiento real de la revisión.",
        date: "Today · 10:04 AM",
        dateEs: "Hoy · 10:04 a. m.",
      },
    ],
  },
  {
    id: "submission-mei-materials",
    title: "Mei missing-material cleanup",
    titleEs: "Materiales faltantes de Mei",
    scope: "submission",
    label: "Materials",
    labelEs: "Materiales",
    relatedRecordLabel: "Mei Lin Zhang · Trace",
    relatedRecordLabelEs: "Mei Lin Zhang · Trace",
    relatedRecordHref: submissionHref("mei-lin-zhang"),
    surfaceHrefs: ["/review-queue/", "/messages/", "/submissions/mei-lin-zhang/", "/artists/mei-lin-zhang/"],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["lina-park"],
    unreadCount: 0,
    lastUpdated: "Yesterday · 4:31 PM",
    lastUpdatedEs: "Ayer · 4:31 p. m.",
    messages: [
      {
        id: "submission-mei-materials-1",
        author: "Lina Park",
        role: "Reviewer",
        roleEs: "Revisora",
        body: "The application should not move forward until the updated CV and dimensions are attached. The work is promising but the file is not review-ready yet.",
        bodyEs: "La postulación no debería avanzar hasta que se adjunten el CV actualizado y las dimensiones. La obra es prometedora, pero el expediente todavía no está listo para revisión.",
        date: "Yesterday · 4:31 PM",
        dateEs: "Ayer · 4:31 p. m.",
      },
    ],
  },
  {
    id: "submission-sofia-pending-vote",
    title: "Sofia pending committee vote",
    titleEs: "Voto pendiente del comité para Sofia",
    scope: "committee",
    label: "Vote",
    labelEs: "Voto",
    relatedRecordLabel: "Sofia Karim · The Distance Between Light",
    relatedRecordLabelEs: "Sofia Karim · The Distance Between Light",
    relatedRecordHref: submissionHref("sofia-karim"),
    surfaceHrefs: ["/committee/", "/review-room/", "/shortlist/", "/submissions/sofia-karim/", reviewerAnchorHref("celeste-rowan")],
    allowedRoles: ["institution", "collaborator"],
    reviewerIds: ["celeste-rowan"],
    unreadCount: 1,
    lastUpdated: "Today · 11:18 AM",
    lastUpdatedEs: "Hoy · 11:18 a. m.",
    messages: [
      {
        id: "submission-sofia-pending-vote-1",
        author: "Mara Voss",
        role: "Program Lead",
        roleEs: "Responsable del programa",
        body: "Celeste, can you add your final vote here before we move Sofia out of pending committee status?",
        bodyEs: "Celeste, ¿puedes agregar tu voto final aquí antes de sacar a Sofia del estado pendiente de comité?",
        date: "Today · 11:05 AM",
        dateEs: "Hoy · 11:05 a. m.",
      },
      {
        id: "submission-sofia-pending-vote-2",
        author: "Celeste Rowan",
        role: "Committee Reviewer",
        roleEs: "Revisora del comité",
        body: "I am leaning hold, not decline. The research is strong, but the committee needs one more clarity note before final shortlist.",
        bodyEs: "Me inclino por mantenerla en espera, no por rechazarla. La investigación es sólida, pero el comité necesita una nota aclaratoria más antes de la lista corta final.",
        date: "Today · 11:18 AM",
        dateEs: "Hoy · 11:18 a. m.",
      },
    ],
  },
  {
    id: "report-residency-memory",
    title: "Report language and decision memory",
    titleEs: "Lenguaje del informe y memoria de decisiones",
    scope: "report",
    label: "Report",
    labelEs: "Informe",
    relatedRecordLabel: "Residency review report",
    relatedRecordLabelEs: "Informe de revisión de residencia",
    relatedRecordHref: "/reports/",
    surfaceHrefs: ["/reports/", "/activity-log/", "/review-room/"],
    allowedRoles: ["institution"],
    unreadCount: 0,
    lastUpdated: "Today · 12:02 PM",
    lastUpdatedEs: "Hoy · 12:02 p. m.",
    messages: [
      {
        id: "report-residency-memory-1",
        author: "Mara Voss",
        role: "Program Lead",
        roleEs: "Responsable del programa",
        body: "When the report is prepared, keep the committee rationale clear and avoid presenting demo activity as a real institutional outcome.",
        bodyEs: "Cuando se prepare el informe, mantengan claro el razonamiento del comité y eviten presentar la actividad demo como si fuera un resultado institucional real.",
        date: "Today · 12:02 PM",
        dateEs: "Hoy · 12:02 p. m.",
      },
    ],
  },
]

export function canAccessInternalThread(thread: InternalThread, session: KleioDemoSession | null) {
  if (!session || session.role === "artist") return false
  if (session.role === "institution") return thread.allowedRoles.includes("institution")
  if (!thread.allowedRoles.includes("collaborator")) return false
  if (!thread.reviewerIds?.length) return true
  return Boolean(session.collaboratorId && thread.reviewerIds.includes(session.collaboratorId))
}

export function getVisibleInternalThreads(session: KleioDemoSession | null) {
  return internalThreads.filter((thread) => canAccessInternalThread(thread, session))
}

export function getInternalThreadAccessLabel(session: KleioDemoSession | null, locale: InternalThreadLocale = "en") {
  const es = locale === "es"
  if (!session) return es ? "Sin sesión activa de espacio de trabajo" : "No active workspace session"
  if (session.role === "institution") return es ? "Acceso del equipo institucional" : "Institution team access"
  if (session.role === "collaborator") return es ? "Acceso limitado de revisor" : "Scoped reviewer access"
  return es ? "Espacio de artista excluido" : "Artist workspace excluded"
}

export function getInternalThreadRoleLabel(session: KleioDemoSession | null, locale: InternalThreadLocale = "en") {
  const es = locale === "es"
  if (session?.role === "institution") return es ? "Equipo institucional" : "Institution team"
  if (session?.role === "collaborator") return es ? "Revisor con acceso limitado" : "Scoped reviewer"
  return es ? "Espacio interno" : "Internal workspace"
}
