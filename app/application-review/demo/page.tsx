import type { Metadata } from "next"
import { RecipientReviewDemo } from "./recipient-review-demo"

export const metadata: Metadata = {
  title: "KLEIO — Recipient Review Room Demo",
  description: "Synthetic preview of KLEIO's compact recipient submission review experience.",
  robots: { index: false, follow: false, nocache: true },
}

export default function RecipientReviewDemoPage() {
  return <RecipientReviewDemo />
}
