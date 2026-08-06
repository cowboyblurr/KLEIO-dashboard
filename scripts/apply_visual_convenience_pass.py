from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text()
    next_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{path}: expected one regex match, found {count}: {pattern[:100]!r}")
    file.write_text(next_text)


# Creative Passport: keep the outer edit header useful but materially smaller.
replace_once(
    "components/kleio/creative-passport-workspace.tsx",
    'const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A]"',
    'const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A]"\nconst compact = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"',
)
regex_once(
    "components/kleio/creative-passport-workspace.tsx",
    r'''        <div className="shrink-0 border-b border-\[#EEEAF6\] px-4 py-3 sm:px-6">.*?        </div>\n        <div className="min-h-0 flex-1"><AdaptiveArtistPassportExperience /></div>''',
    '''        <div className="shrink-0 border-b border-[#EEEAF6] bg-white px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">Creative Passport</p>
              <p className="truncate text-xs text-[#746E80]">Editing your reusable artist record</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className={compact} onClick={() => setGuidanceOpen((value) => !value)} aria-expanded={guidanceOpen}><ChevronDown className={`size-3.5 transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />Why it matters</button>
              <button type="button" className={compact} onClick={() => { setRevision((value) => value + 1); setMode("overview") }}><LayoutDashboard className="size-3.5" />Overview</button>
            </div>
          </div>
          {guidanceOpen && <div className="mx-auto mt-2 max-w-[1180px] rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-xs leading-5 text-[#5F5968]">The Creative Passport is your artist-approved source record. KLEIO can reuse it for readiness and drafts, but nothing becomes approved without your review.</div>}
        </div>
        <div className="min-h-0 flex-1"><AdaptiveArtistPassportExperience /></div>''',
)

# Creative Passport: collapse the large workflow chooser into a slim toolbar.
replace_once(
    "components/kleio/adaptive-artist-passport-experience.tsx",
    'import { Check, ChevronLeft, ChevronRight, FileText, FormInput, Loader2, Save, Sparkles } from "lucide-react"',
    'import { Check, ChevronDown, ChevronLeft, ChevronRight, FileText, FormInput, Loader2, Save, Sparkles } from "lucide-react"',
)
replace_once(
    "components/kleio/adaptive-artist-passport-experience.tsx",
    '  const [mode, setMode] = useState<PassportMode>("full")\n  const [record, setRecord] = useState(blankPassport)',
    '  const [mode, setMode] = useState<PassportMode>("full")\n  const [workflowOpen, setWorkflowOpen] = useState(false)\n  const [record, setRecord] = useState(blankPassport)',
)
replace_once(
    "components/kleio/adaptive-artist-passport-experience.tsx",
    '    setMode(nextMode)\n    window.localStorage.setItem(MODE_KEY, nextMode)',
    '    setMode(nextMode)\n    setWorkflowOpen(false)\n    window.localStorage.setItem(MODE_KEY, nextMode)',
)
replace_once(
    "components/kleio/adaptive-artist-passport-experience.tsx",
    '  const saveLabel = saveState === "saving" ? "Saving to KLEIO…" : saveState === "saved" ? "Saved to KLEIO" : saveState === "local" ? "Saved locally" : saveState === "offline" ? "Offline — saved locally" : saveState === "conflict" ? "Conflict detected" : saveState === "error" ? "Retry required" : ""\n\n  return (',
    '  const saveLabel = saveState === "saving" ? "Saving to KLEIO…" : saveState === "saved" ? "Saved to KLEIO" : saveState === "local" ? "Saved locally" : saveState === "offline" ? "Offline — saved locally" : saveState === "conflict" ? "Conflict detected" : saveState === "error" ? "Retry required" : ""\n  const workflowLabel = mode === "guided" ? (es ? "Guía paso a paso" : "Guided steps") : mode === "import" ? (es ? "Importar materiales" : "Import materials") : (es ? "Formulario completo" : "Full form")\n\n  return (',
)
regex_once(
    "components/kleio/adaptive-artist-passport-experience.tsx",
    r'''      <section className="shrink-0 border-b border-\[#E7E1F7\] bg-\[#FDFCFF\] px-4 py-3 sm:px-6" aria-label="Creative Passport entry mode">.*?      </section>\n\n      \{mode !== "full"''',
    '''      <section className="shrink-0 border-b border-[#E7E1F7] bg-[#FDFCFF] px-4 py-2 sm:px-6" aria-label="Creative Passport workflow">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setWorkflowOpen((value) => !value)} aria-expanded={workflowOpen} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-left text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#F4F0FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15">
              <ChevronDown className={`size-3.5 transition-transform ${workflowOpen ? "rotate-180" : ""}`} />
              <span className="text-[#81788E]">Workflow</span>
              <span>{workflowLabel}</span>
              <span className="font-normal text-[#81788E]">· Change</span>
            </button>
            {saveLabel && <p role="status" aria-live="polite" className={`text-xs font-semibold ${saveState === "conflict" || saveState === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{saveLabel}</p>}
          </div>
          {workflowOpen && (
            <div className="grid gap-2 border-t border-[#EEEAF6] pt-3 md:grid-cols-3">
              <ModeButton active={mode === "guided"} icon={Sparkles} title={es ? "Guíame paso a paso" : "Guide me step by step"} description={es ? "Preguntas breves y ayuda por voz." : "Short prompts and optional voice help."} onClick={() => chooseMode("guided")} />
              <ModeButton active={mode === "full"} icon={FormInput} title={es ? "Déjame completarlo" : "Let me fill it out"} description={es ? "Formulario completo para entrada directa." : "The complete form for direct entry."} onClick={() => chooseMode("full")} />
              <ModeButton active={mode === "import"} icon={FileText} title={es ? "Empezar con lo que tengo" : "Start from what I have"} description={es ? "Extrae propuestas de CV y texto." : "Extract proposals from PDFs and text."} onClick={() => chooseMode("import")} />
            </div>
          )}
        </div>
      </section>

      {mode !== "full"''',
)

