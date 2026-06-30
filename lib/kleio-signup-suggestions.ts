import { getMissingFields, getSuggestedFields } from "@/lib/kleio-intelligence"

export type SuggestionStatus = "approved" | "edited" | "rejected" | "suggested"

export type FieldOrigin = "suggested" | "edited" | undefined

export function formatSuggestionValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value
}

const artistExtras: Record<string, Record<string, string>> = {
  "amina-el-badri": {
    artistName: "Amina El Badri",
    location: "Cairo, Egypt",
    website: "https://aminaelbadri.com",
    artistStatement:
      "My work explores the relationship between memory, space, and visibility through minimal forms and subtle light. Draft suggested — edit before saving.",
  },
}

const institutionExtras: Record<string, Record<string, string>> = {
  "kleio-arthouse": {
    institutionName: "KLEIO Arthouse",
    institutionType: "Arthouse",
    location: "Brooklyn, NY, USA",
    website: "https://kleioarthouse.org",
    reviewProcessType: "Blind first round, committee shortlist, final panel review",
    committeeSize: "5 core reviewers, 2 guest jurors",
  },
}

export function buildArtistFormSuggestions(subjectId: string): Record<string, string> {
  const suggestions: Record<string, string> = { ...(artistExtras[subjectId] ?? {}) }
  const fields = getSuggestedFields("artist", subjectId)

  for (const field of fields) {
    const value = formatSuggestionValue(field.suggestedValue)
    switch (field.field) {
      case "bio":
        suggestions.shortBio = value
        break
      case "disciplineTags":
        suggestions.discipline = value
        break
      case "mediumTags":
        suggestions.mediums = value
        break
      case "statementThemes":
        suggestions.themes = value
        if (!suggestions.artistStatement) {
          suggestions.artistStatement = `Draft suggested — themes include ${value}. Edit before saving.`
        }
        break
      case "featuredWorks":
        suggestions.featuredWorks = value
        break
      case "documentChecklist":
        suggestions.documents = value
        break
      case "publicLinks":
        suggestions.portfolioLinks = value
        if (!suggestions.website) {
          suggestions.website = value.split(",")[0]?.trim().replace(/^@/, "https://instagram.com/") ?? value
        }
        break
      case "portfolioCategories":
        if (!suggestions.themes) suggestions.themes = value
        break
      case "sonicReferences":
        suggestions.mediums = suggestions.mediums
          ? `${suggestions.mediums}; ${value}`
          : value
        break
      default:
        break
    }
  }

  return suggestions
}

export function buildInstitutionFormSuggestions(subjectId: string): Record<string, string> {
  const suggestions: Record<string, string> = { ...(institutionExtras[subjectId] ?? {}) }
  const fields = getSuggestedFields("institution", subjectId)

  for (const field of fields) {
    const value = formatSuggestionValue(field.suggestedValue)
    switch (field.field) {
      case "institutionName":
        suggestions.institutionName = value
        break
      case "institutionType":
        suggestions.institutionType = value
        break
      case "location":
        suggestions.location = value
        break
      case "publicDescription":
        suggestions.publicDescription = value
        break
      case "missionSummary":
        suggestions.missionStatement = `${value} Draft suggested — edit before saving.`
        break
      case "programCategories":
        suggestions.programType = value
        break
      case "defaultMaterials":
        suggestions.requiredMaterials = value
        break
      case "reviewerRoles":
        suggestions.reviewerRoles = value
        break
      case "reportingNeeds":
        suggestions.reportingNeeds = value
        break
      case "importStructure":
        suggestions.importStructure = value
        break
      default:
        break
    }
  }

  if (!suggestions.website && suggestions.institutionName) {
    suggestions.website = "https://kleioarthouse.org"
  }

  return suggestions
}

export function getEmptyFieldKeys(
  form: Record<string, string>,
  suggestions: Record<string, string>,
): string[] {
  return Object.keys(suggestions).filter((key) => !form[key]?.trim())
}

export function getConflictKeys(
  form: Record<string, string>,
  suggestions: Record<string, string>,
): string[] {
  return Object.keys(suggestions).filter((key) => !!form[key]?.trim() && !!suggestions[key]?.trim())
}

export function applySuggestionsToEmptyFields<T extends Record<string, string>>(
  form: T,
  origins: Partial<Record<keyof T, FieldOrigin>>,
  suggestions: Record<string, string>,
  approvedOnly?: Set<string>,
): { form: T; origins: Partial<Record<keyof T, FieldOrigin>> } {
  const nextForm = { ...form }
  const nextOrigins = { ...origins }

  for (const [key, value] of Object.entries(suggestions)) {
    if (!value.trim()) continue
    if (approvedOnly && !approvedOnly.has(key)) continue
    if (nextForm[key as keyof T]?.trim()) continue

    nextForm[key as keyof T] = value as T[keyof T]
    nextOrigins[key as keyof T] = "suggested"
  }

  return { form: nextForm, origins: nextOrigins }
}

export function getArtistMissingFormFields(form: Record<string, string>): string[] {
  const labels: Record<string, string> = {
    artistName: "Artist name",
    location: "Location",
    discipline: "Discipline / practice type",
    website: "Website or portfolio link",
    shortBio: "Short bio",
    artistStatement: "Artist statement",
    mediums: "Mediums",
    themes: "Themes / keywords",
    portfolioLinks: "Portfolio links",
    documents: "CV / documents",
    featuredWorks: "Featured works",
  }

  return Object.entries(labels)
    .filter(([key]) => !form[key]?.trim())
    .map(([, label]) => label)
}

export function getInstitutionMissingFormFields(form: Record<string, string>): string[] {
  const labels: Record<string, string> = {
    institutionName: "Institution name",
    institutionType: "Institution type",
    location: "Location",
    website: "Website",
    publicDescription: "Public description",
    missionStatement: "Mission statement",
    programType: "Program type",
    reviewProcessType: "Review process type",
    requiredMaterials: "Application materials required",
    reviewerRoles: "Reviewer roles",
    committeeSize: "Committee size",
    reportingNeeds: "Reporting needs",
  }

  return Object.entries(labels)
    .filter(([key]) => !form[key]?.trim())
    .map(([, label]) => label)
}

export function getIntelligenceMissingFields(userType: "artist" | "institution", subjectId: string): string[] {
  return getMissingFields(userType, subjectId)
}
