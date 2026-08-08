import { Suspense } from "react"
import type { Metadata } from "next"
import { RecipientConversationReturn } from "@/components/kleio/recipient-conversation-return"

export const metadata: Metadata = {
  title: "KLEIO — Application Conversation",
  description: "Secure application-specific conversation between an artist and verified recipient.",
  robots: { index: false, follow: false, nocache: true },
}

export default function ApplicationConversationPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 text-sm text-[#766F7A]">Opening your KLEIO conversation…</main>}>
      <RecipientConversationReturn />
    </Suspense>
  )
}
