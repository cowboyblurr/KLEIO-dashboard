"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApplicationPreparationWorkspace } from "@/components/kleio/application-preparation-workspace"
import { OpportunityResearchProgress } from "@/components/kleio/opportunity-research-progress"
import {
  createOpportunityResearchSession,
  findRecentOpportunityResearch,
  loadOpportunityResearchSession,
  startOpportunityResearch,
  type OpportunityResearchSession,
} from "@/lib/kleio-opportunity-research"

const TERMINAL_STATUSES = new Set(["succeeded", "partial", "failed", "cancelled"])

export function ApplicationPreparationOrchestrator() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [session, setSession] = useState<OpportunityResearchSession | null>(null)
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState("")
  const [minimized, setMinimized] = useState(false)
  const [workspaceRevision, setWorkspaceRevision] = useState(0)
  const invokedSessionRef = useRef("")
  const refreshedSessionRef = useRef("")

  const invokeResearch = useCallback((researchSession: OpportunityResearchSession) => {
    if (!opportunityId || invokedSessionRef.current === researchSession.id) return
    invokedSessionRef.current = researchSession.id
    void startOpportunityResearch(researchSession.id, opportunityId).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "KLEIO could not start the public-source review.")
    })
  }, [opportunityId])

  const createAndStart = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const created = await createOpportunityResearchSession(opportunityId)
      setSession(created)
      setMinimized(false)
      invokeResearch(created)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not create the research session.")
    } finally {
      setLoading(false)
    }
  }, [invokeResearch, opportunityId])

  useEffect(() => {
    if (!opportunityId) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError("")

    void findRecentOpportunityResearch(opportunityId)
      .then(async (recent) => {
        if (!active) return
        if (recent) {
          setSession(recent)
          if (recent.status === "queued") invokeResearch(recent)
          return
        }
        const created = await createOpportunityResearchSession(opportunityId)
        if (!active) return
        setSession(created)
        invokeResearch(created)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not initialize opportunity research.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [invokeResearch, opportunityId])

  useEffect(() => {
    if (!session || !["queued", "running"].includes(session.status)) return
    let active = true
    const refresh = () => {
      void loadOpportunityResearchSession(session.id)
        .then((nextSession) => {
          if (active) setSession(nextSession)
        })
        .catch((reason) => {
          if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not refresh research progress.")
        })
    }
    refresh()
    const interval = window.setInterval(refresh, 1_250)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [session?.id, session?.status])

  useEffect(() => {
    if (!session || !TERMINAL_STATUSES.has(session.status) || refreshedSessionRef.current === session.id) return
    refreshedSessionRef.current = session.id
    setWorkspaceRevision((value) => value + 1)
  }, [session])

  return (
    <>
      <ApplicationPreparationWorkspace key={`${opportunityId}-${workspaceRevision}`} />
      {opportunityId && (
        <OpportunityResearchProgress
          session={session}
          loading={loading}
          error={error}
          minimized={minimized}
          onToggleMinimized={() => setMinimized((value) => !value)}
          onResearchAgain={() => void createAndStart()}
        />
      )}
    </>
  )
}
