import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMessagesPageView } from "@/components/kleio/artist-workspace/artist-messages-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistMessageCenter } from "@/components/kleio/live-artist-message-center"

export const metadata: Metadata = {
  title: "KLEIO — Messages",
  description: "Reply to institution invitations and continue authorized opportunity or application conversations.",
}

function FocusedLiveMessages() {
  return (
    <div className="h-full min-h-0 [&>div]:!flex [&>div]:!min-h-0 [&>div]:!flex-col [&>div>div:first-child]:!min-h-0 [&>div>div:first-child]:!flex-1 [&>div>button]:!static [&>div>button]:!order-first [&>div>button]:!m-3 [&>div>button]:!min-h-10 [&>div>button]:!w-fit [&>div>button]:!self-end [&>div>button]:!rounded-xl [&>div>button]:!shadow-[0_10px_30px_rgba(82,64,130,0.12)] sm:[&>div>button]:!mx-5">
      <LiveArtistMessageCenter />
    </div>
  )
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<FocusedLiveMessages />} preview={<ArtistMessagesPageView />} />
    </ArtistShell>
  )
}
