"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

export function InstitutionProfileCta() {
  const { t } = useKleioLocale()

  return (
    <div className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center" style={{ boxShadow: cardShadow }}>
      <div className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-white" style={{ color: lavenderDeep }}>
        <Sparkles className="size-4" />
      </div>
      <h2 className="font-serif text-2xl font-semibold tracking-tight" style={{ color: inkColor }}>
        {t("profile.institution.cta.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
        {t("profile.institution.cta.body")}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/signup/institution/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("profile.institution.cta.createWorkspace")}
        </Link>
        <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
          {t("profile.institution.cta.exploreDemo")}
        </ExploreArthouseLink>
      </div>
    </div>
  )
}
