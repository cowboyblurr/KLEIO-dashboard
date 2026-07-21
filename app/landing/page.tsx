import type { Metadata } from "next"
import { LandingPage } from "@/components/kleio/landing-page"

/** Legacy duplicate of `/` — kept so older `/landing/` links keep working. */
export const metadata: Metadata = {
  title: "KLEIO Arthouse",
  description:
    "Artist applications and institutional review, brought together in one structured workspace.",
}

export default function Page() {
  return <LandingPage />
}
