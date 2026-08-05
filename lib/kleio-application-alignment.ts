import type { ExtendedArtistPassport, OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"

export type ApplicationAlignmentEvidence = {
  theme: string
  opportunitySource: string
  artistSource: "artist_statement" | "biography" | "practice_description" | "artwork_description"
  artistSourceLabel: string
  artistEvidence: string
  confidence: "strong" | "moderate" | "weak"
  supported: boolean
}

export type ApplicationAlignmentDraft = {
  introduction: string
  evidence: ApplicationAlignmentEvidence[]
  missingContext: string[]
}

const themeFamilies: Array<{ label: string; terms: string[] }> = [
  { label: "memory and archives", terms: ["memory", "memories", "archive", "archives", "archival", "history", "histories", "inheritance", "inherited"] },
  { label: "identity and belonging", terms: ["identity", "belonging", "diaspora", "migration", "home", "place", "ancestry"] },
  { label: "material transformation", terms: ["material", "materials", "transformation", "process", "craft", "making", "remediation"] },
  { label: "community and public life", terms: ["community", "public", "collective", "social", "participation", "civic"] },
  { label: "environment and ecology", terms: ["environment", "ecology", "ecological", "climate", "land", "water", "nature"] },
  { label: "technology and mediation", terms: ["technology", "digital", "media", "virtual", "machine", "interface", "network"] },
  { label: "body and performance", terms: ["body", "embodiment", "performance", "gesture", "movement", "somatic"] },
]

const stopWords = new Set(["this", "that", "with", "from", "into", "through", "their", "there", "where", "which", "about", "artist", "artists", "work", "works", "application", "opportunity", "program", "project", "selected"])

function normalizedTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-|-$/g, ""))
    .filter((token) => token.length > 3 && !stopWords.has(token))
}

function containsTerm(text: string, term: string) {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)
}

function excerpt(value: string, matchedTerms: string[], maximum = 220) {
  const clean = value.replace(/\s+/g, " ").trim()
  if (!clean) return ""
  const sentences = clean.split(/(?<=[.!?])\s+/)
  const matched = sentences.find((sentence) => matchedTerms.some((term) => containsTerm(sentence, term))) || sentences[0] || clean
  return matched.length <= maximum ? matched : `${matched.slice(0, maximum - 1).trim()}…`
}

function opportunityText(item: OpportunityDirectoryItem) {
  return [
    item.title,
    item.summary,
    item.description,
    ...item.required_materials,
    ...item.requirements.flatMap((requirement) => [requirement.label, requirement.source_text]),
  ].filter(Boolean).join(" ")
}

function artistSources(passport: ExtendedArtistPassport | null, works: PortfolioWorkRecord[]) {
  return [
    { kind: "artist_statement" as const, label: "approved artist statement", value: passport?.artist_statement ?? "" },
    { kind: "biography" as const, label: "approved biography", value: passport?.bio ?? "" },
    { kind: "practice_description" as const, label: "approved practice description", value: passport?.practice_description ?? "" },
    ...works.map((work) => ({ kind: "artwork_description" as const, label: `approved description of “${work.title || "selected work"}”`, value: work.description ?? "" })),
  ].filter((source) => source.value.trim())
}

function genericSharedTerms(opportunity: string, artist: string) {
  const opportunityTokens = new Set(normalizedTokens(opportunity))
  const artistTokens = new Set(normalizedTokens(artist))
  return [...opportunityTokens].filter((token) => artistTokens.has(token)).slice(0, 4)
}

export function buildApplicationAlignmentDraft(
  item: OpportunityDirectoryItem,
  passport: ExtendedArtistPassport | null,
  selectedWorks: PortfolioWorkRecord[],
): ApplicationAlignmentDraft {
  const sourceText = opportunityText(item)
  const sources = artistSources(passport, selectedWorks)
  const evidence: ApplicationAlignmentEvidence[] = []

  for (const family of themeFamilies) {
    const opportunityTerms = family.terms.filter((term) => containsTerm(sourceText, term))
    if (!opportunityTerms.length) continue
    const matchingSource = sources
      .map((source) => ({ source, terms: family.terms.filter((term) => containsTerm(source.value, term)) }))
      .sort((a, b) => b.terms.length - a.terms.length)[0]
    const supported = Boolean(matchingSource?.terms.length)
    evidence.push({
      theme: family.label,
      opportunitySource: excerpt(sourceText, opportunityTerms),
      artistSource: matchingSource?.source.kind ?? "artist_statement",
      artistSourceLabel: matchingSource?.source.label ?? "No approved artist evidence found",
      artistEvidence: supported ? excerpt(matchingSource.source.value, matchingSource.terms) : "",
      confidence: supported && matchingSource.terms.length >= 2 ? "strong" : supported ? "moderate" : "weak",
      supported,
    })
  }

  if (!evidence.length && sources.length) {
    const best = sources
      .map((source) => ({ source, terms: genericSharedTerms(sourceText, source.value) }))
      .sort((a, b) => b.terms.length - a.terms.length)[0]
    if (best?.terms.length) {
      evidence.push({
        theme: best.terms.join(", "),
        opportunitySource: excerpt(sourceText, best.terms),
        artistSource: best.source.kind,
        artistSourceLabel: best.source.label,
        artistEvidence: excerpt(best.source.value, best.terms),
        confidence: best.terms.length >= 2 ? "moderate" : "weak",
        supported: true,
      })
    }
  }

  const supported = evidence.filter((item) => item.supported).slice(0, 2)
  const missingContext: string[] = []
  if (!passport?.professional_name?.trim()) missingContext.push("Add the artist’s professional name before generating the final email.")
  if (!supported.length) missingContext.push("KLEIO could not find a defensible thematic connection in the approved Passport. Ask the artist to add opportunity-specific context rather than inventing one.")
  if (!selectedWorks.length) missingContext.push("Select at least one work so the introduction can reference the actual application package.")

  if (!supported.length || !passport?.professional_name?.trim()) {
    return { introduction: "", evidence, missingContext }
  }

  const artistName = passport.professional_name.trim()
  const firstWork = selectedWorks.find((work) => work.title.trim())
  const themePhrase = supported.map((item) => item.theme).join(" and ")
  const evidenceSentence = supported.length === 1
    ? `This focus relates to my practice as described in my ${supported[0].artistSourceLabel}.`
    : `These priorities connect with the concerns documented in my ${supported[0].artistSourceLabel} and ${supported[1].artistSourceLabel}.`
  const workSentence = firstWork
    ? `The selected works, including “${firstWork.title.trim()},” extend this relationship through the materials and context presented in the application.`
    : "The selected materials extend this relationship through the work presented in the application."

  return {
    introduction: [
      `Hello,`,
      `I am pleased to submit my application for ${item.title}. The opportunity’s focus on ${themePhrase} relates directly to the approved information in my Creative Passport.`,
      evidenceSentence,
      workSentence,
      `My application materials are attached and available through the secure KLEIO review link for your consideration. Thank you for reviewing my submission.`,
      `Best,`,
      artistName,
    ].join("\n\n"),
    evidence,
    missingContext,
  }
}
