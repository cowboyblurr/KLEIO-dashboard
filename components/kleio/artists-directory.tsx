"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, BadgeCheck, ExternalLink, ClipboardList } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { submissions } from "@/lib/kleio-data"
import { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { getArtistMaterialReadiness } from "@/lib/kleio-artist-analytics"
import { publicArtistHref, submissionHref } from "@/lib/kleio-entity-routes"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

function filterChips(es: boolean) {
  return es
    ? ["Todas las disciplinas", "Instalación", "Papel", "Archivos", "Preparación de materiales", "Lista corta"]
    : ["All Disciplines", "Installation", "Paper", "Archives", "Material Readiness", "Shortlisted"]
}

const reviewStatusByUsername: Record<string, string> = {
  "amina-el-badri": "In Review",
  "mei-lin-zhang": "Shortlisted",
  "sofia-karim": "Materials Complete",
}

function reviewStatusStyle(status: string) {
  switch (status) {
    case "Shortlisted":
      return "bg-[oklch(0.94_0.04_150)] text-[oklch(0.4_0.13_150)]"
    case "Materials Complete":
      return "bg-[#F1ECFB] text-[#5B4B8A]"
    default:
      return "bg-[oklch(0.95_0.04_75)] text-[oklch(0.48_0.12_65)]"
  }
}

function reviewStatusLabel(status: string, es: boolean) {
  if (!es) return status
  const labels: Record<string, string> = {
    "In Review": "En revisión",
    Shortlisted: "Lista corta",
    "Materials Complete": "Materiales completos",
  }
  return labels[status] ?? status
}

function ArtistPortrait({ portrait, displayName }: { portrait: string; displayName: string }) {
  const [failed, setFailed] = useState(false)
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)
  if (!portrait || failed) {
    return (
      <div className="grid size-16 place-items-center rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">
        <span className="font-serif text-lg text-[#5B4B8A]">{initials}</span>
      </div>
    )
  }
  return (
    <div className="size-16 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetPath(portrait)} alt={displayName} className="h-full w-full object-cover object-center" onError={() => setFailed(true)} />
    </div>
  )
}

