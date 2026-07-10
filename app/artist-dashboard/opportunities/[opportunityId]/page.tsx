import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOpportunityDetailPageView } from "@/components/kleio/artist-workspace/artist-opportunity-detail-page-view"
import { artistOpportunityDirectory, getArtistOpportunityById } from "@/lib/kleio-opportunities"

export function generateStaticParams() {
  return artistOpportunityDirectory.map((opportunity) => ({ opportunityId: opportunity.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ opportunityId: string }>
}): Promise<Metadata> {
  const { opportunityId } = await params
  const opportunity = getArtistOpportunityById(opportunityId)

  if (!opportunity) return { title: "Opportunity | KLEIO" }

  return {
    title: `${opportunity.title} | KLEIO Opportunity`,
    description: `${opportunity.title} from ${opportunity.institution}. Synthetic demo opportunity with fit, readiness, deadline, materials, and draft support.`,
  }
}

export default async function Page({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params
  const opportunity = getArtistOpportunityById(opportunityId)

  if (!opportunity) notFound()

  return (
    <ArtistShell>
      <ArtistOpportunityDetailPageView opportunity={opportunity} />
    </ArtistShell>
  )
}
