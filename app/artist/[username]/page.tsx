import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArtistPublicProfile } from "@/components/kleio/profile/artist-public-profile"
import { PublicPageShell } from "@/components/kleio/public-page-shell"
import { getArtistProfileByUsername, kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { getSubmissionArtistProfile, submissionArtistUsernames } from "@/lib/kleio-submission-profile"

function getDemoArtistProfile(username: string) {
  return getArtistProfileByUsername(username) ?? getSubmissionArtistProfile(username)
}

export function generateStaticParams() {
  return Array.from(
    new Set([
      ...kleioSyntheticArtistProfiles.map((artist) => artist.username),
      ...submissionArtistUsernames,
    ]),
  ).map((username) => ({ username }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const artist = getDemoArtistProfile(username)

  if (!artist) {
    return { title: "Artist Profile | KLEIO" }
  }

  return {
    title: `${artist.displayName} | KLEIO Creative Passport`,
    description: `${artist.displayName}'s public Creative Passport: selected works, artist-authored materials, practice context, and application-ready profile. Synthetic demo profile.`,
  }
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const artist = getDemoArtistProfile(username)

  if (!artist) notFound()

  return (
    <PublicPageShell>
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <ArtistPublicProfile profile={artist} />
      </div>
    </PublicPageShell>
  )
}