export function ArtistsDirectory() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [query, setQuery] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const suggestions = useMemo(() => {
    const values = kleioSyntheticArtistProfiles.flatMap((artist) => [
      artist.displayName,
      artist.role,
      artist.location,
      artist.profileBadge,
      ...artist.practiceTags,
      ...artist.themes,
    ])
    const normalized = query.trim().toLowerCase()
    const seen = new Set<string>()
    return values
      .filter((value) => !normalized || value.toLowerCase().includes(normalized))
      .filter((value) => {
        const key = value.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
  }, [query])

  const filteredArtists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.startsWith("all") || q.startsWith("todas")) return kleioSyntheticArtistProfiles
    return kleioSyntheticArtistProfiles.filter(
      (artist) =>
        [artist.displayName, artist.role, artist.location, artist.profileBadge, ...artist.practiceTags, ...artist.themes]
          .join(" ")
          .toLowerCase()
          .includes(q) ||
        ((q === "shortlisted" || q === "lista corta") && reviewStatusByUsername[artist.username] === "Shortlisted"),
    )
  }, [query])

  return (
    <main className="h-full overflow-auto px-6 py-6">
      <div className="mx-auto min-w-[760px] max-w-[1180px] space-y-5">
        <header>
          <h1 className="font-serif text-2xl font-semibold tracking-tight xl:text-3xl" style={{ color: inkColor }}>
            {es ? "Artistas" : "Artists"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm" style={{ color: mutedColor }}>
            {es
              ? "Busca artistas, Pasaportes Creativos, materiales enviados y contexto de revisión dentro del espacio institucional."
              : "Search artists, Creative Passports, submitted materials, and review context across your institution workspace."}
          </p>
        </header>

        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: mutedColor }} />
            <input
              type="search"
              value={query}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              onChange={(event) => {
                setQuery(event.target.value)
                setSuggestionsOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestionsOpen(false)
                if (event.key === "Enter" && suggestions[0]) {
                  event.preventDefault()
                  setQuery(suggestions[0])
                  setSuggestionsOpen(false)
                }
              }}
              placeholder={es ? "Buscar artistas, disciplinas, ubicaciones, materiales…" : "Search artists, disciplines, locations, materials..."}
              className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#D8D0F2] focus:ring-2 focus:ring-[#F1ECFB]"
              style={{ borderColor: lavenderSoftLine, color: inkColor }}
            />
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_16px_40px_rgba(82,64,130,0.12)]">
                <p className="border-b border-[#E7E1F7] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">
                  {es ? "Búsquedas sugeridas" : "Suggested artist searches"}
                </p>
                <div className="p-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setQuery(suggestion)
                        setSuggestionsOpen(false)
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterChips(es).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(chip.startsWith("All") || chip.startsWith("Todas") ? "" : chip)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F7F4FF]"
                style={{ borderColor: lavenderSoftLine, color: inkColor }}
              >
                {chip}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs" style={{ color: mutedColor }}>
            {es ? `Mostrando ${filteredArtists.length} registros de artistas.` : `Showing ${filteredArtists.length} artist records.`}
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredArtists.map((artist) => {
            const readiness = getArtistMaterialReadiness(artist)
            const reviewStatus = reviewStatusByUsername[artist.username] ?? "In Review"
            const submission = submissions.find((entry) => entry.artistId === artist.username)
            const profileHref = publicArtistHref(artist.username)

            return (
              <article
                key={artist.username}
                className="flex flex-col rounded-2xl border bg-white p-5 transition-colors hover:border-[#D8D0F2]"
                style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}
              >
                <div className="flex items-start gap-3">
                  <Link href={profileHref} aria-label={es ? `Abrir perfil completo de ${artist.displayName}` : `Open ${artist.displayName}'s full profile`} className="shrink-0 transition-opacity hover:opacity-80">
                    <ArtistPortrait portrait={artist.portrait} displayName={artist.displayName} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate font-serif text-base font-semibold">
                        <Link href={profileHref} className="transition-colors hover:text-[#5B4B8A]" style={{ color: inkColor }}>
                          {artist.displayName}
                        </Link>
                      </h2>
                      <BadgeCheck className="size-4 shrink-0" style={{ color: lavenderDeep }} aria-label={es ? "Pasaporte Creativo" : "Creative Passport"} />
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{artist.role} · {artist.location}</p>
                    <span className="mt-1.5 inline-flex rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: lavenderDeep }}>
                      {artist.profileBadge}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {artist.practiceTags.slice(0, 4).map((tag) => <ProfileChip key={tag} label={tag} />)}
                </div>

                <Link href={profileHref} className="mt-4 block space-y-2 rounded-xl border px-3 py-2.5 transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: inkColor }}>{es ? "Preparación de materiales" : "Materials readiness"}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: lavenderDeep }}>{readiness.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">
                    <div className="h-full rounded-full bg-[#5B4B8A] transition-all" style={{ width: `${readiness.pct}%` }} />
                  </div>
                </Link>

                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-semibold ${reviewStatusStyle(reviewStatus)}`}>
                    <ClipboardList className="size-3" />
                    {reviewStatusLabel(reviewStatus, es)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={profileHref} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    <ExternalLink className="size-3.5" />
                    {es ? "Perfil completo" : "Full Profile"}
                  </Link>
                  {submission && (
                    <Link href={submissionHref(submission.id)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: lavenderDeep }}>
                      <ClipboardList className="size-3.5" />
                      {es ? "Postulación" : "Submission"}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {filteredArtists.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: mutedColor }}>
            {es ? "Ningún artista coincide con tu búsqueda. Prueba otra disciplina, ubicación o nombre." : "No artists match your search. Try a different discipline, location, or name."}
          </p>
        )}
      </div>
    </main>
  )
}
