export type ArtistTaxonomyOption = {
  value: string
  label: string
  labelEs: string
  aliases?: string[]
}

export const ARTIST_DISCIPLINE_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "painting", label: "Painting", labelEs: "Pintura" },
  { value: "drawing", label: "Drawing", labelEs: "Dibujo" },
  { value: "sculpture", label: "Sculpture", labelEs: "Escultura" },
  { value: "ceramics", label: "Ceramics", labelEs: "Cerámica", aliases: ["ceramic", "pottery"] },
  { value: "photography", label: "Photography", labelEs: "Fotografía", aliases: ["photo", "lens-based", "lens based"] },
  { value: "film", label: "Film", labelEs: "Cine", aliases: ["cinema", "moving image"] },
  { value: "video", label: "Video", labelEs: "Video", aliases: ["moving image"] },
  { value: "animation", label: "Animation", labelEs: "Animación" },
  { value: "installation", label: "Installation", labelEs: "Instalación" },
  { value: "performance", label: "Performance", labelEs: "Performance" },
  { value: "sound_art", label: "Sound art", labelEs: "Arte sonoro", aliases: ["sound"] },
  { value: "music", label: "Music", labelEs: "Música" },
  { value: "digital_art", label: "Digital art", labelEs: "Arte digital" },
  { value: "new_media", label: "New media", labelEs: "Nuevos medios" },
  { value: "mixed_media", label: "Mixed media", labelEs: "Técnica mixta" },
  { value: "printmaking", label: "Printmaking", labelEs: "Grabado", aliases: ["print"] },
  { value: "textile_fiber_art", label: "Textile and fiber art", labelEs: "Arte textil y de fibras", aliases: ["fiber art", "fibre art", "textile"] },
  { value: "fashion", label: "Fashion", labelEs: "Moda" },
  { value: "design", label: "Design", labelEs: "Diseño" },
  { value: "illustration", label: "Illustration", labelEs: "Ilustración" },
  { value: "public_art", label: "Public art", labelEs: "Arte público" },
  { value: "social_practice", label: "Social practice", labelEs: "Práctica social" },
  { value: "community_engaged_art", label: "Community-engaged art", labelEs: "Arte comunitario", aliases: ["community art", "community engaged"] },
  { value: "writing", label: "Writing", labelEs: "Escritura" },
  { value: "poetry", label: "Poetry", labelEs: "Poesía" },
  { value: "curatorial_practice", label: "Curatorial practice", labelEs: "Práctica curatorial" },
  { value: "architecture", label: "Architecture", labelEs: "Arquitectura" },
  { value: "craft", label: "Craft", labelEs: "Artesanía" },
  { value: "conceptual_art", label: "Conceptual art", labelEs: "Arte conceptual" },
  { value: "interdisciplinary_practice", label: "Interdisciplinary practice", labelEs: "Práctica interdisciplinaria", aliases: ["interdisciplinary"] },
]

export const ARTIST_MEDIUM_MATERIAL_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "oil", label: "Oil", labelEs: "Óleo" },
  { value: "acrylic", label: "Acrylic", labelEs: "Acrílico" },
  { value: "watercolor", label: "Watercolor", labelEs: "Acuarela" },
  { value: "ink", label: "Ink", labelEs: "Tinta" },
  { value: "paper", label: "Paper", labelEs: "Papel" },
  { value: "clay", label: "Clay", labelEs: "Arcilla" },
  { value: "porcelain", label: "Porcelain", labelEs: "Porcelana" },
  { value: "stoneware", label: "Stoneware", labelEs: "Gres" },
  { value: "wood", label: "Wood", labelEs: "Madera" },
  { value: "metal", label: "Metal", labelEs: "Metal" },
  { value: "glass", label: "Glass", labelEs: "Vidrio" },
  { value: "textile", label: "Textile", labelEs: "Textil", aliases: ["fabric"] },
  { value: "fiber", label: "Fiber", labelEs: "Fibra", aliases: ["fibre"] },
  { value: "found_objects", label: "Found objects", labelEs: "Objetos encontrados", aliases: ["found object"] },
  { value: "analog_photography", label: "Analog photography", labelEs: "Fotografía analógica", aliases: ["film photography"] },
  { value: "digital_photography", label: "Digital photography", labelEs: "Fotografía digital" },
  { value: "film", label: "Film", labelEs: "Película" },
  { value: "digital_video", label: "Digital video", labelEs: "Video digital" },
  { value: "sound", label: "Sound", labelEs: "Sonido", aliases: ["audio"] },
  { value: "code", label: "Code", labelEs: "Código", aliases: ["creative coding"] },
  { value: "virtual_reality", label: "Virtual reality", labelEs: "Realidad virtual", aliases: ["vr"] },
  { value: "augmented_reality", label: "Augmented reality", labelEs: "Realidad aumentada", aliases: ["ar"] },
  { value: "print", label: "Print", labelEs: "Impresión" },
]

