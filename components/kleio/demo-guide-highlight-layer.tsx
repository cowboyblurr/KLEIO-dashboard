"use client"

import { useEffect } from "react"
import { DEMO_GUIDE_CHANGED_EVENT, DEMO_GUIDE_STORAGE_KEY } from "@/components/kleio/use-demo-guide"

type GuideState = {
  activeStepId?: string | null
  activeScenarioId?: string | null
  isOpen?: boolean
}

const stepTargets: Record<string, string[]> = {
  "artist-passport-setup-1": ["artist-profile-basics", "artist-import-assist"],
  "artist-passport-setup-2": ["artist-import-assist"],
  "artist-passport-setup-3": ["artist-passport", "passport-completeness", "artist-materials"],
  "find-first-grant-1": ["artist-profile-basics", "artist-import-assist"],
  "find-first-grant-2": ["artist-opportunities", "opportunity-readiness"],
  "find-first-grant-3": ["opportunity-readiness", "opportunity-missing-materials"],
  "create-open-call-1": ["institution-import-assist", "institution-profile-basics"],
  "create-open-call-2": ["institution-programs", "programs-table"],
  "create-open-call-3": ["new-program-form", "required-materials"],
  "create-open-call-4": ["new-program-form", "program-draft"],
  "invite-reviewers-resolve-materials-1": ["institution-programs", "incomplete-materials"],
  "invite-reviewers-resolve-materials-2": ["committee-reviewers", "reviewer-seat-preview"],
  "invite-reviewers-resolve-materials-3": ["review-queue", "incomplete-materials"],
  "invite-reviewers-resolve-materials-4": ["messages", "missing-materials-message"],
  "invite-reviewers-resolve-materials-5": ["activity-log", "decision-history"],
  "review-and-shortlist-1": ["institution-overview", "review-metrics"],
  "review-and-shortlist-2": ["review-queue", "review-table"],
  "review-and-shortlist-3": ["applicant-context", "review-notes"],
  "review-and-shortlist-4": ["shortlist", "report-preview"],
}

const stepKeywords: Record<string, string[]> = {
  "artist-passport-setup-1": ["Import Assist", "Profile basics", "Name", "Practice"],
  "artist-passport-setup-2": ["Import Assist"],
  "artist-passport-setup-3": ["Passport", "Completeness", "Materials", "Creative Passport"],
  "find-first-grant-1": ["Practice", "Profile", "Import Assist"],
  "find-first-grant-2": ["Opportunities", "Readiness", "Match", "Deadline"],
  "find-first-grant-3": ["Readiness", "Match", "Missing", "Deadline"],
  "create-open-call-1": ["Import Assist", "Institution", "Workspace"],
  "create-open-call-2": ["Programs", "Open Calls", "Deadline", "Submissions"],
  "create-open-call-3": ["Eligibility", "Required materials", "Deadline", "Review"],
  "create-open-call-4": ["Draft", "Program", "Open call"],
  "invite-reviewers-resolve-materials-1": ["Programs", "Incomplete", "Reviewers"],
  "invite-reviewers-resolve-materials-2": ["Committee", "Reviewers", "Pending", "Invite"],
  "invite-reviewers-resolve-materials-3": ["Review Queue", "Incomplete", "Materials", "Priority"],
  "invite-reviewers-resolve-materials-4": ["Messages", "Missing", "Follow-up"],
  "invite-reviewers-resolve-materials-5": ["Activity", "History", "Log"],
  "review-and-shortlist-1": ["Review", "Deadline", "Shortlist", "Applications"],
  "review-and-shortlist-2": ["Review Queue", "Completeness", "Assigned"],
  "review-and-shortlist-3": ["Applicant", "Notes", "Rubric", "Review"],
  "review-and-shortlist-4": ["Shortlist", "Finalist", "Report"],
}

function readState(): GuideState | null {
  try {
    const raw = window.localStorage.getItem(DEMO_GUIDE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GuideState
  } catch {
    return null
  }
}

function visibleText(element: Element) {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim()
}

function candidateElements() {
  return Array.from(
    document.querySelectorAll(
      "main section, main article, main aside, main header, main [role='region'], main .rounded-2xl, main .rounded-xl, main table, main form",
    ),
  ).filter((element) => !element.closest(".kleio-demo-guide-panel"))
}

function explicitTarget(stepId: string) {
  const targets = stepTargets[stepId]
  if (!targets?.length) return null
  for (const target of targets) {
    const element = document.querySelector(`[data-kleio-guide-target="${target}"]`)
    if (element) return element as HTMLElement
  }
  return null
}

function scoreElement(element: Element, keywords: string[]) {
  const text = visibleText(element).toLowerCase()
  if (!text) return 0
  return keywords.reduce((score, keyword) => {
    const lowered = keyword.toLowerCase()
    if (!lowered) return score
    if (text.includes(lowered)) return score + (lowered.length > 8 ? 3 : 2)
    return score
  }, 0)
}

function clearHighlights() {
  document.querySelectorAll(".kleio-guide-target-highlight").forEach((element) => {
    element.classList.remove("kleio-guide-target-highlight")
    element.removeAttribute("data-kleio-guide-highlight")
  })
}

function applyHighlight() {
  clearHighlights()
  const state = readState()
  if (!state?.isOpen || !state.activeStepId) return

  const explicit = explicitTarget(state.activeStepId)
  const keywords = stepKeywords[state.activeStepId]
  const ranked = keywords?.length
    ? candidateElements()
        .map((element) => ({ element, score: scoreElement(element, keywords) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
    : []

  const target = explicit ?? (ranked[0]?.element as HTMLElement | undefined)
  if (!target) return
  target.classList.add("kleio-guide-target-highlight")
  target.setAttribute("data-kleio-guide-highlight", "true")
  window.setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
  }, 180)
}

export function DemoGuideHighlightLayer() {
  useEffect(() => {
    applyHighlight()
    const onChange = () => window.setTimeout(applyHighlight, 120)
    const onRouteReady = () => window.setTimeout(applyHighlight, 420)
    window.addEventListener(DEMO_GUIDE_CHANGED_EVENT, onChange)
    window.addEventListener("popstate", onRouteReady)
    const interval = window.setInterval(applyHighlight, 1400)
    return () => {
      clearHighlights()
      window.removeEventListener(DEMO_GUIDE_CHANGED_EVENT, onChange)
      window.removeEventListener("popstate", onRouteReady)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <style>{`
      .kleio-guide-target-highlight {
        position: relative;
        outline: 2px solid rgba(169, 151, 232, 0.92) !important;
        outline-offset: 4px;
        box-shadow: 0 0 0 8px rgba(169, 151, 232, 0.14), 0 18px 48px rgba(82, 64, 130, 0.16) !important;
        transition: outline-color 260ms ease, box-shadow 260ms ease, transform 260ms ease !important;
      }

      .kleio-guide-target-highlight::before {
        content: "KLEIO Assist focus";
        position: absolute;
        right: 0.75rem;
        top: 0.75rem;
        z-index: 4;
        border: 1px solid #E7E1F7;
        border-radius: 999px;
        background: rgba(255,255,255,0.95);
        color: #5B4B8A;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 0.2rem 0.5rem;
        text-transform: uppercase;
        box-shadow: 0 8px 22px rgba(82, 64, 130, 0.1);
      }

      @media (max-width: 767px) {
        .kleio-guide-target-highlight::before {
          display: none;
        }
      }
    `}</style>
  )
}
