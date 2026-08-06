from pathlib import Path

path = Path("components/kleio/artist-document-intelligence.tsx")
text = path.read_text()

replacements = [
    (
        "  AlertTriangle,\n  Check,\n  FileCheck2,",
        "  AlertTriangle,\n  ChevronDown,\n  ChevronUp,\n  Check,\n  Eraser,\n  FileCheck2,",
    ),
    (
        "  onPreview,\n  onReanalyze,\n  working,\n}: {\n  result: AnalysisResult\n  source?: ArtistDocumentSource\n  onPreview: () => void\n  onReanalyze: () => void\n  working: boolean\n}) {\n  const [view, setView] = useState<AnalysisView>(\"overview\")",
        "  onPreview,\n  onReanalyze,\n  onClearAnalysis,\n  onDelete,\n  working,\n}: {\n  result: AnalysisResult\n  source?: ArtistDocumentSource\n  onPreview: () => void\n  onReanalyze: () => void\n  onClearAnalysis: () => Promise<void>\n  onDelete: () => Promise<void>\n  working: boolean\n}) {\n  const [view, setView] = useState<AnalysisView>(\"overview\")\n  const [collapsed, setCollapsed] = useState(false)\n  const [confirmAction, setConfirmAction] = useState<\"clear\" | \"delete\" | null>(null)",
    ),
    (
        "  const views: Array<{ id: AnalysisView; label: string; count?: number }> = [\n    { id: \"overview\", label: \"Overview\" },\n    { id: \"suggestions\", label: \"Suggestions\", count: supportedCount },\n    { id: \"details\", label: \"Details & evidence\", count: resolutionCount || undefined },\n  ]\n\n  return (",
        "  const views: Array<{ id: AnalysisView; label: string; count?: number }> = [\n    { id: \"overview\", label: \"Overview\" },\n    { id: \"suggestions\", label: \"Suggestions\", count: supportedCount },\n    { id: \"details\", label: \"Details & evidence\", count: resolutionCount || undefined },\n  ]\n\n  async function confirmDocumentAction() {\n    const action = confirmAction\n    if (!action || working) return\n    setConfirmAction(null)\n    if (action === \"clear\") await onClearAnalysis()\n    else await onDelete()\n  }\n\n  return (",
    ),
    (
        "          <div className=\"flex flex-wrap gap-2\">\n            <button type=\"button\" className={secondary} onClick={onPreview} disabled={!source || working}><FileSearch className=\"size-4\" />Open PDF</button>\n            <button type=\"button\" className={subtle} onClick={onReanalyze} disabled={!source || working}>{working ? <Loader2 className=\"size-4 animate-spin\" /> : <RefreshCcw className=\"size-4\" />}Analyze again</button>\n          </div>",
        "          <div className=\"flex flex-wrap gap-2\">\n            <button\n              type=\"button\"\n              className={secondary}\n              aria-expanded={!collapsed}\n              aria-controls=\"document-analysis-content\"\n              onClick={() => setCollapsed((current) => !current)}\n            >\n              {collapsed ? <ChevronDown className=\"size-4\" /> : <ChevronUp className=\"size-4\" />}\n              {collapsed ? \"Expand results\" : \"Collapse results\"}\n            </button>\n            <button type=\"button\" className={secondary} onClick={onPreview} disabled={!source || working}><FileSearch className=\"size-4\" />Open PDF</button>\n          </div>",
    ),
    (
        "        <dl className=\"mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white sm:grid-cols-4\">",
        "        {!collapsed && (\n        <dl className=\"mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white sm:grid-cols-4\">",
    ),
    (
        "        </dl>\n      </header>\n\n      <div className=\"px-5 pt-4 sm:px-6\">",
        "        </dl>\n        )}\n      </header>\n\n      {confirmAction && (\n        <div role=\"alertdialog\" aria-modal=\"false\" aria-labelledby=\"document-action-confirmation-title\" className={`border-b px-5 py-4 sm:px-6 ${confirmAction === \"delete\" ? \"border-red-200 bg-red-50\" : \"border-amber-200 bg-amber-50\"}`}>\n          <div className=\"mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">\n            <div>\n              <p id=\"document-action-confirmation-title\" className={`text-sm font-semibold ${confirmAction === \"delete\" ? \"text-red-900\" : \"text-amber-950\"}`}>\n                {confirmAction === \"delete\" ? `Delete ${result.filename}?` : \"Clear this analysis?\"}\n              </p>\n              <p className={`mt-1 text-xs leading-5 ${confirmAction === \"delete\" ? \"text-red-800\" : \"text-amber-900\"}`}>\n                {confirmAction === \"delete\"\n                  ? \"This permanently removes the private PDF and its analysis from your document library.\"\n                  : \"This removes Gemini analysis and unconfirmed suggestions. The original PDF stays private in your library.\"}\n              </p>\n            </div>\n            <div className=\"flex flex-col gap-2 sm:flex-row\">\n              <button type=\"button\" className={secondary} onClick={() => setConfirmAction(null)} disabled={working}>Keep it</button>\n              <button\n                type=\"button\"\n                className={confirmAction === \"delete\" ? \"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:opacity-50\" : primary}\n                onClick={() => void confirmDocumentAction()}\n                disabled={working}\n              >\n                {working ? <Loader2 className=\"size-4 animate-spin\" /> : confirmAction === \"delete\" ? <Trash2 className=\"size-4\" /> : <Eraser className=\"size-4\" />}\n                {confirmAction === \"delete\" ? \"Delete PDF\" : \"Clear analysis\"}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      <div className=\"border-b border-[#EEEAF6] bg-white px-5 py-3 sm:px-6\">\n        <div className=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">\n          <div>\n            <p className=\"text-xs font-semibold text-[#292631]\">Document controls</p>\n            <p className=\"mt-0.5 text-xs leading-5 text-[#81788E]\">Clear only the analysis, or delete the PDF entirely.</p>\n          </div>\n          <div className=\"grid gap-2 sm:flex sm:flex-wrap\">\n            <button type=\"button\" className={subtle} onClick={onReanalyze} disabled={!source || working}>{working ? <Loader2 className=\"size-4 animate-spin\" /> : <RefreshCcw className=\"size-4\" />}Analyze again</button>\n            <button type=\"button\" className={subtle} onClick={() => setConfirmAction(\"clear\")} disabled={!source || working}><Eraser className=\"size-4\" />Clear analysis</button>\n            <button type=\"button\" className=\"inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-50\" onClick={() => setConfirmAction(\"delete\")} disabled={!source || working}><Trash2 className=\"size-4\" />Delete PDF</button>\n          </div>\n        </div>\n      </div>\n\n      {!collapsed && (\n      <div id=\"document-analysis-content\">\n      <div className=\"px-5 pt-4 sm:px-6\">",
    ),
    (
        "        )}\n      </div>\n    </section>\n  )\n}",
        "        )}\n      </div>\n      </div>\n      )}\n    </section>\n  )\n}",
    ),
    (
        "        <AnalysisResultPanel\n          result={displayedResult}\n          source={resultSource}\n          onPreview={() => resultSource && void preview(resultSource)}\n          onReanalyze={() => resultSource && void reanalyze(resultSource)}\n          working={Boolean(resultSource && workingId === resultSource.id)}\n        />",
        "        <AnalysisResultPanel\n          key={displayedResult.sourceId}\n          result={displayedResult}\n          source={resultSource}\n          onPreview={() => resultSource && void preview(resultSource)}\n          onReanalyze={() => resultSource && void reanalyze(resultSource)}\n          onClearAnalysis={() => resultSource ? stopAnalysis(resultSource) : Promise.resolve()}\n          onDelete={() => resultSource ? removeSource(resultSource) : Promise.resolve()}\n          working={Boolean(resultSource && workingId === resultSource.id)}\n        />",
    ),
    (
        "                    {!source.keep_without_analysis && <button type=\"button\" className={subtle} disabled={Boolean(workingId)} onClick={() => void stopAnalysis(source)}>Remove analysis</button>}\n                    <button type=\"button\" className=\"inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50\" disabled={Boolean(workingId)} onClick={() => void removeSource(source)}><Trash2 className=\"size-4\" />Delete source</button>",
        "                    {!source.keep_without_analysis && <button type=\"button\" className={subtle} disabled={Boolean(workingId)} onClick={() => void stopAnalysis(source)}><Eraser className=\"size-4\" />Clear analysis</button>}\n                    <button type=\"button\" className=\"inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50\" disabled={Boolean(workingId)} onClick={() => void removeSource(source)}><Trash2 className=\"size-4\" />Delete PDF</button>",
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match, found {count}: {old[:120]!r}")
    text = text.replace(old, new, 1)

path.write_text(text)