export const ARTIST_PRACTICE_TYPE_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "studio_practice", label: "Studio practice", labelEs: "Práctica de estudio" },
  { value: "research_based", label: "Research-based practice", labelEs: "Práctica basada en investigación" },
  { value: "social_practice", label: "Social practice", labelEs: "Práctica social" },
  { value: "public_art", label: "Public art", labelEs: "Arte público" },
  { value: "community_engagement", label: "Community engagement", labelEs: "Participación comunitaria" },
  { value: "education", label: "Education", labelEs: "Educación" },
  { value: "collaborative", label: "Collaborative practice", labelEs: "Práctica colaborativa" },
  { value: "site_specific", label: "Site-specific work", labelEs: "Obra específica del sitio" },
  { value: "participatory", label: "Participatory practice", labelEs: "Práctica participativa" },
  { value: "experimental", label: "Experimental practice", labelEs: "Práctica experimental" },
]

export const ARTIST_THEME_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "identity", label: "Identity", labelEs: "Identidad" },
  { value: "memory", label: "Memory", labelEs: "Memoria" },
  { value: "migration", label: "Migration", labelEs: "Migración" },
  { value: "environment", label: "Environment", labelEs: "Medio ambiente" },
  { value: "technology", label: "Technology", labelEs: "Tecnología" },
  { value: "spirituality", label: "Spirituality", labelEs: "Espiritualidad" },
  { value: "place", label: "Place", labelEs: "Lugar" },
  { value: "community", label: "Community", labelEs: "Comunidad" },
  { value: "politics", label: "Politics", labelEs: "Política" },
  { value: "history", label: "History", labelEs: "Historia" },
  { value: "gender", label: "Gender", labelEs: "Género" },
  { value: "labor", label: "Labor", labelEs: "Trabajo" },
  { value: "ecology", label: "Ecology", labelEs: "Ecología" },
  { value: "architecture", label: "Architecture", labelEs: "Arquitectura" },
  { value: "materiality", label: "Materiality", labelEs: "Materialidad" },
]

export const OPPORTUNITY_TYPE_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "grant", label: "Grant", labelEs: "Beca" },
  { value: "fellowship", label: "Fellowship", labelEs: "Fellowship" },
  { value: "residency", label: "Residency", labelEs: "Residencia" },
  { value: "exhibition", label: "Exhibition", labelEs: "Exposición" },
  { value: "open_call", label: "Open call", labelEs: "Convocatoria abierta" },
  { value: "commission", label: "Commission", labelEs: "Comisión" },
  { value: "competition", label: "Competition", labelEs: "Concurso" },
  { value: "prize_award", label: "Prize or award", labelEs: "Premio" },
  { value: "public_art", label: "Public art opportunity", labelEs: "Oportunidad de arte público" },
  { value: "publication", label: "Publication", labelEs: "Publicación" },
  { value: "research", label: "Research opportunity", labelEs: "Oportunidad de investigación" },
  { value: "professional_development", label: "Professional development", labelEs: "Desarrollo profesional" },
  { value: "workshop", label: "Workshop", labelEs: "Taller" },
  { value: "festival", label: "Festival", labelEs: "Festival" },
  { value: "screening", label: "Film screening", labelEs: "Proyección" },
  { value: "performance", label: "Performance opportunity", labelEs: "Oportunidad de performance" },
  { value: "vendor_market", label: "Vendor or market opportunity", labelEs: "Mercado o venta" },
]

function token(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

function optionIndex(options: ArtistTaxonomyOption[]) {
  const index = new Map<string, ArtistTaxonomyOption>()
  for (const option of options) {
    for (const candidate of [option.value, option.label, option.labelEs, ...(option.aliases ?? [])]) {
      index.set(token(candidate), option)
    }
  }
  return index
}

const disciplineByToken = optionIndex(ARTIST_DISCIPLINE_OPTIONS)
const mediumByToken = optionIndex(ARTIST_MEDIUM_MATERIAL_OPTIONS)

export function canonicalTaxonomyValue(value: string, options: ArtistTaxonomyOption[]) {
  const clean = value.trim().replace(/\s+/g, " ")
  if (!clean) return ""
  return optionIndex(options).get(token(clean))?.value ?? clean
}

export function taxonomyLabel(value: string, options: ArtistTaxonomyOption[], locale: "en" | "es" = "en") {
  const option = optionIndex(options).get(token(value))
  return option ? (locale === "es" ? option.labelEs : option.label) : value
}

export function canonicalDisciplineValue(value: string) {
  const clean = value.trim().replace(/\s+/g, " ")
  if (!clean) return ""
  return disciplineByToken.get(token(clean))?.value ?? clean
}

export function canonicalMediumValue(value: string) {
  const clean = value.trim().replace(/\s+/g, " ")
  if (!clean) return ""
  return mediumByToken.get(token(clean))?.value ?? clean
}

export function disciplineLabel(value: string, locale: "en" | "es" = "en") {
  const option = disciplineByToken.get(token(value))
  return option ? (locale === "es" ? option.labelEs : option.label) : value
}

export function normalizeArtistTerms(values: string[], kind: "discipline" | "medium" | "free" = "free") {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const entry of values) {
    const clean = entry.trim().replace(/\s+/g, " ")
    if (!clean) continue
    const value = kind === "discipline"
      ? canonicalDisciplineValue(clean)
      : kind === "medium"
        ? canonicalMediumValue(clean)
        : clean
    const key = token(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    normalized.push(value)
  }
  return normalized
}

export function parseArtistTerms(value: string, kind: "discipline" | "medium" | "free" = "free") {
  return normalizeArtistTerms(value.split(/[,;\n]/), kind)
}
