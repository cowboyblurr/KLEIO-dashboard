"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Pencil, UserRound } from "lucide-react"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { EditorialArtistProfile } from "@/components/kleio/profile/editorial-artist-profile"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { disciplineLabel } from "@/lib/kleio-artist-taxonomy"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  type ArtistPassportRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  loadArtistProfilePresentation,
  type ArtistProfilePresentationRecord,
} from "@/lib/kleio-profile-presentation"

const primary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]"

const COPY = {
  en: {
    privateTitle: "Private profile preview.",
    privateBody: "Built from this account’s saved Creative Passport and portfolio.",
    edit: "Edit information",
    works: "Manage works",
    loading: "Loading your profile preview…",
    emptyTitle: "Create your Creative Passport first",
    emptyBody: "KLEIO generates the artist profile only from information and works saved to this authenticated account.",
    create: "Create Creative Passport",
    eyebrow: "KLEIO / Private artist profile preview",
    missingName: "Artist name not added",
    artist: "Artist",
    featured: "Featured practice",
    passport: "Creative Passport",
    editProfile: "Edit profile",
    managePortfolio: "Manage portfolio",
  },
  es: {
    privateTitle: "Vista previa privada del perfil.",
    privateBody: "Creada con el Pasaporte Creativo y el portafolio guardados en esta cuenta.",
    edit: "Editar información",
    works: "Gestionar obras",
    loading: "Cargando la vista previa del perfil…",
    emptyTitle: "Primero crea tu Pasaporte Creativo",
    emptyBody: "KLEIO genera el perfil únicamente con la información y las obras guardadas en esta cuenta autenticada.",
    create: "Crear Pasaporte Creativo",
    eyebrow: "KLEIO / Vista previa privada del perfil artístico",
    missingName: "Nombre artístico no añadido",
    artist: "Artista",
    featured: "Práctica destacada",
    passport: "Pasaporte Creativo",
    editProfile: "Editar perfil",
    managePortfolio: "Gestionar portafolio",
  },
} as const

function splitHistory(value: string) {
  return value.split(/\n|;/).map((item) => item.trim()).filter(Boolean)
}

function uniqueDisplayValues(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function LiveArtistProfilePreview() {
  const { locale } = useKleioLocale()
  const copy = COPY[locale]
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [presentation, setPresentation] = useState<ArtistProfilePresentationRecord>({
    profile_image_path: null,
    profile_image_url: null,
    featured_work_id: null,
    profile_image_position_x: 50,
    profile_image_position_y: 50,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([loadArtistPassport(), loadPortfolioWorks(), loadArtistProfilePresentation()])
      .then(([profile, portfolio, profilePresentation]) => {
        if (!active) return
        setPassport(profile)
        setWorks(portfolio)
        setPresentation(profilePresentation)
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const history = useMemo(() => splitHistory(passport?.exhibition_history || ""), [passport?.exhibition_history])
  const awards = useMemo(() => splitHistory(passport?.awards || ""), [passport?.awards])
  const featuredWork = useMemo(() => {
    const selected = works.find((work) => work.id === presentation.featured_work_id && work.image_url)
    return selected || works.find((work) => work.image_url) || works[0] || null
  }, [presentation.featured_work_id, works])
  const disciplines = (passport?.disciplines ?? []).map((value) => disciplineLabel(value, locale))
  const profileTags = uniqueDisplayValues([...disciplines, ...(passport?.mediums ?? [])])

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-4 text-[#292631] sm:px-6">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <ArtistProfileContextBar active="profile" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE9F8] pb-3 text-xs text-[#746E80]">
          <p><strong className="font-semibold text-[#292631]">{copy.privateTitle}</strong> {copy.privateBody}</p>
          <div className="flex flex-wrap gap-2"><Link href="/artist-dashboard/passport/" className={secondary}><Pencil className="size-3.5" />{copy.edit}</Link><Link href="/artist-dashboard/portfolio/" className={primary}>{copy.works}</Link></div>
        </div>

        {loading && <div role="status" className="flex items-center gap-2 border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{copy.loading}</div>}
        {error && <div role="alert" className="border border-red-200 bg-white p-5 text-sm text-red-700">{error}</div>}
        {!loading && !error && !passport && <section className="border border-[#E7E1F7] bg-white p-7 text-center"><UserRound className="mx-auto size-7 text-[#5B4B8A]" /><h2 className="mt-3 font-serif text-xl font-semibold">{copy.emptyTitle}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{copy.emptyBody}</p><Link href="/artist-dashboard/passport/" className={`${primary} mt-5`}>{copy.create}</Link></section>}

        {!loading && !error && passport && (
          <div className="kleio-live-artist-profile-position">
            <style>{`.kleio-live-artist-profile-position img[alt$=" portrait"] { object-position: ${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}% !important; }`}</style>
            <EditorialArtistProfile
              eyebrow={copy.eyebrow}
              data={{
                name: passport.professional_name || copy.missingName,
                role: disciplines.join(" · ") || copy.artist,
                location: passport.location,
                portraitImage: presentation.profile_image_url,
                heroImage: featuredWork?.image_url || null,
                heroLabel: featuredWork?.title || copy.featured,
                bio: passport.bio,
                artistStatement: passport.artist_statement,
                practiceDescription: passport.practice_description,
                tags: profileTags,
                works: works.map((work) => ({ id: work.id, title: work.title, year: work.year, medium: work.medium, details: work.dimensions, description: work.description, image: work.image_url })),
                history,
                education: passport.education,
                awards,
                website: passport.website_url,
                instagram: passport.instagram_url,
                passportLabel: copy.passport,
              }}
              actions={<><Link href="/artist-dashboard/passport/" className={secondary}>{copy.editProfile}</Link><Link href="/artist-dashboard/portfolio/" className={secondary}>{copy.managePortfolio}</Link></>}
            />
          </div>
        )}
      </div>
    </main>
  )
}
