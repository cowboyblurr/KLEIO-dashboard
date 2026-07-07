import type { Metadata } from "next"
import { RolesPermissionsPage } from "@/components/kleio/roles-permissions-page"

export const metadata: Metadata = {
  title: "KLEIO — Roles & Permissions",
  description: "Preview the intended KLEIO access model for artists, institutions, reviewers, and collaborators.",
}

export default function Page() {
  return <RolesPermissionsPage />
}
