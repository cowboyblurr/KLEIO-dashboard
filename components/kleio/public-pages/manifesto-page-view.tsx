"use client"

import Link from "next/link"
import { PublicEyebrow, PublicHero, PublicPageShell } from "@/components/kleio/public-page-shell"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const principleKeys = [
  { heading: "public.manifesto.principle.1.heading", body: "public.manifesto.principle.1.body" },
  { heading: "public.manifesto.principle.2.heading", body: "public.manifesto.principle.2.body" },
  { heading: "public.manifesto.principle.3.heading", body: "public.manifesto.principle.3.body" },
  { heading: "public.manifesto.principle.4.heading", body: "public.manifesto.principle.4.body" },
  { heading: "public.manifesto.principle.5.heading", body: "public.manifesto.principle.5.body" },
] as const

export function ManifestoPageView() {
  const { t } = useKleioLocale()

  return (
    <PublicPageShell active="manifesto">
      <PublicEyebrow>{t("public.manifesto.eyebrow")}</PublicEyebrow>
      <PublicHero title={t("public.manifesto.hero.title")} subtitle={t("public.manifesto.hero.subtitle")} />

      <ol className="mt-14 space-y-8">
        {principleKeys.map((principle, index) => (
          <li key={principle.heading} className="flex gap-5 border-t border-[#E7E1F7] pt-8 first:border-t-0 first:pt-0">
            <span className="mt-1 shrink-0 font-serif text-[1.1rem] font-semibold text-[#A997E8] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-[1.3rem] font-semibold tracking-tight text-[#292631]">
                {t(principle.heading)}
              </h2>
              <p className="mt-2 max-w-[720px] text-[0.95rem] leading-relaxed text-[#5A5468]">{t(principle.body)}</p>
            </div>
          </li>
        ))}
      </ol>

      <blockquote
        className="mt-14 rounded-2xl border-l-2 border-[#A997E8] bg-[#F7F4FF] px-6 py-6 font-serif text-[1.15rem] italic leading-relaxed text-[#3A3448]"
        style={{ boxShadow: "0 18px 48px rgba(82, 64, 130, 0.05)" }}
      >
        {t("public.manifesto.quote")}
      </blockquote>

      <div className="mt-14 text-center">
        <h2 className="font-serif text-[1.5rem] font-semibold tracking-tight text-[#292631]">
          {t("public.manifesto.cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-[#6F6882]">
          {t("public.manifesto.cta.body")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ExploreArthouseLink className="inline-flex h-11 items-center justify-center rounded-full bg-[#292631] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F1B29]">
            {t("public.manifesto.cta.explore")}
          </ExploreArthouseLink>
          <Link
            href="/signup/artist/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            {t("public.manifesto.cta.artist")}
          </Link>
          <Link
            href="/signup/institution/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#D8D0F2] bg-white px-6 text-sm font-semibold text-[#5B4B8A] transition-colors hover:border-[#A997E8]"
          >
            {t("public.manifesto.cta.institution")}
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
