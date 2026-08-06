"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ArrowUpRight, AtSign, BadgeCheck, FileText, Globe, Mail, MapPin } from "lucide-react"

export type EditorialArtistProfileWork = {
  id?: string
  title: string
  year?: string
  medium?: string
  details?: string
  description?: string
  image?: string | null
}

export type EditorialArtistProfileData = {
  name: string
  role?: string
  location?: string
  portraitImage?: string | null
  heroImage?: string | null
  heroLabel?: string
  bio?: string
  artistStatement?: string
  practiceDescription?: string
  tags?: string[]
  works?: EditorialArtistProfileWork[]
  history?: string[]
  education?: string
  awards?: string[]
  website?: string
  instagram?: string
  email?: string
  passportLabel?: string
}

type ImageOrientation = "landscape" | "portrait" | "square"

const grainTexture =
  'url("data:image/svg+xml,%3Csvg viewBox=%220 0 180 180%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.82%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.42%22/%3E%3C/svg%3E")'

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A"
}

function websiteHref(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function instagramHref(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`
}

function orientationFor(width: number, height: number): ImageOrientation {
  if (!width || !height) return "landscape"
  const ratio = width / height
  if (ratio > 1.18) return "landscape"
  if (ratio < 0.85) return "portrait"
  return "square"
}

function LavenderGrain() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(169,151,232,0.24),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(216,208,242,0.3),transparent_30%),linear-gradient(135deg,rgba(247,244,255,0.9),rgba(255,255,255,0.2))]" />
      <div
        className="absolute inset-0 opacity-[0.075] mix-blend-multiply"
        style={{ backgroundImage: grainTexture, backgroundSize: "180px 180px" }}
      />
    </div>
  )
}

function ArtworkFrame({
  src,
  alt,
  prominence = "standard",
}: {
  src?: string | null
  alt: string
  prominence?: "hero" | "primary" | "standard"
}) {
  const [orientation, setOrientation] = useState<ImageOrientation>("landscape")
  let aspect = "aspect-[4/3]"
  if (orientation === "portrait") aspect = "aspect-[4/5]"
  if (orientation === "square") aspect = "aspect-square"
  if (prominence === "primary" && orientation === "landscape") aspect = "aspect-[16/11]"
  if (prominence === "hero") aspect = "aspect-[16/10] min-h-[300px]"

  return (
    <div className={`relative isolate overflow-hidden bg-[#F3EFF8] ${aspect}`}>
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img aria-hidden="true" src={src} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl saturate-75" />
          <div className="absolute inset-0 bg-white/16" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="relative z-10 size-full object-contain"
            onLoad={(event) => setOrientation(orientationFor(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))}
          />
        </>
      ) : (
        <div className="relative grid size-full min-h-[240px] place-items-center px-8 text-center">
          <LavenderGrain />
          <div className="relative z-10">
            <p className="font-serif text-2xl tracking-[-0.03em] text-[#4E426F]">Artwork image</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8A8296]">Not yet added</p>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkCaption({ work, index }: { work: EditorialArtistProfileWork; index: number }) {
  const metadata = [work.year, work.medium, work.details].filter(Boolean).join(" · ")
  return (
    <figcaption className="mt-3 flex items-start justify-between gap-4 border-t border-[#DDD7E7] pt-3 text-xs text-[#746F7C]">
      <div className="min-w-0">
        <p className="font-medium text-[#242129]">{work.title || "Untitled"}</p>
        {metadata && <p className="mt-1 leading-5">{metadata}</p>}
      </div>
      <span className="shrink-0 tabular-nums text-[#9B94A4]">{String(index + 1).padStart(2, "0")}</span>
    </figcaption>
  )
}

function PortraitOverlay({ name, src }: { name: string; src?: string | null }) {
  return (
    <div className="absolute bottom-4 right-4 z-20 w-24 overflow-hidden border-[5px] border-[#FCFBFD] bg-[#EEE9F4] shadow-[0_18px_50px_rgba(40,32,52,0.2)] sm:w-32 lg:-right-16 lg:bottom-8 lg:w-36">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} portrait`} className="aspect-[4/5] w-full object-cover object-center" />
      ) : (
        <div className="relative grid aspect-[4/5] place-items-center">
          <LavenderGrain />
          <span className="relative z-10 font-serif text-3xl text-[#4E426F]">{initialsFor(name)}</span>
        </div>
      )}
    </div>
  )
}

function ProfileLinks({ data }: { data: EditorialArtistProfileData }) {
  const website = websiteHref(data.website)
  const instagram = instagramHref(data.instagram)
  if (!website && !instagram && !data.email) return null

  return (
    <div id="contact" className="scroll-mt-8 border-t border-[#DDD7E7] pt-4">
      <p className="text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-[#6A5896]">Contact</p>
      <div className="mt-3 grid gap-2 text-sm">
        {website && (
          <a href={website} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-1.5 text-[#4F4957] hover:text-[#6A5896]">
            <span className="inline-flex items-center gap-2"><Globe className="size-3.5" />Website</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        )}
        {instagram && (
          <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-1.5 text-[#4F4957] hover:text-[#6A5896]">
            <span className="inline-flex items-center gap-2"><AtSign className="size-3.5" />Instagram</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        )}
        {data.email && (
          <a href={`mailto:${data.email}`} className="flex items-center justify-between gap-3 py-1.5 text-[#4F4957] hover:text-[#6A5896]">
            <span className="inline-flex min-w-0 items-center gap-2"><Mail className="size-3.5 shrink-0" /><span className="truncate">{data.email}</span></span>
            <ArrowUpRight className="size-3.5 shrink-0" />
          </a>
        )}
      </div>
    </div>
  )
}

export function EditorialArtistProfile({
  data,
  actions,
  eyebrow = "KLEIO / Artist Profile",
}: {
  data: EditorialArtistProfileData
  actions?: ReactNode
  eyebrow?: string
}) {
  const works = (data.works ?? []).slice(0, 6)
  const [primaryWork, ...secondaryWorks] = works
  const tags = Array.from(new Set((data.tags ?? []).filter(Boolean))).slice(0, 8)
  const history = (data.history ?? []).filter(Boolean)
  const awards = (data.awards ?? []).filter(Boolean)
  const heroImage = data.heroImage || primaryWork?.image || secondaryWorks.find((work) => work.image)?.image || null
  const heroLabel = data.heroLabel || primaryWork?.title || "Featured practice"
  const recordExists = Boolean(data.education || history.length || awards.length)

  return (
    <article className="relative mx-auto w-full max-w-[1440px] overflow-hidden bg-[#FCFBFD] text-[#242129]">
      <div aria-hidden="true" className="absolute -right-32 top-24 size-[420px] rounded-full bg-[#EEE8FA]/55 blur-3xl" />
      <div aria-hidden="true" className="absolute -left-44 top-[54rem] size-[380px] rounded-full bg-[#F5F1FC]/70 blur-3xl" />

      <div className="relative z-10 px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <header id="top" className="border-b border-[#DDD7E7] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#746F7C]">
            <span>{eyebrow}</span>
            <nav className="flex items-center gap-5" aria-label="Artist profile sections">
              <a href="#works" className="hover:text-[#242129]">Works</a>
              <a href="#profile" className="hover:text-[#242129]">Profile</a>
              <a href="#contact" className="hover:text-[#242129]">Contact</a>
            </nav>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="max-w-[1080px] font-serif text-[clamp(3.25rem,8vw,7.35rem)] font-medium leading-[0.84] tracking-[-0.06em]">{data.name || "Artist name"}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-[#746F7C]">
                {data.role && <span>{data.role}</span>}
                {data.role && data.location && <span className="text-[#B0A9BA]">/</span>}
                {data.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{data.location}</span>}
                <span className="inline-flex items-center gap-1.5 text-[#6A5896]"><BadgeCheck className="size-3.5" />{data.passportLabel || "Creative Passport"}</span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#746F7C] lg:text-right">Artist-selected work and approved Creative Passport information, organized in one consistent review format.</p>
          </div>
        </header>

        <section className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.62fr)] lg:gap-10">
          <div className="min-w-0">
            <div className="relative">
              <ArtworkFrame src={heroImage} alt={`${data.name} featured artwork`} prominence="hero" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-[#201C25]/42 via-[#201C25]/10 to-transparent" />
              <div className="absolute bottom-4 left-4 z-20 max-w-[62%] text-white sm:bottom-5 sm:left-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/75">Featured work</p>
                <p className="mt-1 font-serif text-2xl tracking-[-0.03em] sm:text-3xl">{heroLabel}</p>
              </div>
              <PortraitOverlay name={data.name} src={data.portraitImage} />
            </div>

            <section id="works" className="scroll-mt-8 pt-10">
              <div className="mb-5 flex items-end justify-between gap-5 border-b border-[#DDD7E7] pb-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Selected works</p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] sm:text-4xl">Portfolio selection</h2>
                </div>
                <span className="hidden text-xs uppercase tracking-[0.14em] text-[#746F7C] sm:block">{works.length} {works.length === 1 ? "work" : "works"}</span>
              </div>

              {works.length ? (
                <div className="grid gap-6 md:grid-cols-12 md:items-start">
                  {primaryWork && (
                    <figure className="md:col-span-7">
                      <ArtworkFrame src={primaryWork.image} alt={primaryWork.title} prominence="primary" />
                      <WorkCaption work={primaryWork} index={0} />
                      {primaryWork.description && <p className="mt-3 text-sm leading-6 text-[#746F7C]">{primaryWork.description}</p>}
                    </figure>
                  )}
                  <div className="grid gap-6 md:col-span-5">
                    {secondaryWorks.map((work, index) => (
                      <figure key={work.id || `${work.title}-${index}`}>
                        <ArtworkFrame src={work.image} alt={work.title} />
                        <WorkCaption work={work} index={index + 1} />
                      </figure>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden border border-[#E2DCEE] bg-white px-6 py-14 text-center">
                  <LavenderGrain />
                  <div className="relative z-10"><p className="font-serif text-2xl text-[#4E426F]">No portfolio works added yet</p><p className="mt-2 text-sm text-[#746F7C]">Uploaded works will appear here in the shared KLEIO layout.</p></div>
                </div>
              )}
            </section>
          </div>

          <aside id="profile" className="kleio-context-panel scroll-mt-8 lg:self-start">
            <div className="relative overflow-hidden border-y border-[#DDD7E7] bg-white/84 px-1 py-5 backdrop-blur-sm sm:px-5 lg:border lg:p-5">
              <LavenderGrain />
              <div className="relative z-10">
                <p className="text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-[#6A5896]">Profile snapshot</p>
                <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em]">{data.name}</h2>
                {(data.role || data.location) && <p className="mt-2 text-sm leading-6 text-[#746F7C]">{[data.role, data.location].filter(Boolean).join(" · ")}</p>}
                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#4F4957]">{data.bio || "Biography not yet added."}</p>

                {tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {tags.map((tag) => <span key={tag} className="border border-[#D8D0F2] bg-white/75 px-2 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[#625676]">{tag}</span>)}
                  </div>
                )}

                {history.length > 0 && (
                  <div className="mt-6 border-t border-[#DDD7E7] pt-4">
                    <p className="text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-[#6A5896]">Selected record</p>
                    <ol className="mt-2 divide-y divide-[#E5E0EA] text-sm">
                      {history.slice(0, 3).map((entry, index) => (
                        <li key={`${entry}-${index}`} className="grid grid-cols-[1.75rem_1fr] gap-2 py-2.5 leading-5"><span className="text-xs text-[#A098AA]">{String(index + 1).padStart(2, "0")}</span><span>{entry}</span></li>
                      ))}
                    </ol>
                  </div>
                )}

                {(data.artistStatement || data.practiceDescription) && (
                  <details className="group mt-4 border-t border-[#DDD7E7] pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#4E426F]">Artist statement<span className="text-lg font-light transition-transform group-open:rotate-45">+</span></summary>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-[#625C70]">{data.artistStatement && <p className="whitespace-pre-wrap">{data.artistStatement}</p>}{data.practiceDescription && <p className="whitespace-pre-wrap">{data.practiceDescription}</p>}</div>
                  </details>
                )}

                {recordExists && (
                  <details className="group mt-4 border-t border-[#DDD7E7] pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#4E426F]">Professional record<span className="text-lg font-light transition-transform group-open:rotate-45">+</span></summary>
                    <div className="mt-3 space-y-4 text-sm leading-6 text-[#625C70]">
                      {data.education && <div><p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#8A8296]">Education</p><p className="mt-1 whitespace-pre-wrap">{data.education}</p></div>}
                      {history.length > 3 && <div><p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#8A8296]">Exhibitions and residencies</p><ul className="mt-1 space-y-1.5">{history.map((entry, index) => <li key={`${entry}-full-${index}`}>{entry}</li>)}</ul></div>}
                      {awards.length > 0 && <div><p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#8A8296]">Awards</p><ul className="mt-1 space-y-1.5">{awards.map((entry, index) => <li key={`${entry}-award-${index}`}>{entry}</li>)}</ul></div>}
                    </div>
                  </details>
                )}

                <ProfileLinks data={data} />
                {actions && <div className="mt-5 border-t border-[#DDD7E7] pt-4"><p className="mb-3 text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-[#6A5896]">Profile controls</p><div className="flex flex-wrap gap-2">{actions}</div></div>}
                <div className="mt-5 flex items-center gap-2 border-t border-[#DDD7E7] pt-4 text-xs text-[#746F7C]"><FileText className="size-3.5 text-[#6A5896]" />Structured through the artist&rsquo;s Creative Passport</div>
              </div>
            </div>
          </aside>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDD7E7] pt-4 text-[0.65rem] uppercase tracking-[0.14em] text-[#746F7C]">
          <span>One KLEIO layout · Artist-controlled images and information</span>
          <a href="#top" className="hover:text-[#242129]">Back to top</a>
        </footer>
      </div>
    </article>
  )
}
