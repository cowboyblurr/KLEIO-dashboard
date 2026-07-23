import { assetPath } from "@/lib/asset-path"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { EditorialArtistProfile } from "@/components/kleio/profile/editorial-artist-profile"

type ArtistProfile = (typeof kleioSyntheticArtistProfiles)[number]

function optionalAsset(path: string) {
  return path && path !== "/placeholder.svg" ? assetPath(path) : null
}

export function ArtistPublicProfile({ profile }: { profile: ArtistProfile }) {
  return (
    <EditorialArtistProfile
      eyebrow="KLEIO / Guided-demo artist profile"
      data={{
        name: profile.displayName,
        role: profile.role,
        location: profile.location,
        portraitImage: optionalAsset(profile.portrait),
        heroImage: optionalAsset(profile.heroImage),
        heroLabel: profile.visualTheme.replaceAll("-", " "),
        bio: profile.shortBio,
        artistStatement: profile.artistStatement,
        tags: [...profile.practiceTags, ...profile.themes],
        works: profile.selectedWorks.map((work, index) => ({
          id: `${profile.username}-${index}`,
          title: work.title,
          year: work.year,
          medium: work.medium,
          details: work.details,
          image: optionalAsset(work.image),
        })),
        history: profile.history,
        website: profile.website,
        instagram: profile.instagram,
        email: profile.email,
        passportLabel: profile.profileBadge,
      }}
    />
  )
}
