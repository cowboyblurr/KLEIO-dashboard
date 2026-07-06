import type { KleioLocale, TranslationParams } from "@/lib/kleio-i18n"

// Reviewed Spanish copy overrides for KLEIO.
// Keep product/brand terms such as KLEIO, KLEIO Arthouse, KLEIO Assist, Import Assist,
// demo emails, names, and program names untranslated unless the phrase is intentionally localized.
const esReviewedMessages: Record<string, string> = {
  // Landing
  "nav.journal": "Bitácora",
  "nav.exploreArthouse": "Explorar Arthouse",
  "landing.login.title": "Entra a tu espacio de trabajo KLEIO",
  "landing.login.subtitle":
    "Usa el acceso demo para explorar el flujo de artista, institución o colaborador de revisión.",
  "landing.login.demoWorkspace": "Espacio de trabajo demo",
  "landing.choosePath.title": "Elige tu ruta en KLEIO",
  "landing.choosePath.subtitle": "Comienza con un Pasaporte Creativo o un espacio de trabajo institucional.",
  "landing.choosePath.workspace": "Workspace",
  "landing.importAssist.note":
    "Import Assist, de forma opcional, puede preparar borradores de campos a partir de materiales que ya mantienes.",
  "landing.login.error": "Usa las credenciales demo o elige un rol demo para continuar.",

  // Public pages
  "public.about.hero.title": "Un espacio compartido para artistas y para las instituciones que revisan su trabajo.",
  "public.about.artist.heading": "Para artistas, KLEIO reduce el trabajo repetitivo de postulación.",
  "public.about.artist.body":
    "A menudo se les pide a los artistas reconstruir los mismos materiales para becas, residencias, exposiciones y convocatorias: biografías, declaraciones artísticas, CV, portafolios, descripciones de proyecto, muestras de obra y enlaces. KLEIO convierte esos materiales en un Pasaporte Creativo reutilizable que puede revisarse, actualizarse y adaptarse a futuras oportunidades.",
  "public.about.institution.body":
    "Las instituciones necesitan más que un formulario. Necesitan una forma clara de gestionar postulaciones, materiales faltantes, asignación de revisores, notas de comité, listas cortas, decisiones e informes. KLEIO ofrece a los equipos un espacio estructurado para todo el ciclo de postulación.",
  "public.about.assist.body":
    "KLEIO puede ayudar a preparar campos en borrador, señalar materiales faltantes y organizar próximos pasos. Artistas e instituciones mantienen el control de lo que pasa a ser oficial, lo que se comparte y lo que avanza.",
  "public.about.collaborator.note":
    "Los colaboradores entran por un asiento de revisión limitado, no por un perfil público. Solo ven postulaciones asignadas, lineamientos, mensajes y tareas de revisión.",
  "public.about.card.workspace.title": "Espacio de trabajo institucional",
  "public.about.cta.title": "Empieza con la ruta que corresponde a tu rol.",
  "public.about.cta.body":
    "Los artistas pueden comenzar a construir un Pasaporte Creativo. Las instituciones pueden explorar un espacio de revisión diseñado para postulaciones y decisiones.",
  "public.manifesto.hero.subtitle":
    "KLEIO se construye sobre una creencia simple: los artistas no deberían tener que reconstruir su identidad profesional una y otra vez, y las instituciones no deberían gestionar decisiones culturales entre archivos, formularios y bandejas de entrada dispersas.",
  "public.manifesto.principle.1.heading": "Los artistas deben seguir siendo autores de su propio registro.",
  "public.manifesto.principle.1.body":
    "Una plataforma debe ayudar a los artistas a preparar, organizar y reutilizar sus materiales sin aplanar su voz. KLEIO apoya el trabajo alrededor de la obra y deja la autoría en manos del artista.",
  "public.manifesto.principle.4.body":
    "KLEIO Assist puede preparar borradores, identificar vacíos y organizar próximas acciones. No reemplaza el criterio artístico, el contexto curatorial ni la responsabilidad institucional.",
  "public.manifesto.quote":
    "KLEIO existe para hacer más claro, más organizado y más fácil de preservar el camino entre el trabajo creativo y la oportunidad institucional.",
  "public.journal.eyebrow": "Bitácora",
  "public.journal.hero.subtitle":
    "La Bitácora KLEIO es un espacio para notas breves sobre lo que estamos construyendo, lo que aprendemos de artistas e instituciones y dónde el proceso de postulación necesita mejores herramientas.",
  "public.journal.article.assist.body":
    "El rol de la tecnología asistiva en KLEIO es preparar campos, organizar contexto y señalar vacíos. Artistas e instituciones deciden qué pasa a ser oficial.",
  "public.journal.note":
    "Estas notas iniciales forman parte del proceso de desarrollo. A medida que KLEIO evoluciona, la Bitácora documentará decisiones de producto, puntos de fricción para artistas, flujos institucionales y aprendizajes de pilotos.",
  "public.journal.cta.institution": "Crear espacio de trabajo institucional",

  // Auth / roles
  "auth.artist.heading": "Entra al espacio de trabajo del artista",
  "auth.institution.heading": "Entra al espacio de trabajo institucional",
  "auth.collaborator.heading": "Entra al asiento de revisión para colaboradores",
  "auth.collaborator.description":
    "Usa el acceso demo para revisar postulaciones asignadas, lineamientos, mensajes y avance de revisión sin entrar al espacio institucional completo.",
  "auth.generic.description": "Los espacios de trabajo de KLEIO son privados. Usa el acceso demo para entrar a este espacio.",
  "auth.dashboard.artist": "Panel del artista",
  "auth.dashboard.institution": "Panel institucional",
  "auth.dashboard.collaborator": "Asiento de revisión para colaboradores",

  // Signup
  "signup.common.enterInstitutionWorkspace": "Entrar al espacio de trabajo institucional",
  "signup.common.suggestedNote": "Preparado por KLEIO Assist. Revisa y edita antes de continuar.",
  "signup.artist.profileBasics.description":
    "Comienza con los datos que la mayoría de las convocatorias piden primero. Puedes ajustar cada campo antes de usarlo.",
  "signup.artist.field.documents": "CV / documentos de apoyo",
  "signup.artist.field.featuredWorks": "Obras destacadas",
  "signup.artist.materialsSuggestions.noImport":
    "Aún no has usado Import Assist. Puedes conectarlo arriba para preparar materiales o continuar revisando tus entradas manuales.",
  "signup.artist.materialsSuggestions.readyToApply": "Listo para aplicarse a un campo vacío",
  "signup.artist.review.description": "Confirma lo que está listo antes de entrar a tu espacio de trabajo de artista.",
  "signup.artist.review.stillMissing": "Aún falta",
  "signup.artist.createPassport": "Entrar al espacio de trabajo del artista",
  "signup.institution.subtitle":
    "Configura programas, flujos de revisión, materiales requeridos y tu equipo de revisión en un entorno organizado.",
  "signup.institution.institutionDetails.description":
    "Comienza con los datos públicos y el contexto de misión que tus programas usarán como referencia.",
  "signup.institution.reviewTeam.description":
    "Invita a revisores, jurados invitados, miembros de comité, curadores o asesores a asientos de revisión limitados. Solo verán los programas, postulaciones, lineamientos y mensajes asignados a su rol.",
  "signup.institution.reviewTeam.optionalNote":
    "Configuración opcional · Puedes omitir esto e invitar colaboradores después desde Comité.",
  "signup.institution.reviewTeam.metric.limitedSeats": "Asientos limitados",
  "signup.institution.reviewTeam.addMember": "Añadir al equipo de revisión",
  "signup.institution.reviewTeam.demoNote":
    "Registros demo de invitación para asientos de revisión limitados. Los colaboradores solo verán el contexto asignado.",
  "signup.institution.review.description": "Confirma lo que está listo antes de entrar a tu espacio de trabajo institucional.",
  "signup.institution.enterWorkspace": "Entrar al espacio de trabajo institucional",
  "signup.institution.materialsSuggestions.description":
    "Revisa campos sugeridos del espacio de trabajo, referencias importadas y pendientes de configuración. Puedes omitir Import Assist y continuar manualmente.",
  "signup.institution.materialsSuggestions.preparedFields": "Campos del espacio de trabajo preparados para revisión",
  "signup.institution.materialsSuggestions.readyToApply": "Listo para aplicarse a un campo vacío del espacio de trabajo",
  "signup.institution.materialsSuggestions.allFieldsEntered": "Todos los campos del espacio de trabajo están completos",

  // Review team / assist
  "reviewTeam.permission.messageInstitution": "Enviar mensaje a la institución",
  "reviewTeam.label.limitedReviewSeat": "Asiento de revisión limitado",
  "importAssist.connected": "{count} conectadas",
  "importAssist.readyToApply": "Listo para aplicar",
  "importAssist.youApproveOfficial": "Tú apruebas lo que pasa a ser oficial",
  "importAssist.organizeDraft":
    "KLEIO puede ayudar a organizar un primer borrador a partir de materiales que ya mantienes. Tú sigues siendo el autor. Revisa y edita cada sugerencia. Aplica sugerencias solo a campos vacíos.",
  "assist.object.complete.description":
    "El contexto del espacio demo está organizado. Tú apruebas lo que pasa a ser oficial.",

  // Demo guide legacy strings
  "demoGuide.startGuidedDemo": "Iniciar demo guiado",
  "demoGuide.takeMeThere": "Llévame allí",
  "demoGuide.chooseScenario": "Elige un escenario demo",
  "demoGuide.loginHint":
    "Elige un escenario y luego abre el demo de institución, artista o colaborador para seguir cada paso. KLEIO guía; tú apruebas lo que pasa a ser oficial.",
  "demoGuide.scenario.strongShortlist.summary":
    "Lleva a una artista con puntaje alto a la lista corta conservando el contexto de decisión.",
  "demoGuide.step.reviewerBottleneck.3.body":
    "Vuelve al registro de actividad para narrar cómo aparecen los votos pendientes antes de tomar decisiones de lista corta.",
  "demoGuide.step.strongShortlist.1.body":
    "Amina El Badri tiene materiales completos y puntajes altos de revisión. Abre el panel del tablero para revisar el contexto en un solo lugar.",
  "demoGuide.step.strongShortlist.2.body":
    "Abre la vista de lista corta para ver cómo se organiza una candidatura con puntaje alto. Tú apruebas el movimiento.",

  // Artist workspace
  "nav.artist.insights": "Insights",
  "nav.artist.tagline.body": "KLEIO mantiene organizado el trabajo administrativo.",
  "artist.workspace.overview.spectrumMatches.description":
    "Sugerido según el contexto de práctica y la afinidad con oportunidades.",
  "artist.workspace.overview.passportCompleteness.title": "Nivel de completitud del pasaporte",
  "artist.workspace.passport.metric.completeness": "Nivel de completitud del pasaporte",
  "artist.workspace.passport.profileBasics.body":
    "Mantén actualizados tu biografía, ubicación, lenguaje de práctica, enlaces de contacto e identidad del perfil público.",
  "artist.workspace.passport.sharingControls.title": "Controles para compartir",
  "artist.workspace.passport.sharingControls.body":
    "Elige qué compartir públicamente, qué mantener privado y qué preparar para cada oportunidad.",
  "artist.workspace.passport.sharing.privateCvDraft": "Borrador privado de CV",
  "artist.workspace.opportunities.filter.fitScore": "Afinidad",
  "artist.workspace.opportunities.fitScore": "{pct}% de afinidad",
  "artist.workspace.opportunities.readinessSummary.gapOne":
    "{count} material aún necesita revisión antes de postular a oportunidades de alta afinidad.",
  "artist.workspace.opportunities.readinessSummary.gapOther":
    "{count} materiales aún necesitan revisión antes de postular a oportunidades de alta afinidad.",
  "artist.workspace.funding.metric.estimatedFit": "Afinidad estimada",
  "artist.workspace.funding.metric.completeness": "Nivel de completitud",
  "artist.workspace.funding.column.fit": "Afinidad",
  "artist.workspace.funding.column.completeness": "Nivel de completitud",
  "artist.workspace.funding.missingChip": "{program}: faltan {count}",
  "artist.workspace.insights.card.materialGaps.body":
    "{count} materiales del pasaporte aún necesitan revisión antes de postular a oportunidades de alta afinidad.",
  "artist.workspace.insights.metric.activeOpportunitiesDetail": "Alineadas con el pasaporte actual",
  "artist.workspace.settings.description":
    "Gestiona preferencias del espacio de trabajo del artista, visibilidad del perfil, ajustes demo y valores predeterminados del Pasaporte Creativo.",

  // Institution workspace
  "institution.workspace.dashboard.description":
    "Gestiona postulaciones, avance de revisión, materiales faltantes, listas cortas e informes desde un espacio organizado.",
  "institution.workspace.committee.cta.previewCollaboratorSeat":
    "Vista previa del asiento de revisión para colaboradores",
  "institution.workspace.committee.metric.pendingActions": "Acciones pendientes de revisores",
  "institution.workspace.committee.metric.completion": "Avance de revisión",
  "institution.workspace.committee.metric.limitedSeats": "Asientos limitados",
  "institution.workspace.committee.limitedReviewSeat": "Asiento de revisión limitado",
  "institution.workspace.committee.scenario.body":
    "Dos revisiones completas. Un voto del comité sigue pendiente antes de que esta finalista pueda avanzar.",
  "institution.workspace.committee.reviewerProgress":
    "Avance de revisión: {completed}/{total} completadas · {pending} pendientes",
  "institution.workspace.committee.cta.previewReviewerSeat": "Vista previa del asiento de revisor",
  "institution.workspace.programs.title": "Programas y convocatorias abiertas",
  "institution.workspace.templates.cta.createOpenCall": "Crear convocatoria abierta",
  "institution.workspace.settings.description":
    "Gestiona detalles del espacio de trabajo, preferencias demo, roles del equipo y valores predeterminados de revisión.",
  "institution.shortlist.exportConfirmation":
    "Lista de selección preparada para {count} candidatura (solo demo).",
  "institution.shortlist.exportConfirmationOther":
    "Lista de selección preparada para {count} candidaturas (solo demo).",
  "institution.chart.statusBreakdown": "Desglose del estado de las postulaciones",

  // Collaborator workspace
  "nav.collaborator.workspace": "Asiento de revisión para colaboradores",
  "nav.collaborator.focusedSeat.title": "Asiento de revisión enfocado",
  "collaborator.overview.eyebrow": "Asiento de revisión para colaboradores",
  "collaborator.overview.title":
    "Revisa postulaciones asignadas para {institution} sin entrar al espacio institucional completo.",
  "collaborator.overview.metric.completionRate": "Tasa de avance",
  "collaborator.assignments.description":
    "Solo postulaciones asignadas a ti para revisión. Sin directorio global de artistas ni cola institucional completa.",
  "collaborator.reviewQueue.description":
    "Trabaja solo con las postulaciones asignadas. La rúbrica, las notas y los controles de recomendación están limitados a tu asiento de revisión.",
  "collaborator.reviewQueue.notesFootnote":
    "Campo base — las notas permanecen privadas en tu asiento de revisión en este demo.",
  "collaborator.reviewQueue.recommendation.decline": "No recomendar",
  "collaborator.reviewQueue.saveDraftDemo": "Guardar borrador (demo)",
  "collaborator.reviewQueue.submitReviewDemo": "Enviar revisión (demo)",
  "collaborator.guidelines.conflict.body":
    "Si tienes una relación personal, profesional o financiera con un solicitante, notifica al equipo del programa antes de completar tu revisión. No califiques ni recomiendes asignaciones donde exista un conflicto.",
  "collaborator.messages.empty": "No hay mensajes específicos para colaboradores en este conjunto demo.",
  "collaborator.overview.messages.empty": "No hay mensajes específicos para colaboradores en este conjunto demo.",

  // Profile / status / common
  "profile.institution.cta.createWorkspace": "Crear espacio de trabajo institucional",
  "status.ready": "Listo",
  "status.preparedForScoring": "Preparada para evaluación",
  "common.prepareDraft": "Preparar borrador",
  "common.continueReviewing": "Continuar revisión",
  "common.foundationWorkflow": "Flujo base",
  "plural.source.one": "{count} fuente conectada",
  "plural.source.other": "{count} fuentes conectadas",
  "plural.review.one": "{count} revisión",
  "plural.review.other": "{count} revisiones",
  "plural.submission.one": "{count} postulación",
  "plural.submission.other": "{count} postulaciones",
}

function interpolate(message: string, params?: TranslationParams) {
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`))
}

export function formatSpanishOverride(
  locale: KleioLocale,
  key: string,
  params?: TranslationParams,
): string | null {
  if (locale !== "es") return null
  const message = esReviewedMessages[key]
  if (!message) return null
  return interpolate(message, params)
}
