"use client"

import Link from "next/link"
import { PublicCard, PublicEyebrow, PublicHero, PublicPageShell } from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const articleKeys = [
  {
    category: "public.journal.article.artist.category",
    title: "public.journal.article.artist.title",
    body: "public.journal.article.artist.body",
  },
  {
    category: "public.journal.article.institution.category",
    title: "public.journal.article.institution.title",
    body: "public.journal.article.institution.body",
  },
  {
    category: "public.journal.article.assist.category",
    title: "public.journal.article.assist.title",
    body: "public.journal.article.assist.body",
  },
  {
    category: "public.journal.article.lifecycle.category",
    title: "public.journal.article.lifecycle.title",
    body: "public.journal.article.lifecycle.body",
  },
] as const

export function JournalPageView() {
  const { t } = useKleioLocale()

  return (
    <PublicPageShell active="journal">
      <PublicEyebrow>{t("public.journal.eyebrow")}</PublicEyebrow>
      <PublicHero title={t("public.journal.hero.title")} subtitle={t("public.journal.hero.subtitle")} />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {articleKeys.map((article) => (
          <PublicCard key={article.title}>
            <span className="inline-flex items-center rounded-full bg-[#F1ECFB] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#5B4B8A]">
              {t(article.category)}
            </span>
            <h2 className="mt-3 font-serif text-[1.2rem] font-semibold leading-snug tracking-tight text-[#292631]">
              {t(article.title)}
            </h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#5A5468]">{t(article.body)}</p>
          </PublicCard>
        ))}
      </div>

      <p className="mt-8 max-w-[720px] text-[0.9rem] leading-relaxed text-[#6F6882]">{t("public.journal.note")}</p>

      <div
        className="mt-16 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.06)" }}
      >
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          {t("public.journal.cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          {t("public.journal.cta.body")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]">
            {t("public.journal.cta.explore")}
          </ExploreArthouseLink>
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            {t("public.journal.cta.artist")}
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            {t("public.journal.cta.institution")}
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
