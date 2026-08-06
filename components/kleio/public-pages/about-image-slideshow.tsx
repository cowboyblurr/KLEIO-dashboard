"use client"

import { useEffect, useMemo, useState } from "react"
import { assetPath } from "@/lib/asset-path"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { cn } from "@/lib/utils"

const aboutSlides = [
  {
    hdSrc: "https://github.com/cowboyblurr/KLEIO-ASSETS/blob/main/14a346bc2f8a28767a6f1511c378675b.jpg?raw=true",
    fallbackSrc: "/about/about-review-wall.svg",
    alt: "Atmospheric creative workspace used as a visual reference for KLEIO's cultural review environment.",
    labelEn: "Review environment",
    labelEs: "Entorno de revisión",
  },
  {
    hdSrc: "https://github.com/cowboyblurr/KLEIO-ASSETS/blob/main/2b5b8aa9772b651df75feac3b69b070d.jpg?raw=true",
    fallbackSrc: "/about/about-archive-desk.svg",
    alt: "Refined visual archive scene representing organized cultural records and artist materials.",
    labelEn: "Cultural archive",
    labelEs: "Archivo cultural",
  },
  {
    hdSrc: "https://github.com/cowboyblurr/KLEIO-ASSETS/blob/main/7cbc9a1f1d9ee2a464bed18c3dfd8ded.jpg?raw=true",
    fallbackSrc: "/about/about-artist-table.svg",
    alt: "Artist-centered visual reference for materials, practice, and reusable creative records.",
    labelEn: "Artist materials",
    labelEs: "Materiales de artista",
  },
  {
    hdSrc: "https://github.com/cowboyblurr/KLEIO-ASSETS/blob/main/ae7239203d806077d85fcb1fd86697f3.jpg?raw=true",
    fallbackSrc: "/about/about-open-studio.svg",
    alt: "Open creative environment representing KLEIO's bridge between artists and institutions.",
    labelEn: "Open studio",
    labelEs: "Estudio abierto",
  },
] as const

function resolveImageSrc(src: string) {
  return src.startsWith("http") ? src : assetPath(src)
}

function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string,
) {
  const fallbackUrl = assetPath(fallbackSrc)
  if (event.currentTarget.src !== fallbackUrl) {
    event.currentTarget.src = fallbackUrl
  }
}

export function AboutImageSlideshow() {
  const { locale } = useKleioLocale()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % aboutSlides.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [])

  const activeSlide = aboutSlides[activeIndex]
  const label = locale === "es" ? activeSlide.labelEs : activeSlide.labelEn
  const eyebrow = locale === "es" ? "Archivo vivo" : "Living archive"
  const note =
    locale === "es"
      ? "De materiales dispersos a una memoria cultural organizada."
      : "From scattered materials to organized cultural memory."

  const secondarySlides = useMemo(
    () => aboutSlides.filter((_, index) => index !== activeIndex).slice(0, 3),
    [activeIndex],
  )

  return (
    <aside className="kleio-context-panel relative mx-auto w-full max-w-[400px] lg:mx-auto xl:max-w-[430px]">
      <div className="absolute -left-6 top-8 h-36 w-36 rounded-full bg-[#F7F4FF] blur-3xl" aria-hidden />
      <div className="absolute -right-5 bottom-16 h-32 w-32 rounded-full bg-[#E7E1F7]/70 blur-3xl" aria-hidden />

      <div className="relative rounded-[2rem] border border-[#E7E1F7] bg-white p-2.5 shadow-[0_24px_70px_rgba(82,64,130,0.14)]">
        <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-[1.45rem] bg-[#F7F4FF] shadow-[0_18px_46px_rgba(31,27,41,0.12)]">
          {aboutSlides.map((slide, index) => (
            <img
              key={slide.labelEn}
              src={resolveImageSrc(slide.hdSrc)}
              onError={(event) => handleImageFallback(event, slide.fallbackSrc)}
              alt={slide.alt}
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out [backface-visibility:hidden]",
                index === activeIndex ? "opacity-100" : "opacity-0",
              )}
              style={{ filter: "contrast(1.02) saturate(1.01)" }}
            />
          ))}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1F1B29]/78 via-[#1F1B29]/24 to-transparent p-4 pt-16 text-white">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/75">{eyebrow}</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-semibold leading-none">{label}</h3>
                <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-white/78">{note}</p>
              </div>
              <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[0.65rem] font-semibold backdrop-blur-sm">
                {String(activeIndex + 1).padStart(2, "0")} / {String(aboutSlides.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {secondarySlides.map((slide) => {
            const sourceIndex = aboutSlides.findIndex((item) => item.labelEn === slide.labelEn)
            return (
              <button
                key={slide.labelEn}
                type="button"
                onClick={() => setActiveIndex(sourceIndex)}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]"
                aria-label={locale === "es" ? `Ver ${slide.labelEs}` : `View ${slide.labelEn}`}
              >
                <img
                  src={resolveImageSrc(slide.hdSrc)}
                  onError={(event) => handleImageFallback(event, slide.fallbackSrc)}
                  alt=""
                  decoding="async"
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100"
                  style={{ filter: "contrast(1.02) saturate(1.01)" }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/85 px-3 py-2 shadow-[0_12px_36px_rgba(82,64,130,0.08)] backdrop-blur-sm">
        {aboutSlides.map((slide, index) => (
          <button
            key={slide.labelEn}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeIndex ? "w-6 bg-[#5B4B8A]" : "w-1.5 bg-[#D8D0F2] hover:bg-[#A997E8]",
            )}
            aria-label={locale === "es" ? `Ir a imagen ${index + 1}` : `Go to image ${index + 1}`}
          />
        ))}
      </div>
    </aside>
  )
}
