from pathlib import Path

path = Path("components/kleio/artist-document-intelligence.tsx")
text = path.read_text()
start = text.index("function AnalysisResultPanel({")
end = text.index("\nexport function ArtistDocumentIntelligence()", start)

replacement = r'''type AnalysisView = "overview" | "suggestions" | "details"

function AnalysisResultPanel({
  result,
  source,
  onPreview,
  onReanalyze,
  working,
}: {
  result: AnalysisResult
  source?: ArtistDocumentSource
  onPreview: () => void
  onReanalyze: () => void
  working: boolean
}) {
  const [view, setView] = useState<AnalysisView>("overview")
  const assessment = result.summary.document_assessment ?? {}
  const insight = result.summary.analysis_summary ?? {}
  const limitations = assessment.analysis_limitations ?? []
  const pagesAnalyzed = assessment.pages_analyzed?.length ?? 0
  const pagesTotal = assessment.total_pages ?? source?.page_count ?? 0
  const supportedCount = Number(result.summary.claim_count ?? result.claims.length ?? 0)
  const resolutionCount = Number(result.summary.conflict_count ?? 0) + Number(result.summary.unresolved_count ?? 0)
  const groupedCounts = Object.entries(result.summary.grouped_counts ?? {}).sort((left, right) => right[1] - left[1])
  const claimGroups = result.claims.reduce<Record<string, RepresentativeClaim[]>>((groups, claim) => {
    const key = claim.target_section || claim.claim_type || "document_finding"
    groups[key] = [...(groups[key] ?? []), claim]
    return groups
  }, {})
  const summaryItems = [
    [assessment.document_type ? titleCase(assessment.document_type) : "Document needs review", "Document"],
    [pagesTotal ? `${pagesAnalyzed}/${pagesTotal}` : "—", "Pages"],
    [String(supportedCount), "Suggestions"],
    [String(resolutionCount), "Needs attention"],
  ]
  const views: Array<{ id: AnalysisView; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "suggestions", label: "Suggestions", count: supportedCount },
    { id: "details", label: "Details & evidence", count: resolutionCount || undefined },
  ]

  return (
    <section className={`${panel} overflow-hidden`} aria-labelledby="latest-document-analysis-title">
      <header className="border-b border-[#E7E1F7] bg-[#FCFBFE] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Document analysis</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${qualityTone(result.summary.analysis_quality)}`}>
                {result.summary.analysis_quality === "complete_review_ready" || result.summary.analysis_quality === "substantial_review_ready"
                  ? <ShieldCheck className="size-3.5" />
                  : <AlertTriangle className="size-3.5" />}
                {qualityLabel(result.summary.analysis_quality)}
              </span>
            </div>
            <h2 id="latest-document-analysis-title" className="mt-2 truncate font-serif text-2xl font-semibold text-[#292631]">{result.filename}</h2>
            <p className="mt-1 text-sm text-[#746E80]">Private source · Gemini analysis · Artist approval required</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} onClick={onPreview} disabled={!source || working}><FileSearch className="size-4" />Open PDF</button>
            <button type="button" className={subtle} onClick={onReanalyze} disabled={!source || working}>{working ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white sm:grid-cols-4">
          {summaryItems.map(([value, label], index) => (
            <div key={label} className={`px-4 py-3 ${index % 2 ? "border-l border-[#E7E1F7]" : ""} ${index > 1 ? "border-t border-[#E7E1F7] sm:border-t-0 sm:border-l" : ""}`}>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#8A8296]">{label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-[#292631]">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="px-5 pt-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#F5F2FA] p-1" role="tablist" aria-label="Document analysis views">
          {views.map((item) => (
            <button
              key={item.id}
              id={`analysis-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              aria-controls={`analysis-panel-${item.id}`}
              onClick={() => setView(item.id)}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${view === item.id ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}
            >
              {item.label}
              {typeof item.count === "number" && <span className="rounded-full bg-[#EEE9F8] px-2 py-0.5 text-[0.67rem] text-[#5B4B8A]">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {view === "overview" && (
          <div id="analysis-panel-overview" role="tabpanel" aria-labelledby="analysis-tab-overview" className="mx-auto max-w-4xl space-y-5">
            <section aria-labelledby="document-synopsis-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="document-synopsis-title" className="font-serif text-xl font-semibold text-[#292631]">What KLEIO understood</h3>
                {insight.relevance && <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${insight.relevance === "not_relevant" ? "border-amber-200 bg-amber-50 text-amber-900" : insight.relevance === "highly_relevant" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#D8D0F2] bg-[#FCFBFE] text-[#625C70]"}`}>{titleCase(insight.relevance)}</span>}
              </div>
              <p className="mt-3 text-sm leading-7 text-[#4B4654]">{insight.document_synopsis || "KLEIO identified the document structure and prepared its supported information for review."}</p>
              {insight.relevance_explanation && <p className="mt-2 text-sm leading-6 text-[#746E80]">{insight.relevance_explanation}</p>}
            </section>

            {(insight.recommended_use?.length ?? 0) > 0 && (
              <section className="border-t border-[#EEEAF6] pt-4">
                <h3 className="text-sm font-semibold text-[#292631]">Recommended next use</h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#746E80]">{insight.recommended_use?.slice(0, 3).map((item, index) => <li key={index} className="flex gap-2"><span aria-hidden="true" className="text-[#75639E]">•</span><span>{item}</span></li>)}</ul>
              </section>
            )}

            <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${qualityTone(result.summary.analysis_quality)}`}>
              {result.summary.coverage_explanation || insight.coverage_explanation || "Review the supported findings before changing your Passport."}
            </div>

            <div className="flex flex-col gap-2 border-t border-[#EEEAF6] pt-5 sm:flex-row sm:items-center">
              <Link className={`${primary} sm:min-w-64`} href="/artist-dashboard/passport/review/"><FileCheck2 className="size-4" />Review suggested Passport updates</Link>
              <button type="button" className={secondary} onClick={() => setView("suggestions")}>Preview suggestions here</button>
            </div>
          </div>
        )}

        {view === "suggestions" && (
          <div id="analysis-panel-suggestions" role="tabpanel" aria-labelledby="analysis-tab-suggestions" className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2 border-b border-[#EEEAF6] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#292631]">Suggested Passport updates</h3>
                <p className="mt-1 text-sm leading-6 text-[#746E80]">Grouped by where the information may belong. Open only the sections you want to inspect.</p>
              </div>
              <Link className={secondary} href="/artist-dashboard/passport/review/">Open full review</Link>
            </div>

            {Object.keys(claimGroups).length > 0 ? (
              <div className="divide-y divide-[#EEEAF6]">
                {Object.entries(claimGroups).map(([group, claims], groupIndex) => (
                  <details key={group} className="group py-1" open={groupIndex === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-2 py-4 transition hover:bg-[#FCFBFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
                      <div>
                        <p className="text-sm font-semibold text-[#292631]">{titleCase(group)}</p>
                        <p className="mt-0.5 text-xs text-[#81788E]">{claims.length} visible suggestion{claims.length === 1 ? "" : "s"}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#75639E] group-open:hidden">View</span>
                      <span className="hidden text-xs font-semibold text-[#75639E] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-2 pb-4 pl-2 pr-2">
                      {claims.map((claim, index) => (
                        <article key={`${claim.claim_type}-${index}`} className="rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold leading-6 text-[#292631]">{claim.display_value}</p>
                            <p className="text-xs text-[#8A8296]">{claim.page_number ? `Page ${claim.page_number}` : "Page review required"}{typeof claim.confidence === "number" ? ` · ${Math.round(claim.confidence * 100)}%` : ""}</p>
                          </div>
                          {claim.evidence_excerpt && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View source evidence</summary>
                              <p className="mt-2 border-l-2 border-[#D8D0F2] pl-3 text-xs leading-5 text-[#746E80]">{claim.evidence_excerpt}</p>
                            </details>
                          )}
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FCFBFE] p-5 text-sm leading-6 text-[#746E80]">
                No representative suggestions are available in this preview. Open the full review to inspect all source-backed proposals.
              </div>
            )}

            {groupedCounts.length > Object.keys(claimGroups).length && (
              <p className="mt-4 text-xs leading-5 text-[#81788E]">The full review contains additional grouped findings that are intentionally not expanded here.</p>
            )}
          </div>
        )}

        {view === "details" && (
          <div id="analysis-panel-details" role="tabpanel" aria-labelledby="analysis-tab-details" className="mx-auto max-w-4xl space-y-5">
            <section>
              <h3 className="font-serif text-xl font-semibold text-[#292631]">Document details</h3>
              <dl className="mt-3 divide-y divide-[#EEEAF6] rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-4">
                {[
                  ["Detected type", assessment.document_type ? titleCase(assessment.document_type) : "Needs review"],
                  ["Relevance", insight.relevance ? titleCase(insight.relevance) : "Needs review"],
                  ["Page coverage", pagesTotal ? `${pagesAnalyzed} of ${pagesTotal} pages` : "Unavailable"],
                  ["Text quality", assessment.text_quality ? titleCase(assessment.text_quality) : "Unknown"],
                  ["Layout", assessment.layout_complexity ? titleCase(assessment.layout_complexity) : "Unknown"],
                  ["Sections mapped", String(result.summary.section_count ?? result.summary.sections?.length ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <dt className="text-xs font-semibold text-[#81788E]">{label}</dt>
                    <dd className="text-sm font-medium text-[#292631]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {(insight.extractable_information?.length ?? 0) > 0 && (
              <details className="rounded-xl border border-[#E7E1F7] bg-white px-4 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#292631]">Information categories KLEIO can audit</summary>
                <div className="mt-3 divide-y divide-[#EEEAF6]">
                  {insight.extractable_information?.map((item, index) => (
                    <div key={`${item.category}-${index}`} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#292631]">{item.category || "Document information"}</p>
                        {typeof item.confidence === "number" && <span className="text-xs font-semibold text-[#75639E]">{Math.round(item.confidence * 100)}%</span>}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#746E80]">{item.passport_or_application_use || "Artist review required before use."}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {limitations.length > 0 ? (
              <details className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4" open={resolutionCount > 0}>
                <summary className="cursor-pointer text-sm font-semibold text-amber-900">What needs attention ({limitations.length})</summary>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-950">{limitations.map((limitation, index) => <li key={index}>• {limitation}</li>)}</ul>
              </details>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">No document-level limitations were reported.</div>
            )}

            <p className="text-xs leading-5 text-[#81788E]">Evidence remains private. Nothing enters the Creative Passport until the artist confirms it in the full review.</p>
          </div>
        )}
      </div>
    </section>
  )
}
'''

text = text[:start] + replacement + text[end:]
text = text.replace(
    "The private PDF is safe, but Gemini document understanding is not configured. KLEIO did not claim a completed analysis.",
    "The private PDF is safe, but Gemini could not complete this analysis. Try Analyze again; KLEIO did not claim a completed result.",
)
path.write_text(text)
print("Applied compact document analysis review UI")
