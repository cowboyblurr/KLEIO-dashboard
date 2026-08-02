import type { InstagramPreparedItem } from "@/lib/kleio-instagram-import"

export type PracticeInsightKey = "themes" | "visual" | "mood" | "mediums" | "disciplines" | "tags" | "opportunities"
export type PracticeInsight = {
  id: PracticeInsightKey
  label: string
  value: string
  source: string
  selected: boolean
  dismissed: boolean
}

export function splitInsightList(value: string) {
  return value.split(/[,;\n|]/).map((item) => item.trim()).filter(Boolean)
}

export function uniqueInsightValues(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function matchingLabels(text: string, dictionary: Record<string, string[]>) {
  const normalized = text.toLowerCase()
  return Object.entries(dictionary)
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([label]) => label)
}

export function buildInstagramPracticeInsights(items: InstagramPreparedItem[]): PracticeInsight[] {
  const text = items.map((item) => [
    item.caption,
    item.fields.title.value,
    item.fields.medium.value,
    item.fields.series.value,
    item.fields.description.value,
    item.fields.tags.value,
  ].join(" ")).join(" ")

  const mediums = uniqueInsightValues(items.flatMap((item) => splitInsightList(item.fields.medium.value))).slice(0, 6)
  const tags = uniqueInsightValues(items.flatMap((item) => splitInsightList(item.fields.tags.value))).slice(0, 10)
  const themes = uniqueInsightValues([
    ...matchingLabels(text, {
      Identity: ["identity", "selfhood", "portrait", "body"],
      Memory: ["memory", "remember", "archive", "ancestral"],
      Place: ["place", "landscape", "home", "city", "urban", "geography"],
      Community: ["community", "collective", "family", "kinship"],
      Migration: ["migration", "diaspora", "displacement", "border"],
      Ecology: ["ecology", "environment", "nature", "climate", "botanical"],
      Technology: ["technology", "digital", "machine", "internet", "virtual"],
      Ritual: ["ritual", "spiritual", "ceremony", "sacred"],
      Materiality: ["material", "texture", "surface", "process"],
      Abstraction: ["abstract", "abstraction", "nonrepresentational"],
    }),
    ...tags.filter((tag) => tag.length <= 28),
  ]).slice(0, 8)

  const visual = uniqueInsightValues(matchingLabels(text, {
    Figurative: ["figurative", "portrait", "figure", "body"],
    Abstract: ["abstract", "abstraction", "geometric"],
    Documentary: ["documentary", "observational", "journalistic"],
    Archival: ["archive", "archival", "found image", "ephemera"],
    Cinematic: ["cinematic", "film still", "sequence"],
    Minimal: ["minimal", "reduced", "spare"],
    Layered: ["layered", "collage", "assemblage"],
    Gestural: ["gestural", "brushwork", "mark making"],
    "Text-based": ["text-based", "language", "typography", "poetry"],
    Sculptural: ["sculptural", "three-dimensional", "installation"],
  })).slice(0, 6)

  const mood = uniqueInsightValues(matchingLabels(text, {
    Intimate: ["intimate", "personal", "vulnerable"],
    Contemplative: ["contemplative", "meditative", "reflective", "quiet"],
    Atmospheric: ["atmospheric", "dreamlike", "ethereal"],
    Playful: ["playful", "humor", "whimsical"],
    Tense: ["tense", "uneasy", "friction", "conflict"],
    Melancholic: ["melancholic", "grief", "loss", "mourning"],
    Vibrant: ["vibrant", "energetic", "saturated"],
    Surreal: ["surreal", "uncanny", "fantastical"],
  })).slice(0, 5)

  const disciplineText = `${text} ${mediums.join(" ")}`
  const disciplines = uniqueInsightValues(matchingLabels(disciplineText, {
    Photography: ["photography", "photograph", "photo"],
    Painting: ["painting", "paint", "oil", "acrylic", "watercolor"],
    Drawing: ["drawing", "graphite", "charcoal", "ink"],
    Sculpture: ["sculpture", "sculptural", "bronze", "wood", "stone"],
    Ceramics: ["ceramic", "clay", "porcelain", "stoneware"],
    "Mixed media": ["mixed media", "collage", "assemblage"],
    Installation: ["installation", "site-specific"],
    "Film and moving image": ["film", "video", "moving image"],
    Performance: ["performance", "performative"],
    "Digital media": ["digital", "3d", "generative", "interactive"],
    "Textile and fiber": ["textile", "fiber", "fabric", "weaving"],
    Printmaking: ["printmaking", "screenprint", "lithograph", "etching"],
  })).slice(0, 6)

  const opportunityCategories = uniqueInsightValues([
    ...disciplines.slice(0, 3).map((discipline) => `${discipline}-focused opportunities`),
    ...(themes.length ? ["Theme-aligned exhibitions and open calls"] : []),
  ]).slice(0, 6)

  const source = "Suggested from Instagram captions, dates, tags, and artwork details. Artist confirmation is required."
  const candidates: Array<[PracticeInsightKey, string, string[]]> = [
    ["themes", "Recurring themes", themes],
    ["visual", "Visual language", visual],
    ["mood", "Mood and feeling", mood],
    ["mediums", "Common mediums", mediums],
    ["disciplines", "Suggested disciplines", disciplines],
    ["tags", "Suggested profile tags", uniqueInsightValues([...tags, ...themes, ...visual, ...mood]).slice(0, 10)],
    ["opportunities", "Potential opportunity categories", opportunityCategories],
  ]

  return candidates
    .filter(([, , values]) => values.length > 0)
    .map(([id, label, values]) => ({ id, label, value: values.join(", "), source, selected: false, dismissed: false }))
}

export function confirmedInsightSummary(insights: PracticeInsight[]) {
  const selected = insights.filter((item) => item.selected && !item.dismissed && item.value.trim())
  const byId = new Map(selected.map((item) => [item.id, item.value.trim()]))
  return [
    byId.get("themes") ? `Confirmed themes: ${byId.get("themes")}.` : "",
    byId.get("visual") ? `Visual language: ${byId.get("visual")}.` : "",
    byId.get("mood") ? `Mood and feeling: ${byId.get("mood")}.` : "",
    byId.get("tags") ? `Related practice terms: ${byId.get("tags")}.` : "",
  ].filter(Boolean).join(" ")
}
