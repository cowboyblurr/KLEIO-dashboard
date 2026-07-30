import type { Metadata } from "next"
import { PublicOpportunityDirectory } from "@/components/kleio/public-opportunity-directory"

export const metadata: Metadata = {
  title: "KLEIO — Artist opportunities",
  description: "Browse sourced grants, residencies, open calls, awards, and other artist opportunities before creating an account.",
}

export default function Page() {
  return <PublicOpportunityDirectory />
}
