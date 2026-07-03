import type { Metadata } from "next"
import { LandingPage } from "@/components/kleio/landing-page"

/** Legacy duplicate of `/` — kept so older `/landing/` links keep working. */
export const metadata: Metadata = {
  title: "KLEIO Arthouse",
  description:
    "A shared workspace for artists and institutions to manage submissions, reviews, opportunities, and cultural records with clarity.",
}

export default function Page() {
  return <LandingPage />
}
