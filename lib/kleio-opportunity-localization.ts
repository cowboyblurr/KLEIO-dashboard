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
  if (!translation) {
    return {
      ...item,
      source_language: sourceLanguage,
      translation_locale: null,
      translation_notice: locale === "es" ? "Texto original" : "Original text",
      translation_complete: false,
    }
  }

  const translatedTitle = translation.title.trim()
  const translatedSummary = translation.summary.trim()
  const translatedDescription = translation.description.trim()
  const translationNotice = locale === "es" ? "Traducido del texto original" : "Translated from original text"
  const originalLabel = locale === "es" ? "Texto original" : "Original text"

  return {
    ...item,
    source_language: sourceLanguage,
    translation_locale: locale,
    translation_notice: translationNotice,
    translation_complete: Boolean(translatedTitle && translatedSummary && translatedDescription),
    original_title: item.title,
    original_summary: item.summary,
    original_description: item.description,
    title: translatedTitle || item.title,
    summary: translatedSummary || item.summary,
    description: translatedDescription
      ? `${translationNotice}\n\n${translatedDescription}\n\n${originalLabel}\n${item.description}`
      : item.description,
    required_materials: translation.required_materials?.length ? translation.required_materials : item.required_materials,
    requirements: localizedRequirements(item.requirements, translation),
  }
}
