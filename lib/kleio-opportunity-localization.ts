import type { OpportunityDirectoryItem, OpportunityRequirement } from "@/lib/kleio-opportunity-data"

export type OpportunityTranslationRecord = {
  id: string
  opportunity_id: string
  locale: "en" | "es"
  source_language: string
  title: string
  summary: string
  description: string
  required_materials: string[]
  requirement_translations: Record<string, { label?: string; source_text?: string }>
  source_content_hash: string
  translation_method: string
  verified_at: string | null
  updated_at: string
}

export type LocalizedOpportunityItem = OpportunityDirectoryItem & {
  source_language?: string
  translation_locale?: "en" | "es" | null
  translation_notice?: string
  translation_complete?: boolean
  original_title?: string
  original_summary?: string
  original_description?: string
}

function languageName(code: string, locale: "en" | "es") {
  if (code === "es") return locale === "es" ? "español" : "Spanish"
  if (code === "en") return locale === "es" ? "inglés" : "English"
  return locale === "es" ? "el idioma original" : "the original language"
}

function localizedRequirements(requirements: OpportunityRequirement[], translation: OpportunityTranslationRecord) {
  return requirements.map((requirement) => {
    const translated = translation.requirement_translations?.[requirement.id] || translation.requirement_translations?.[requirement.material_key]
    return translated ? { ...requirement, label: translated.label || requirement.label, source_text: translated.source_text || requirement.source_text } : requirement
  })
}

export function localizeOpportunity(
  item: OpportunityDirectoryItem & { source_language?: string },
  locale: "en" | "es",
  translations: OpportunityTranslationRecord[],
): LocalizedOpportunityItem {
  const sourceLanguage = item.source_language || "und"
  if (sourceLanguage === locale || sourceLanguage === "und") return { ...item, source_language: sourceLanguage, translation_locale: null }

  const translation = translations.find((record) => record.opportunity_id === item.id && record.locale === locale)
  const sourceName = languageName(sourceLanguage, locale)
  if (!translation) {
    const notice = locale === "es"
      ? `Traducción no disponible. Se muestra el contenido original en ${sourceName}.`
      : `Translation unavailable. Original ${sourceName} content is shown.`
    return {
      ...item,
      source_language: sourceLanguage,
      translation_locale: null,
      translation_notice: notice,
      translation_complete: false,
      summary: `${notice}\n\n${item.summary}`,
      description: `${notice}\n\n${item.description}`,
    }
  }

  const notice = locale === "es"
    ? `Traducción al español de contenido originalmente publicado en ${sourceName}. Consulta el texto original a continuación.`
    : `English translation of content originally published in ${sourceName}. Original text is included below.`
  const translatedDescription = translation.description.trim()
  const description = translatedDescription
    ? `${notice}\n\n${translatedDescription}\n\n${locale === "es" ? "Texto original" : "Original text"}:\n${item.description}`
    : `${notice}\n\n${locale === "es" ? "La descripción completa no está traducida; se muestra el texto original." : "The full description is not translated; the original text is shown."}\n\n${item.description}`

  return {
    ...item,
    source_language: sourceLanguage,
    translation_locale: locale,
    translation_notice: notice,
    translation_complete: Boolean(translation.title.trim() && translation.summary.trim() && translatedDescription),
    original_title: item.title,
    original_summary: item.summary,
    original_description: item.description,
    title: translation.title.trim() || item.title,
    summary: `${notice}\n\n${translation.summary.trim() || item.summary}`,
    description,
    required_materials: translation.required_materials?.length ? translation.required_materials : item.required_materials,
    requirements: localizedRequirements(item.requirements, translation),
  }
}
