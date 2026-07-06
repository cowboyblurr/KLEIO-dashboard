"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getFirstStepForScenario,
  getNextGuideStep,
  getPreviousGuideStep,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"

export const DEMO_GUIDE_STORAGE_KEY = "kleio-demo-guide-state-v2"
export const DEMO_GUIDE_CHANGED_EVENT = "kleio-demo-guide-changed"

export type DemoGuideState = {
  isOpen: boolean
  isMinimized: boolean
  activeScenarioId: DemoGuideScenarioId | null
  activeStepId: string | null
  completedScenarioId: DemoGuideScenarioId | null
  dismissed: boolean
}

const defaultState: DemoGuideState = {
  isOpen: false,
  isMinimized: true,
  activeScenarioId: null,
  activeStepId: null,
  completedScenarioId: null,
  dismissed: false,
}

function isBrowser() {
  return typeof window !== "undefined"
}

function readGuideState(): DemoGuideState {
  if (!isBrowser()) return defaultState

  try {
    const raw = window.localStorage.getItem(DEMO_GUIDE_STORAGE_KEY)

    if (!raw) {
      const previousRaw = window.localStorage.getItem("kleio-demo-guide-state-v1")
      if (!previousRaw) return defaultState
      const previousParsed = JSON.parse(previousRaw) as Partial<DemoGuideState>
      return { ...defaultState, ...previousParsed, completedScenarioId: null }
    }

    const parsed = JSON.parse(raw) as Partial<DemoGuideState>
    return { ...defaultState, ...parsed }
  } catch {
    return defaultState
  }
}

function writeGuideState(state: DemoGuideState) {
  if (!isBrowser()) return
  window.localStorage.setItem(DEMO_GUIDE_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(DEMO_GUIDE_CHANGED_EVENT))
}

export function persistDemoGuideState(patch: Partial<DemoGuideState>) {
  const next = { ...readGuideState(), ...patch }
  writeGuideState(next)
  return next
}

export function useDemoGuide() {
  const [state, setState] = useState<DemoGuideState>(defaultState)

  useEffect(() => {
    setState(readGuideState())
    const onChange = () => setState(readGuideState())
    window.addEventListener(DEMO_GUIDE_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(DEMO_GUIDE_CHANGED_EVENT, onChange)
  }, [])

  const update = useCallback((patch: Partial<DemoGuideState>) => {
    const next = { ...readGuideState(), ...patch }
    writeGuideState(next)
    setState(next)
  }, [])

  const openGuide = useCallback(() => {
    update({ isOpen: true, isMinimized: false, dismissed: false })
  }, [update])

  const closeGuide = useCallback(() => {
    update({ isOpen: false, isMinimized: true })
  }, [update])

  const minimizeGuide = useCallback(() => {
    update({ isOpen: false, isMinimized: true })
  }, [update])

  const returnToPlaylist = useCallback(() => {
    update({
      isOpen: true,
      isMinimized: false,
      dismissed: false,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
  }, [update])

  const startScenario = useCallback(
    (scenarioId: DemoGuideScenarioId) => {
      const firstStep = getFirstStepForScenario(scenarioId)
      update({
        isOpen: true,
        isMinimized: false,
        dismissed: false,
        activeScenarioId: scenarioId,
        activeStepId: firstStep?.id ?? null,
        completedScenarioId: null,
      })
    },
    [update],
  )

  const finishScenario = useCallback(() => {
    const current = readGuideState()
    if (!current.activeScenarioId) return

    update({
      isOpen: true,
      isMinimized: false,
      dismissed: false,
      completedScenarioId: current.activeScenarioId,
      activeScenarioId: null,
      activeStepId: null,
    })
  }, [update])

  const goToNextStep = useCallback(() => {
    const current = readGuideState()
    const next = getNextGuideStep(current.activeStepId)

    if (!next) {
      if (current.activeScenarioId) {
        update({
          completedScenarioId: current.activeScenarioId,
          activeScenarioId: null,
          activeStepId: null,
          isOpen: true,
          isMinimized: false,
          dismissed: false,
        })
      }
      return
    }

    update({
      activeStepId: next.id,
      activeScenarioId: next.scenarioId,
      completedScenarioId: null,
      isOpen: true,
      isMinimized: false,
      dismissed: false,
    })
  }, [update])

  const goToPreviousStep = useCallback(() => {
    const current = readGuideState()
    const previous = getPreviousGuideStep(current.activeStepId)
    if (!previous) return
    update({
      activeStepId: previous.id,
      activeScenarioId: previous.scenarioId,
      completedScenarioId: null,
      isOpen: true,
      isMinimized: false,
      dismissed: false,
    })
  }, [update])

  const skipStep = useCallback(() => {
    goToNextStep()
  }, [goToNextStep])

  const restartScenario = useCallback(() => {
    const current = readGuideState()
    const scenarioId = current.activeScenarioId ?? current.completedScenarioId
    if (!scenarioId) {
      returnToPlaylist()
      return
    }

    const firstStep = getFirstStepForScenario(scenarioId)
    update({
      isOpen: true,
      isMinimized: false,
      dismissed: false,
      activeScenarioId: scenarioId,
      activeStepId: firstStep?.id ?? null,
      completedScenarioId: null,
    })
  }, [returnToPlaylist, update])

  const resetGuide = useCallback(() => {
    writeGuideState(defaultState)
    setState(defaultState)
  }, [])

  const dismissGuide = useCallback(() => {
    update({ isOpen: false, isMinimized: true, dismissed: true })
  }, [update])

  return {
    state,
    openGuide,
    closeGuide,
    minimizeGuide,
    returnToPlaylist,
    startScenario,
    finishScenario,
    goToNextStep,
    goToPreviousStep,
    skipStep,
    restartScenario,
    resetGuide,
    dismissGuide,
  }
}
