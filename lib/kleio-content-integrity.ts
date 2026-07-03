import { getI18nIntegrity } from "@/lib/kleio-i18n"
import {
  publicRoutes,
  artistWorkspaceRoutes,
  institutionWorkspaceRoutes,
  collaboratorWorkspaceRoutes,
} from "@/lib/kleio-route-registry"
import { analyticsIntegrity } from "@/lib/kleio-analytics"
import { artistAnalyticsIntegrity } from "@/lib/kleio-artist-analytics"
import { collaboratorAnalyticsIntegrity } from "@/lib/kleio-collaborator-analytics"

export const kleioContentIntegrity = {
  i18n: getI18nIntegrity(),
  routeCounts: {
    public: publicRoutes.length,
    artist: artistWorkspaceRoutes.length,
    institution: institutionWorkspaceRoutes.length,
    collaborator: collaboratorWorkspaceRoutes.length,
    total:
      publicRoutes.length +
      artistWorkspaceRoutes.length +
      institutionWorkspaceRoutes.length +
      collaboratorWorkspaceRoutes.length,
  },
  analytics: {
    institution: analyticsIntegrity.allChecksPass,
    artist: artistAnalyticsIntegrity.allChecksPass,
    collaborator: collaboratorAnalyticsIntegrity.allChecksPass,
  },
  allChecksPass:
    getI18nIntegrity().allChecksPass &&
    analyticsIntegrity.allChecksPass &&
    artistAnalyticsIntegrity.allChecksPass &&
    collaboratorAnalyticsIntegrity.allChecksPass,
}

if (process.env.NODE_ENV === "development" && !kleioContentIntegrity.allChecksPass) {
  console.warn("KLEIO content integrity check failed", kleioContentIntegrity)
}
