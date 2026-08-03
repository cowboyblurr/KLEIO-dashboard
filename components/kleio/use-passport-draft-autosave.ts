"use client"

import { useEffect, useRef, useState } from "react"
import { getKleioActiveUserScope } from "@/lib/kleio-client-session"
import {
  loadRemoteKleioDraft,
  newestKleioDraft,
  readLocalKleioDraft,
  saveLocalKleioDraft,
  saveRemoteKleioDraft,
  type KleioDraftEnvelope,
  type KleioDraftKind,
} from "@/lib/kleio-passport-drafts"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const RECOVERY_DISMISSAL_PREFIX = "kleio:artist:draft-recovery-dismissed:v1:"

export type PassportAutosaveState = "idle" | "local" | "saving" | "saved" | "offline" | "conflict" | "error"

function recoveryDismissalStorageKey(draftKey: string) {
  if (typeof window === "undefined") return null
  const userId = getKleioActiveUserScope()
  return userId ? `${RECOVERY_DISMISSAL_PREFIX}${userId}:${draftKey}` : null
}

function recoveryFingerprint(draft: KleioDraftEnvelope<Record<string, unknown>>) {
  return `${draft.revision}:${draft.clientUpdatedAt}:${draft.serverUpdatedAt ?? "local"}`
}

export function isPassportDraftRecoveryDismissed<T extends Record<string, unknown>>(draft: KleioDraftEnvelope<T>) {
  const key = recoveryDismissalStorageKey(draft.draftKey)
  if (!key) return false
  try {
    return window.localStorage.getItem(key) === recoveryFingerprint(draft)
  } catch {
    return false
  }
}

export function dismissPassportDraftRecovery<T extends Record<string, unknown>>(draft: KleioDraftEnvelope<T>) {
  const key = recoveryDismissalStorageKey(draft.draftKey)
  if (!key) return
  try {
    window.localStorage.setItem(key, recoveryFingerprint(draft))
  } catch {
    // Recovery can still be dismissed for the current visit when storage is unavailable.
  }
}

export function usePassportDraftAutosave<T extends Record<string, unknown>>(input: {
  draftKey: string
  draftKind?: KleioDraftKind
  payload: T
  enabled: boolean
  surface: string
  onRestore: (payload: T) => void
}) {
  const revisionRef = useRef(0)
  const initializedRef = useRef(false)
  const lastSerializedRef = useRef("")
  const [state, setState] = useState<PassportAutosaveState>("idle")
  const [recovery, setRecovery] = useState<KleioDraftEnvelope<T> | null>(null)

  useEffect(() => {
    if (!input.enabled || initializedRef.current) return
    let active = true
    Promise.all([
      Promise.resolve(readLocalKleioDraft<T>(input.draftKey)),
      loadRemoteKleioDraft<T>(input.draftKey).catch(() => null),
    ]).then(([local, remote]) => {
      if (!active) return
      revisionRef.current = remote?.revision ?? 0
      const newest = newestKleioDraft(local, remote)
      const currentSerialized = JSON.stringify(input.payload)
      lastSerializedRef.current = currentSerialized
      if (
        newest
        && JSON.stringify(newest.payload) !== currentSerialized
        && !isPassportDraftRecoveryDismissed(newest)
      ) {
        setRecovery(newest)
      }
      initializedRef.current = true
    })
    return () => { active = false }
  }, [input])

  useEffect(() => {
    if (!input.enabled || !initializedRef.current) return
    const serialized = JSON.stringify(input.payload)
    if (serialized === lastSerializedRef.current) return
    lastSerializedRef.current = serialized

    const local = saveLocalKleioDraft({
      draftKey: input.draftKey,
      draftKind: input.draftKind ?? "creative_passport",
      payload: input.payload,
      revision: revisionRef.current,
    })
    setState("local")

    const timer = window.setTimeout(() => {
      if (!navigator.onLine) {
        setState("offline")
        return
      }
      setState("saving")
      void saveRemoteKleioDraft({
        draftKey: input.draftKey,
        draftKind: input.draftKind ?? "creative_passport",
        payload: input.payload,
        expectedRevision: revisionRef.current,
        clientUpdatedAt: local?.clientUpdatedAt,
      }).then((saved) => {
        revisionRef.current = saved.revision
        setState("saved")
        void trackKleioProductEvent("autosave_succeeded", { surface: input.surface, metadata: { mode: input.draftKey } })
      }).catch(async (reason) => {
        if (reason instanceof Error && reason.name === "KleioDraftConflictError") {
          setState("conflict")
          const nextRecovery = await loadRemoteKleioDraft<T>(input.draftKey)
          setRecovery(nextRecovery && !isPassportDraftRecoveryDismissed(nextRecovery) ? nextRecovery : null)
          void trackKleioProductEvent("conflict_detected", { surface: input.surface, metadata: { mode: input.draftKey } })
        } else {
          setState("error")
          void trackKleioProductEvent("autosave_failed", { surface: input.surface, metadata: { mode: input.draftKey, reason: "remote_save" } })
        }
      })
    }, 1100)

    return () => window.clearTimeout(timer)
  }, [input])

  function restore() {
    if (!recovery) return
    dismissPassportDraftRecovery(recovery)
    input.onRestore(recovery.payload)
    revisionRef.current = recovery.revision
    setRecovery(null)
    setState("local")
    lastSerializedRef.current = JSON.stringify(recovery.payload)
    void trackKleioProductEvent("draft_restored", { surface: input.surface, metadata: { source: recovery.serverUpdatedAt ? "remote" : "local" } })
  }

  function dismissRecovery() {
    if (!recovery) return
    dismissPassportDraftRecovery(recovery)
    setRecovery(null)
  }

  return {
    state,
    recovery,
    restore,
    dismissRecovery,
    markSaved: () => setState("saved"),
  }
}

export function passportAutosaveLabel(state: PassportAutosaveState) {
  if (state === "saving") return "Saving to KLEIO…"
  if (state === "saved") return "Saved to KLEIO"
  if (state === "local") return "Saved locally"
  if (state === "offline") return "Offline — saved locally"
  if (state === "conflict") return "Conflict detected"
  if (state === "error") return "Retry required"
  return ""
}
