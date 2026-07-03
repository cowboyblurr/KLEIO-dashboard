import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { InstitutionPublicProfile } from "@/components/kleio/profile/institution-public-profile"
import { PublicPageShell } from "@/components/kleio/public-page-shell"
import {
  getInstitutionProfileByUsername,
  kleioSyntheticInstitutionProfiles,
} from "@/lib/kleio-profile-data"

export function generateStaticParams() {
  return kleioSyntheticInstitutionProfiles.map((institution) => ({ username: institution.username }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const institution = getInstitutionProfileByUsername(username)

  if (!institution) {
    return { title: "Institution Profile | KLEIO" }
  }

  return {
    title: `${institution.displayName} | KLEIO Institution Profile`,
    description: `${institution.displayName}'s public KLEIO profile: active programs, review workflow, and artist expectations. Synthetic demo profile.`,
  }
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const institution = getInstitutionProfileByUsername(username)

  if (!institution) notFound()

  return (
    <PublicPageShell>
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <InstitutionPublicProfile profile={institution} />
      </div>
    </PublicPageShell>
  )
}
