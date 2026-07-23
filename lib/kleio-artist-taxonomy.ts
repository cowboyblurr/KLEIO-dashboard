export type ArtistTaxonomyOption = {
  value: string
  label: string
  labelEs: string
}

export const ARTIST_DISCIPLINE_OPTIONS: ArtistTaxonomyOption[] = [
  { value: "painting", label: "Painting", labelEs: "Pintura" },
  { value: "drawing", label: "Drawing", labelEs: "Dibujo" },
  { value: "sculpture", label: "Sculpture", labelEs: "Escultura" },
  { value: "photography", label: "Photography", labelEs: "Fotografía" },
  { value: "film", label: "Film", labelEs: "Cine" },
  { value: "video", label: "Video", labelEs: "Video" },
  { value: "digital_art", label: "Digital art", labelEs: "Arte digital" },
  { value: "new_media", label: "New media", labelEs: "Nuevos medios" },
  { value: "installation", label: "Installation", labelEs: "Instalación" },
  { value: "performance", label: "Performance", labelEs: "Performance" },
  { value: "sound_art", label: "Sound art", labelEs: "Arte sonoro" },
  { value: "printmaking", label: "Printmaking", labelEs: "Grabado" },
  { value: "illustration", label: "Illustration", labelEs: "Ilustración" },
  { value: "textile_fiber_art", label: "Textile and fiber art", labelEs: "Arte textil y de fibras" },
  { value: "ceramics", label: "Ceramics", labelEs: "Cerámica" },
  { value: "mixed_media", label: "Mixed media", labelEs: "Técnica mixta" },
  { value: "public_art", label: "Public art", labelEs: "Arte público" },
  { value: "social_practice", label: "Social practice", labelEs: "Práctica social" },
  { value: "conceptual_art", label: "Conceptual art", labelEs: "Arte conceptual" },
  { value: "design", label: "Design", labelEs: "Diseño" },
  { value: "architecture", label: "Architecture", labelEs: "Arquitectura" },
  { value: "writing", label: "Writing", labelEs: "Escritura" },
  { value: "curatorial_practice", label: "Curatorial practice", labelEs: "Práctica curatorial" },
  { value: "interdisciplinary_practice", label: "Interdisciplinary practice", labelEs: "Práctica interdisciplinaria" },
]

const optionByToken = new Map<string, ArtistTaxonomyOption>()

function token(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

for (const option of ARTIST_DISCIPLINE_OPTIONS) {
  optionByToken.set(token(option.value), option)
  optionByToken.set(token(option.label), option)
  optionByToken.set(token(option.labelEs), option)
}

export function canonicalDisciplineValue(value: string) {
  const clean = value.trim().replace(/\s+/g, " ")
  if (!clean) return ""
  return optionByToken.get(token(clean))?.value ?? clean
}

export function disciplineLabel(value: string, locale: "en" | "es" = "en") {
  const option = optionByToken.get(token(value))
  return option ? (locale === "es" ? option.labelEs : option.label) : value
}

export function normalizeArtistTerms(values: string[], kind: "discipline" | "free" = "free") {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const entry of values) {
    const clean = entry.trim().replace(/\s+/g, " ")
    if (!clean) continue
    const value = kind === "discipline" ? canonicalDisciplineValue(clean) : clean
    const key = token(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    normalized.push(value)
  }
  return normalized
}

export function parseArtistTerms(value: string, kind: "discipline" | "free" = "free") {
  return normalizeArtistTerms(value.split(/[,;\n]/), kind)
}
