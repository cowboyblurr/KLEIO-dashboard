import { artists } from "@/lib/kleio-data"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ArtistPassportView } from "@/components/kleio/artist-passport-view"

export function generateStaticParams() {
  return artists.map((a) => ({ artistId: a.id }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ artistId: string }>
}) {
  const { artistId } = await params
  return (
    <DashboardShell>
      <ArtistPassportView artistId={artistId} />
    </DashboardShell>
  )
}
