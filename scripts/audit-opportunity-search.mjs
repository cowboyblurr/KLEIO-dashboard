import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://trekynurdgxgtaaqqtyq.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required for the opportunity search audit.")
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const ceramicsIds = new Set([
  "goethe-confluence-of-myths-residency-2026",
  "mexico-fonart-grandes-maestros-2026",
  "mexico-fonart-nacimientos-2026",
])

const defaultArguments = {
  opportunity_types: null,
  source_slugs: null,
  applicant_types: null,
  eligible_country: null,
  participation_formats: null,
  discipline_filters: null,
  career_stage_filters: null,
  deadline_from: null,
  deadline_to: null,
  minimum_funding: null,
  funding_known_only: false,
  structured_requirements_only: false,
  no_fee_only: false,
  external_only: false,
  limit_count: 100,
  offset_count: 0,
}

async function search(query) {
  const { data, error } = await supabase.rpc("search_opportunities_v2", {
    search_query: query,
    ...defaultArguments,
  })
  if (error) throw new Error(`${query}: ${error.message}`)
  return data ?? []
}

async function interpret(query) {
  const { data, error } = await supabase.rpc("interpret_opportunity_search_query", {
    input_query: query,
  })
  if (error) throw new Error(`${query}: ${error.message}`)
  return data
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertRowsAreCeramics(query, rows) {
  assert(rows.length > 0, `${query}: expected at least one verified ceramics result.`)
  assert(
    rows.every((row) => Array.isArray(row.disciplines) && row.disciplines.includes("Ceramics")),
    `${query}: returned a record without verified Ceramics taxonomy.`,
  )
}

function assertAllKnownCeramics(query, rows) {
  assert(rows.length >= ceramicsIds.size, `${query}: expected at least ${ceramicsIds.size} verified ceramics results.`)
  for (const expectedId of ceramicsIds) {
    assert(rows.some((row) => row.external_id === expectedId), `${query}: missing ${expectedId}.`)
  }
  assertRowsAreCeramics(query, rows)
}

const broadPracticeQueries = [
  "pottery",
  "pottery opportunities",
  "looking for pottery opportunities",
  "ceramic opportunities",
  "ceramics grants",
  "grants for potters",
  "potery opportunities",
  "cermaics grants",
  "alfarería oportunidades",
  "陶芸",
]

for (const query of broadPracticeQueries) {
  const rows = await search(query)
  assertAllKnownCeramics(query, rows)
}

for (const query of ["clay residencies", "poterie résidence"]) {
  const rows = await search(query)
  assertRowsAreCeramics(query, rows)
  assert(
    rows[0]?.external_id === "goethe-confluence-of-myths-residency-2026",
    `${query}: the verified ceramics residency must rank first.`,
  )
  assert(
    rows.every((row) => row.opportunity_type === "residency"),
    `${query}: exact residency results should be preferred over broader ceramics matches.`,
  )
}

const competitionRows = await search("porcelain competitions")
assertRowsAreCeramics("porcelain competitions", competitionRows)
assert(
  competitionRows[0]?.opportunity_type === "prize_award",
  "porcelain competitions: a ceramics prize or award must rank first.",
)
assert(
  competitionRows.every((row) => row.opportunity_type === "prize_award"),
  "porcelain competitions: exact competition results should be preferred over broader ceramics matches.",
)

const overlapInterpretation = await interpret("ceramic sculpture open calls")
assert(
  JSON.stringify(overlapInterpretation?.canonical_disciplines) === JSON.stringify(["Ceramics"]),
  "ceramic sculpture: the phrase must not be broadened into an unrelated standalone Sculpture discipline.",
)

const typoInterpretation = await interpret("cermaics grants")
assert(
  typoInterpretation?.corrections?.some((item) => item.input === "cermaics" && item.canonical_value === "Ceramics"),
  "cermaics grants: typo correction was not explained.",
)

const filmmakerInterpretation = await interpret("opportunities for a filmmaker in Jamaica")
assert(
  filmmakerInterpretation?.canonical_disciplines?.includes("Film"),
  "filmmaker: the query was not mapped to Film.",
)
assert(
  filmmakerInterpretation?.locations?.includes("Jamaica"),
  "Jamaica: the location was not interpreted.",
)

const protectedRows = await search("pottery")
assert(
  protectedRows.every((row) => !["needs_review", "expired", "rejected"].includes(row.verification_status)),
  "pottery: protected or expired records were returned.",
)

console.log(JSON.stringify({
  status: "passed",
  broad_queries: broadPracticeQueries.length,
  pottery_result_ids: protectedRows.map((row) => row.external_id),
  residency_first: (await search("clay residencies"))[0]?.external_id,
  competition_first: competitionRows[0]?.external_id,
  interpretation: await interpret("looking for pottery opportunities"),
}, null, 2))
