"use client"

import { PassportUpdatesInbox } from "@/components/kleio/passport-updates-inbox"
import { PassportUpdatesInboxSpanish } from "@/components/kleio/passport-updates-inbox-spanish"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function PassportUpdatesInboxLocalized() {
  const { locale } = useKleioLocale()
  return locale === "es" ? <PassportUpdatesInboxSpanish /> : <PassportUpdatesInbox />
}
