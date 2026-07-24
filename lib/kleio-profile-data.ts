import { artists, institution, programs, type Artist, type Program } from "@/lib/kleio-data"
import { resolveArtistWorkImage } from "@/lib/kleio-artist-assets"

export type KleioSyntheticArtistProfile = {
  username: string
  displayName: string
  role: string
  location: string
  nativeOnKleio: boolean
  profileBadge: string
  portrait: string
  heroImage: string
  visualTheme: string
  accentColor: string
  website: string
  instagram: string
  email: string
  practiceTags: string[]
  shortBio: string
  artistStatement: string
  selectedWorks: Array<{
    title: string
    year: string
    medium: string
    details: string
    image: string
  }>
  materialsReady: Record<"bio" | "artistStatement" | "cvResume" | "portfolio" | "workSamples" | "references", boolean>
  themes: string[]
  availability: Record<"residencies" | "exhibitions" | "commissions" | "collaborations", "Open" | "Selective" | "Limited" | "Closed">
  history: string[]
  dashboardHero: NonNullable<Artist["dashboardHero"]>
}

export type KleioSyntheticInstitutionProfile = {
  username: string
  displayName: string
  institutionType: string
  location: string
  nativeOnKleio: boolean
  profileSource: "native" | "public-directory"
  coverImage: string
  website: string
  shortDescription: string
  tags: string[]
  publicSignals: {
    activePrograms: number
    applicationsInReview: number
    reviewers: number
    reportsInProgress: number
  }
  activePrograms: Array<{
    title: string
    type: string
    deadline: string
    status: string
    description: string
  }>
}

function requireArtist(id: string) {
  const artist = artists.find((entry) => entry.id === id)
  if (!artist) throw new Error(`Missing canonical artist seed: ${id}`)
  return artist
}

