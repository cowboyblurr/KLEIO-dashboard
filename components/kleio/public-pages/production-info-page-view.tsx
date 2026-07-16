"use client"

import Link from "next/link"
import {
  PublicCard,
  PublicEyebrow,
  PublicHero,
  PublicPageShell,
  PublicSection,
} from "@/components/kleio/public-page-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type InfoVariant = "privacy" | "terms" | "contact"

const content = {
  en: {
    privacy: {
      eyebrow: "Trust & data",
      title: "Privacy in the current KLEIO preview",
      subtitle: "A plain-language explanation of what this public preview does today—and what still must be formalized before a real pilot.",
      sections: [
        ["Current preview", "The current website is a static product preview that uses synthetic records and browser-based preview state. It does not provide production authentication, live institutional integrations, or a production submission database."],
        ["User control", "Import Assist and application-preparation experiences are presented as drafts for review. Nothing should be represented as shared, submitted, or approved without a person’s explicit action."],
        ["Before a controlled pilot", "KLEIO must publish a final privacy policy, retention schedule, security practices, account-deletion pathway, and institution data-processing terms before accepting real artist or reviewer information."],
      ],
      notice: "Do not enter sensitive personal, financial, legal, or confidential application information into this preview.",
    },
    terms: {
      eyebrow: "Preview terms",
      title: "Use KLEIO as an evaluation environment",
      subtitle: "The current site is intended for product review, workflow testing, and pilot conversations—not for binding submissions or institutional decisions.",
      sections: [
        ["Synthetic environment", "Artist, institution, opportunity, message, review, and report records shown in the preview are sample records unless explicitly identified otherwise."],
        ["No live submission", "Actions in the preview do not create a real account, deliver an application, invite a reviewer, transfer funds, or produce a binding institutional decision."],
        ["Pilot readiness", "Final terms of service, acceptable-use rules, service responsibilities, accessibility commitments, and dispute terms must be approved before production onboarding begins."],
      ],
      notice: "Use of this preview confirms only that you understand it is an evaluation environment.",
    },
    contact: {
      eyebrow: "Start a conversation",
      title: "Choose the pathway that matches your role",
      subtitle: "KLEIO is preparing for controlled artist and institution testing. Use the relevant intake path so interest can be understood without implying that production onboarding is already live.",
      sections: [
        ["Artists", "Review the Creative Passport intake and see how reusable materials, opportunity readiness, and application preparation are designed to work."],
        ["Institutions", "Review the institution intake and the structured workflow for programs, submissions, committee review, shortlists, and reports."],
        ["Support", "A dedicated production support channel and response standard must be established before the controlled pilot begins."],
      ],
      notice: "The current intake routes are previews and do not create a production account.",
    },
  },
  es: {
    privacy: {
      eyebrow: "Confianza y datos",
      title: "Privacidad en la vista previa actual de KLEIO",
      subtitle: "Una explicación clara de lo que hace hoy esta vista previa pública y de lo que debe formalizarse antes de un piloto real.",
      sections: [
        ["Vista previa actual", "El sitio actual es una vista previa estática con registros sintéticos y estado guardado en el navegador. No ofrece autenticación de producción, integraciones institucionales activas ni una base de datos real de postulaciones."],
        ["Control de la persona", "Import Assist y la preparación de aplicaciones se presentan como borradores para revisión. Nada debe considerarse compartido, enviado o aprobado sin una acción explícita de la persona."],
        ["Antes de un piloto controlado", "KLEIO debe publicar una política final de privacidad, reglas de retención, prácticas de seguridad, eliminación de cuenta y términos de procesamiento institucional antes de aceptar información real."],
      ],
      notice: "No ingreses información personal sensible, financiera, legal o confidencial en esta vista previa.",
    },
    terms: {
      eyebrow: "Términos de vista previa",
      title: "Usa KLEIO como entorno de evaluación",
      subtitle: "El sitio actual sirve para revisar el producto, probar flujos y conversar sobre pilotos; no para postulaciones vinculantes ni decisiones institucionales.",
      sections: [
        ["Entorno sintético", "Los registros de artistas, instituciones, oportunidades, mensajes, revisiones e informes son de muestra salvo que se indique expresamente lo contrario."],
        ["Sin envío real", "Las acciones de la vista previa no crean una cuenta real, entregan una postulación, invitan a un revisor, transfieren fondos ni producen una decisión institucional vinculante."],
        ["Preparación para el piloto", "Los términos finales del servicio, uso aceptable, responsabilidades, accesibilidad y resolución de disputas deben aprobarse antes del onboarding de producción."],
      ],
      notice: "El uso de esta vista previa solo confirma que entiendes que es un entorno de evaluación.",
    },
    contact: {
      eyebrow: "Iniciar una conversación",
      title: "Elige la ruta que corresponde a tu rol",
      subtitle: "KLEIO se prepara para pruebas controladas con artistas e instituciones. Usa la ruta adecuada sin asumir que el onboarding de producción ya está activo.",
      sections: [
        ["Artistas", "Revisa el inicio del Pasaporte Creativo y cómo se organizan materiales reutilizables, preparación para oportunidades y aplicaciones."],
        ["Instituciones", "Revisa el inicio institucional y el flujo estructurado para programas, postulaciones, comité, selección e informes."],
        ["Soporte", "Debe establecerse un canal de soporte de producción y un estándar de respuesta antes del piloto controlado."],
      ],
      notice: "Las rutas actuales son vistas previas y no crean una cuenta de producción.",
    },
  },
} as const

export function ProductionInfoPageView({ variant }: { variant: InfoVariant }) {
  const { locale } = useKleioLocale()
  const page = content[locale === "es" ? "es" : "en"][variant]
  const es = locale === "es"

  return (
    <PublicPageShell>
      <PublicEyebrow>{page.eyebrow}</PublicEyebrow>
      <PublicHero title={page.title} subtitle={page.subtitle} />

      <div className="mt-14 grid gap-8">
        {page.sections.map(([heading, body]) => (
          <PublicSection key={heading} heading={heading}>{body}</PublicSection>
        ))}
      </div>

      <PublicCard>
        <p className="text-sm font-semibold text-[#5B4B8A]">{page.notice}</p>
      </PublicCard>

      {variant === "contact" && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup/artist/" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]">
            {es ? "Ver ruta para artistas" : "View artist pathway"}
          </Link>
          <Link href="/signup/institution/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]">
            {es ? "Ver ruta institucional" : "View institution pathway"}
          </Link>
        </div>
      )}
    </PublicPageShell>
  )
}
