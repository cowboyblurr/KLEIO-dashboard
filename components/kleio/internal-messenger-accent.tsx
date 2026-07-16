"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getSupabaseBrowserClient,
  loadKleioAccount,
  type KleioAccount,
} from "@/lib/kleio-supabase"
import { InstitutionMessengerLive } from "@/components/kleio/institution-messenger-live"
import { DemoInternalMessengerAccent } from "@/components/kleio/demo-internal-messenger-accent"

export function InternalMessengerAccent() {
  const [account, setAccount] = useState<KleioAccount | null | undefined>(undefined)

  const refreshAccount = useCallback(async () => {
    const nextAccount = await loadKleioAccount().catch(() => null)
    setAccount(nextAccount)
  }, [])

  useEffect(() => {
    let active = true
    void refreshAccount()

    const supabase = getSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void refreshAccount()
      }, 0)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [refreshAccount])

  if (account === undefined) return null
  if (account && account.profile.role !== "artist") {
    return <InstitutionMessengerLive account={account} />
  }
  return <DemoInternalMessengerAccent />
}
