export type ControlledOption = { value: string; label: string; labelEs?: string }

export const INSTITUTION_TYPES: ControlledOption[] = [
  { value: "museum", label: "Museum", labelEs: "Museo" },
  { value: "gallery", label: "Gallery", labelEs: "Galería" },
  { value: "arts_nonprofit", label: "Arts nonprofit", labelEs: "Organización artística sin fines de lucro" },
  { value: "foundation", label: "Foundation", labelEs: "Fundación" },
  { value: "residency", label: "Residency", labelEs: "Residencia" },
  { value: "university_college", label: "University or college", labelEs: "Universidad o colegio" },
  { value: "cultural_organization", label: "Cultural organization", labelEs: "Organización cultural" },
  { value: "government_arts_agency", label: "Government arts agency", labelEs: "Agencia pública de artes" },
  { value: "independent_curatorial_organization", label: "Independent curatorial organization", labelEs: "Organización curatorial independiente" },
  { value: "festival_biennial", label: "Festival or biennial", labelEs: "Festival o bienal" },
  { value: "artist_run_organization", label: "Artist-run organization", labelEs: "Organización dirigida por artistas" },
  { value: "other", label: "Other", labelEs: "Otra" },
]

export const OPPORTUNITY_TYPES: ControlledOption[] = [
  { value: "open_call", label: "Open call", labelEs: "Convocatoria abierta" },
  { value: "grant", label: "Grant", labelEs: "Beca" },
  { value: "residency", label: "Residency", labelEs: "Residencia" },
  { value: "exhibition", label: "Exhibition", labelEs: "Exposición" },
  { value: "commission", label: "Commission", labelEs: "Comisión" },
  { value: "fellowship", label: "Fellowship", labelEs: "Fellowship" },
  { value: "prize_award", label: "Prize or award", labelEs: "Premio" },
  { value: "public_art", label: "Public art opportunity", labelEs: "Oportunidad de arte público" },
  { value: "acquisition", label: "Acquisition", labelEs: "Adquisición" },
  { value: "research", label: "Research opportunity", labelEs: "Oportunidad de investigación" },
  { value: "professional_development", label: "Professional development", labelEs: "Desarrollo profesional" },
  { value: "other", label: "Other", labelEs: "Otra" },
]

export const PARTICIPATION_FORMATS: ControlledOption[] = [
  { value: "in_person", label: "In person", labelEs: "Presencial" },
  { value: "online", label: "Online", labelEs: "En línea" },
  { value: "hybrid", label: "Hybrid", labelEs: "Híbrido" },
  { value: "other", label: "Other", labelEs: "Otro" },
]

export const CAREER_STAGES: ControlledOption[] = [
  { value: "all", label: "All career stages", labelEs: "Todas las etapas profesionales" },
  { value: "emerging", label: "Emerging", labelEs: "Emergente" },
  { value: "mid_career", label: "Mid-career", labelEs: "Trayectoria media" },
  { value: "established", label: "Established", labelEs: "Consolidada" },
  { value: "student", label: "Student", labelEs: "Estudiante" },
]

export const GEOGRAPHIC_SCOPES: ControlledOption[] = [
  { value: "international", label: "International", labelEs: "Internacional" },
  { value: "country", label: "Selected country", labelEs: "País seleccionado" },
  { value: "region", label: "Selected state or region", labelEs: "Estado o región seleccionada" },
  { value: "local", label: "Selected city or locality", labelEs: "Ciudad o localidad seleccionada" },
  { value: "remote", label: "Remote participation", labelEs: "Participación remota" },
]

export const DISCIPLINES: ControlledOption[] = [
  "Visual arts", "Painting", "Drawing", "Sculpture", "Photography", "Film and video", "Installation", "Performance", "New media", "Digital art", "Sound art", "Public art", "Social practice", "Craft", "Design", "Architecture", "Curatorial practice", "Writing and publishing", "Interdisciplinary",
].map((label) => ({ value: label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label }))

export const MEDIUMS: ControlledOption[] = [
  "Acrylic", "Oil", "Watercolor", "Ink", "Graphite", "Charcoal", "Mixed media", "Photography", "Digital image", "Video", "Film", "Sound", "Textile", "Ceramics", "Glass", "Metal", "Wood", "Paper", "Printmaking", "Found objects", "Light", "Code", "Virtual reality", "Augmented reality", "Performance", "Installation",
].map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label }))

export const LANGUAGES: ControlledOption[] = [
  "English", "Spanish", "French", "Portuguese", "German", "Italian", "Arabic", "Mandarin Chinese", "Cantonese", "Japanese", "Korean", "Hindi", "Bengali", "Russian", "Ukrainian", "Dutch", "Swedish", "Norwegian", "Danish", "Polish", "Turkish", "Hebrew", "Swahili", "Haitian Creole",
].map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label }))

export const REQUIRED_MATERIALS: ControlledOption[] = [
  { value: "artist_bio", label: "Artist biography" },
  { value: "artist_statement", label: "Artist statement" },
  { value: "cv", label: "CV or résumé" },
  { value: "portfolio", label: "Portfolio" },
  { value: "project_proposal", label: "Project proposal" },
  { value: "budget", label: "Budget" },
  { value: "timeline", label: "Project timeline" },
  { value: "references", label: "References" },
  { value: "work_samples", label: "Work samples" },
]

export function optionLabel(options: ControlledOption[], value: string, locale: "en" | "es" = "en") {
  const option = options.find((entry) => entry.value === value)
  return locale === "es" ? option?.labelEs ?? option?.label ?? value : option?.label ?? value
}
