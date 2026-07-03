"use client"

import Link from "next/link"
import {
  PublicCard,
  PublicEyebrow,
  PublicHero,
  PublicPageShell,
  PublicSection,
} from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const cardKeys = [
  { title: "public.about.card.passport.title", body: "public.about.card.passport.body" },
  { title: "public.about.card.workspace.title", body: "public.about.card.workspace.body" },
  { title: "public.about.card.record.title", body: "public.about.card.record.body" },
] as const

export function AboutPageView() {
  const { t } = useKleioLocale()

  return (
    <PublicPageShell active="about">
      <PublicEyebrow>{t("public.about.eyebrow")}</PublicEyebrow>
      <PublicHero title={t("public.about.hero.title")} subtitle={t("public.about.hero.subtitle")} />

      <div className="mt-14 space-y-10">
        <PublicSection heading={t("public.about.artist.heading")}>{t("public.about.artist.body")}</PublicSection>
        <PublicSection heading={t("public.about.institution.heading")}>
          {t("public.about.institution.body")}
        </PublicSection>
        <PublicSection heading={t("public.about.assist.heading")}>{t("public.about.assist.body")}</PublicSection>
        <p className="max-w-[720px] text-[0.95rem] leading-relaxed text-[#5A5468]">
          {t("public.about.collaborator.note")}
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {cardKeys.map((card) => (
          <PublicCard key={card.title}>
            <h3 className="font-serif text-[1.1rem] font-semibold text-[#292631]">{t(card.title)}</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#5A5468]">{t(card.body)}</p>
          </PublicCard>
        ))}
      </div>

      <div
        className="mt-16 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.06)" }}
      >
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          {t("public.about.cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          {t("public.about.cta.body")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]"
          >
            {t("public.about.cta.artist")}
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8] hover:bg-white"
          >
            {t("public.about.cta.institution")}
          </Link>
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]">
            {t("public.about.cta.demo")}
          </ExploreArthouseLink>
        </div>
      </div>
    </PublicPageShell>
  )
}
