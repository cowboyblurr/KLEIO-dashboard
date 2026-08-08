import type { Metadata } from "next"
import { RecipientConversationReturn } from "@/components/kleio/recipient-conversation-return"

export const metadata: Metadata = {
  title: "KLEIO — Application Conversation",
  description: "Secure application-specific conversation between an artist and verified recipient.",
  robots: { index: false, follow: false, nocache: true },
}

export default function ApplicationConversationPage() {
  return <RecipientConversationReturn />
}
