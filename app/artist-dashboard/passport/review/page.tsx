import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { PassportUpdatesInbox } from "@/components/kleio/passport-updates-inbox"

export const metadata: Metadata = {
  title: "KLEIO — Passport Updates for Review",
  description: "Review extracted artist information, preserve source evidence, and decide what becomes part of the Creative Passport.",
}

export default function Page() {
  return (
    <ArtistShell>
      <PassportUpdatesInbox />
    </ArtistShell>
  )
}