function formatDeadline(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

function programStatusForProfile(status: Program["status"]) {
  if (status === "Open") return "Open"
  if (status === "In Review" || status === "Final Selection") return "Reviewing"
  return status
}

function materialsReadyForArtist(artist: Artist): KleioSyntheticArtistProfile["materialsReady"] {
  return {
    bio: Boolean(artist.bio),
    artistStatement: Boolean(artist.statement),
    cvResume: artist.cvStatus === "Complete",
    portfolio: artist.documentStatus === "Complete",
    workSamples: Boolean(artist.works?.length),
    references: artist.referencesStatus === "Complete",
  }
}

function availabilityForArtist(artist: Artist): KleioSyntheticArtistProfile["availability"] {
  const entries = artist.availability ?? []
  const findStatus = (label: string, fallback: "Open" | "Selective" | "Limited" | "Closed") => {
    const found = entries.find((entry) => entry.label.toLowerCase().includes(label))
    if (!found) return fallback
    if (found.status === "Available" || found.status === "Actively Applying") return "Open"
    if (found.status === "Limited") return "Limited"
    return "Closed"
  }

  return {
    residencies: findStatus("residenc", "Open"),
    exhibitions: findStatus("exhibition", "Open"),
    commissions: findStatus("commission", "Selective"),
    collaborations: "Selective",
  }
}

function selectedWorksForArtist(artist: Artist): KleioSyntheticArtistProfile["selectedWorks"] {
  return (artist.works ?? []).slice(0, 6).map((work) => ({
    title: work.title,
    year: work.year,
    medium: work.medium,
    details: work.dimensions ?? work.medium,
    image: resolveArtistWorkImage(artist.id, work),
  }))
}

function historyForArtist(artist: Artist) {
  return (artist.exhibitions ?? []).slice(0, 4).map((entry) => `${entry.venue} · ${entry.year} · ${entry.type}`)
}

function artistProfile(
  artist: Artist,
  visual: { portrait: string; heroImage: string },
): KleioSyntheticArtistProfile {
  return {
    username: artist.id,
    displayName: artist.name,
    role: artist.discipline,
    location: artist.location,
    nativeOnKleio: true,
    profileBadge: "Creative Passport",
    portrait: visual.portrait,
    heroImage: visual.heroImage,
    visualTheme: artist.dashboardHero?.visualTheme ?? "studio-portrait",
    accentColor: artist.dashboardHero?.accentColor ?? "lavender",
    website: artist.website ?? `${artist.id}.studio`,
    instagram: artist.instagram ?? `@${artist.id}`,
    email: artist.contactEmail ?? `hello@${artist.id}.studio`,
    practiceTags: artist.tags,
    shortBio: artist.bio,
    artistStatement: artist.statement,
    selectedWorks: selectedWorksForArtist(artist),
    materialsReady: materialsReadyForArtist(artist),
    themes: artist.themes ?? artist.tags,
    availability: availabilityForArtist(artist),
    history: historyForArtist(artist),
    dashboardHero: artist.dashboardHero ?? {
      title: "Creative Passport",
      subtitle: "Reusable artist materials, selected works, and application context in one profile.",
      visualTheme: "studio-portrait",
      accentColor: "lavender",
    },
  }
}

const amina = requireArtist("amina-el-badri")
const meiLin = requireArtist("mei-lin-zhang")
const sofia = requireArtist("sofia-karim")

export const kleioSyntheticArtistProfiles: KleioSyntheticArtistProfile[] = [
  artistProfile(amina, {
    portrait: "/profile-assets/artists/amina-el-badri/portrait.png",
    heroImage: "/profile-assets/artists/amina-el-badri/hero-light-installation.png",
  }),
  artistProfile(meiLin, {
    portrait: "/profile-assets/artists/mei-lin-zhang/portrait.png",
    heroImage: "/profile-assets/artists/mei-lin-zhang/hero-paper-forms.png",
  }),
  artistProfile(sofia, {
    portrait: "/profile-assets/artists/sofia-karim/portrait.png",
    heroImage: "/profile-assets/artists/sofia-karim/hero-archive-projection.png",
  }),
]

export const kleioSyntheticInstitutionProfiles: KleioSyntheticInstitutionProfile[] = [
  {
    username: institution.id,
    displayName: institution.name,
    institutionType: institution.type,
    location: institution.location,
    nativeOnKleio: true,
    profileSource: "native",
    coverImage: "/profile-assets/institutions/kleio-arthouse/cover.png",
    website: "kleioarthouse.demo",
    shortDescription: institution.description,
    tags: ["Open Calls", "Residencies", "Review Workflow", "Reports", "Synthetic Demo"],
    publicSignals: {
      activePrograms: programs.length,
      applicationsInReview: 64,
      reviewers: 6,
      reportsInProgress: 2,
    },
    activePrograms: programs.map((program) => ({
      title: program.title,
      type: program.category,
      deadline: formatDeadline(program.deadline),
      status: programStatusForProfile(program.status),
      description: program.description,
    })),
  },
  {
    username: "lumen-residency",
    displayName: "Lumen Residency",
    institutionType: "Residency Program",
    location: "Washington, USA",
    nativeOnKleio: true,
    profileSource: "native",
    coverImage: "/profile-assets/institutions/lumen-residency/cover.png",
    website: "lumenresidency.org",
    shortDescription: "A residency for artists working in light, space, environment, and material-based practices. We support time, space, and connection.",
    tags: ["Residencies", "Mentorship", "Production", "Community", "Nature"],
    publicSignals: {
      activePrograms: 4,
      applicationsInReview: 76,
      reviewers: 8,
      reportsInProgress: 3,
    },
    activePrograms: [
      {
        title: "Lumen Arts Grant",
        type: "Grant",
        deadline: "Aug 14, 2026",
        status: "Open",
        description: "Support for artists building site-specific or light-responsive projects.",
      },
      {
        title: "Forest Studio Residency",
        type: "Residency",
        deadline: "Sep 30, 2026",
        status: "Reviewing",
        description: "A seasonal residency for artists working with ecology and installation.",
      },
    ],
  },
  {
    username: "casa-rivera-arts",
    displayName: "Casa Rivera Arts",
    institutionType: "Cultural Center",
    location: "San Juan, PR",
    nativeOnKleio: false,
    profileSource: "public-directory",
    coverImage: "/profile-assets/institutions/casa-rivera-arts/cover.png",
    website: "casariveraarts.org",
    shortDescription: "A community-rooted arts center supporting emerging artists through programs, exhibitions, workshops, and cultural exchange.",
    tags: ["Exhibitions", "Workshops", "Community", "Open Calls", "Education"],
    publicSignals: {
      activePrograms: 3,
      applicationsInReview: 41,
      reviewers: 6,
      reportsInProgress: 0,
    },
    activePrograms: [
      {
        title: "Caribbean Futures Fund",
        type: "Grant",
        deadline: "Aug 20, 2026",
        status: "Open",
        description: "A fund for artists working across Caribbean futures, memory, and community practice.",
      },
      {
        title: "Community Archive Lab",
        type: "Workshop",
        deadline: "Sep 10, 2026",
        status: "Draft",
        description: "A workshop series around local archives and artist-led documentation.",
      },
    ],
  },
]

export function getArtistProfileByUsername(username: string) {
  return kleioSyntheticArtistProfiles.find((artist) => artist.username === username)
}

export function getInstitutionProfileByUsername(username: string) {
  return kleioSyntheticInstitutionProfiles.find((profile) => profile.username === username)
}
