"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  DEFAULT_KLEIO_LOCALE,
  KLEIO_LOCALE_CHANGED_EVENT,
  KLEIO_LOCALE_STORAGE_KEY,
  formatMessage,
  type KleioLocale,
} from "@/lib/kleio-i18n"
import { formatSpanishOverride } from "@/lib/kleio-spanish-overrides"

type KleioLocaleContextValue = {
  locale: KleioLocale
  setLocale: (locale: KleioLocale) => void
  toggleLocale: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const KleioLocaleContext = createContext<KleioLocaleContextValue | null>(null)

function readStoredLocale(): KleioLocale {
  if (typeof window === "undefined") return DEFAULT_KLEIO_LOCALE
  const stored = window.localStorage.getItem(KLEIO_LOCALE_STORAGE_KEY)
  return stored === "es" ? "es" : DEFAULT_KLEIO_LOCALE
}

export function KleioLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<KleioLocale>(DEFAULT_KLEIO_LOCALE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLocaleState(readStoredLocale())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.lang = locale
    window.localStorage.setItem(KLEIO_LOCALE_STORAGE_KEY, locale)
    window.dispatchEvent(new CustomEvent(KLEIO_LOCALE_CHANGED_EVENT, { detail: { locale } }))
  }, [locale, ready])

  const setLocale = useCallback((next: KleioLocale) => {
    setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === "en" ? "es" : "en"))
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      formatSpanishOverride(locale, key, params) ?? formatMessage(locale, key, params),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  )

  return <KleioLocaleContext.Provider value={value}>{children}</KleioLocaleContext.Provider>
}

export function useKleioLocale() {
  const context = useContext(KleioLocaleContext)
  if (!context) {
    throw new Error("useKleioLocale must be used within KleioLocaleProvider")
  }
  return context
}
