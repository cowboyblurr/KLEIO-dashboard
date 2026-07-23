import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { KleioSyntheticArtistProfile } from "@/lib/kleio-profile-data"
import { ArtistPublicProfile } from "@/components/kleio/profile/artist-public-profile"

export function EditorialArtistProfileTest({ profile }: { profile: KleioSyntheticArtistProfile }) {
  return (
    <main className="h-full overflow-y-auto bg-white text-[#242129]">
      <div className="border-b border-[#DDD7E7] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link href="/artist-dashboard/profile/" className="inline-flex items-center gap-1.5 font-medium text-[#6A5896] hover:opacity-70">
              <ArrowLeft className="size-3.5" />
              Current profile
            </Link>
            <span className="hidden h-3 w-px bg-[#DDD7E7] sm:block" />
            <span className="text-[#746F7C]">Shared editorial layout · synthetic demo data</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/artist-dashboard/passport/" className="text-[#746F7C] hover:text-[#242129]">Edit passport</Link>
            <Link href="/artist-dashboard/portfolio/" className="text-[#746F7C] hover:text-[#242129]">Manage works</Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-10">
        <ArtistPublicProfile profile={profile} />
      </div>
    </main>
  )
}