# KLEIO guide: do not squeeze the entire application and minimize passively on focus-heavy forms.
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    'import { useMemo } from "react"',
    'import { useEffect, useMemo, useRef } from "react"',
)
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    'type StepSpanishCopy = Partial<Pick<DemoGuideStep, "title" | "body" | "screenLabel" | "screenCue" | "viewerAction" | "nextPreview" | "primaryActionLabel">>\n',
    'type StepSpanishCopy = Partial<Pick<DemoGuideStep, "title" | "body" | "screenLabel" | "screenCue" | "viewerAction" | "nextPreview" | "primaryActionLabel">>\n\nconst ATTENTION_ROUTE_PREFIXES = ["/artist-dashboard/passport", "/artist-dashboard/applications/prepare", "/artist-dashboard/portfolio", "/programs/new", "/signup", "/onboarding", "/application-review"]\nfunction routeNeedsUnobstructedFocus(pathname: string) { return ATTENTION_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) }\n',
)
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    '  const { state, openGuide, minimizeGuide, startScenario, goToNextStep, goToPreviousStep, restartScenario, dismissGuide, returnToPlaylist } = useDemoGuide()\n\n  const activeStep',
    '  const { state, openGuide, minimizeGuide, startScenario, goToNextStep, goToPreviousStep, restartScenario, dismissGuide, returnToPlaylist } = useDemoGuide()\n  const focusRouteSeenRef = useRef<string | null>(null)\n\n  useEffect(() => {\n    if (!routeNeedsUnobstructedFocus(pathname)) { focusRouteSeenRef.current = null; return }\n    if (focusRouteSeenRef.current === pathname || !state.isOpen) return\n    focusRouteSeenRef.current = pathname\n    if (!state.activeScenarioId) minimizeGuide()\n  }, [minimizeGuide, pathname, state.activeScenarioId, state.isOpen])\n\n  const activeStep',
)
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    'className="kleio-demo-guide-anchor fixed bottom-4 right-4 z-40 w-[min(100vw-1.5rem,24rem)] max-md:bottom-3 max-md:right-3"',
    'className="kleio-demo-guide-anchor fixed bottom-4 right-4 z-40 w-[min(100vw-1.5rem,21rem)] max-md:bottom-3 max-md:right-3"',
)
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    'className="kleio-demo-guide-panel max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl',
    'className="kleio-demo-guide-panel max-h-[min(72dvh,38rem)] overflow-hidden rounded-2xl',
)
replace_once(
    "components/kleio/kleio-demo-guide.tsx",
    'className="max-h-[min(64dvh,34rem)] overflow-y-auto px-3.5 py-3"',
    'className="max-h-[min(54dvh,29rem)] overflow-y-auto px-3.5 py-3"',
)

# Global policy: page-local context panels stick only on genuinely large, tall screens.
replace_once(
    "components/kleio/artist-passport-view.tsx",
    '<div className="lg:sticky lg:top-0">',
    '<div className="kleio-context-panel">',
)
replace_once(
    "components/kleio/profile/editorial-artist-profile.tsx",
    '<aside id="profile" className="scroll-mt-8 lg:sticky lg:top-5 lg:self-start">',
    '<aside id="profile" className="kleio-context-panel scroll-mt-8 lg:self-start">',
)
replace_once(
    "components/kleio/live-artist-discovery.tsx",
    '<aside className="lg:sticky lg:top-20 lg:self-start">',
    '<aside className="kleio-context-panel lg:self-start">',
)

# Remove the guide's layout-reserving dock and define non-blocking global behavior.
regex_once(
    "app/globals.css",
    r'''/\* ── KLEIO Assist — docked desktop layout ─+ \*/\n\n@media \(min-width: 1280px\) \{.*?\n\}\n\n@media \(min-width: 1280px\) and \(max-width: 1500px\) \{.*?\n\}''',
    '''/* ── KLEIO Assist — non-blocking workspace behavior ────────────────── */

@media (min-width: 1280px) {
  .kleio-demo-guide-anchor {
    right: 1rem !important;
  }
}

/* Page-local context should never pin itself over ordinary laptop-height forms. */
.kleio-context-panel {
  position: static;
  max-height: none;
  overflow: visible;
}

@media (min-width: 1536px) and (min-height: 850px) {
  .kleio-context-panel {
    position: sticky;
    top: 1rem;
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
}

/* Modal decisions take precedence over passive guidance. */
body:has([role="dialog"][aria-modal="true"]) .kleio-demo-guide-anchor {
  display: none;
}''',
)
