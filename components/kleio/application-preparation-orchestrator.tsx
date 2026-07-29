"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApplicationPreparationWorkspace } from "@/components/kleio/application-preparation-workspace"
import { OpportunityResearchProgress } from "@/components/kleio/opportunity-research-progress"
import {
  cancelOpportunityResearch,
  findRecentOpportunityResearch,
  isOpportunityResearchActive,
  loadOpportunityResearchMaterials,
  loadOpportunityResearchSession,
  startOpportunityResearch,
  type OpportunityResearchSession,
} from "@/lib/kleio-opportunity-research"
import type { ArtistPassportRecord, PortfolioWorkRecord } from "@/lib/kleio-live-data"

const TERMINAL = new Set([
  "artist_review_required",
  "complete",
  "succeeded",
  "partial",
  "blocked",
  "failed",
  "cancelled",
  "stale",
])

export function ApplicationPreparationOrchestrator() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [session, setSession] = useState<OpportunityResearchSession | null>(null)
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [portfolioWorks, setPortfolioWorks] = useState<PortfolioWorkRecord[]>([])
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState("")
  const [minimized, setMinimized] = useState(false)
  const [workspaceRevision, setWorkspaceRevision] = useState(0)
  const refreshedSessionRef = useRef("")

  const refreshMaterials = useCallback(async () => {
    const materials = await loadOpportunityResearchMaterials()
    setPassport(materials.passport)
    setPortfolioWorks(materials.portfolioWorks)
  }, [])

  const createOrResume = useCallback(async (forceNew = false) => {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const nextSession = await startOpportunityResearch(opportunityId, forceNew)
      setSession(nextSession)
      setMinimized(false)
      await refreshMaterials()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not start the public-source review.")
    } finally {
      setLoading(false)
    }
  }, [opportunityId, refreshMaterials])

  useEffect(() => {
    if (!opportunityId) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError("")

    void Promise.all([
      findRecentOpportunityResearch(opportunityId),
      loadOpportunityResearchMaterials(),
    ]).then(async ([recent, materials]) => {
      if (!active) return
      setPassport(materials.passport)
      setPortfolioWorks(materials.portfolioWorks)
      if (recent) {
        setSession(recent)
        return
      }
      const created = await startOpportunityResearch(opportunityId)
      if (active) setSession(created)
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not initialize opportunity research.")
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [opportunityId])

  useEffect(() => {
    if (!session || !isOpportunityResearchActive(session.status)) return
    let active = true

    const refresh = () => {
      void loadOpportunityResearchSession(session.id).then((nextSession) => {
        if (active) setSession(nextSession)
      }).catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not refresh research progress.")
      })
    }

    refresh()
    const interval = window.setInterval(refresh, 1_500)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [session?.id, session?.status])

  useEffect(() => {
    if (!session || !TERMINAL.has(session.status) || refreshedSessionRef.current === session.id) return
    refreshedSessionRef.current = session.id
    void refreshMaterials().finally(() => setWorkspaceRevision((value) => value + 1))
  }, [session, refreshMaterials])

  const cancel = useCallback(async () => {
    if (!session) return
    setError("")
    try {
      setSession(await cancelOpportunityResearch(session.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not cancel this research job.")
    }
  }, [session])

  return (
    <>
      <ApplicationPreparationWorkspace key={`${opportunityId}-${workspaceRevision}`} />
      {opportunityId && (
        <OpportunityResearchProgress
          session={session}
          passport={passport}
          portfolioWorks={portfolioWorks}
          loading={loading}
          error={error}
          minimized={minimized}
          onToggleMinimized={() => setMinimized((value) => !value)}
          onResearchAgain={() => void createOrResume(true)}
          onCancel={() => void cancel()}
        />
      )}
    </>
  )
}
