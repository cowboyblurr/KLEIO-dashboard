import { getI18nIntegrity } from "@/lib/kleio-i18n"
import {
  publicRoutes,
  artistWorkspaceRoutes,
  institutionWorkspaceRoutes,
  collaboratorWorkspaceRoutes,
  allDemoRoutes,
} from "@/lib/kleio-route-registry"
import { analyticsIntegrity } from "@/lib/kleio-analytics"
import { artistAnalytics } from "@/lib/kleio-artist-analytics"
import { collaboratorAnalyticsIntegrity } from "@/lib/kleio-collaborator-analytics"

const i18nIntegrity = getI18nIntegrity()

const institutionAnalyticsChecksPass =
  analyticsIntegrity.applicationsOverTimeTotal === analyticsIntegrity.totalApplications &&
  analyticsIntegrity.statusBreakdownTotal <= analyticsIntegrity.totalApplications

const artistStatusTotal = Object.values(artistAnalytics.applicationStatusCounts).reduce(
  (sum, count) => sum + count,
  0,
)

const artistAnalyticsChecksPass =
  artistAnalytics.passportCompletenessPct >= 0 &&
  artistAnalytics.passportCompletenessPct <= 100 &&
  artistAnalytics.materialsReadyCount <= artistAnalytics.materialsTotalCount &&
  artistAnalytics.applicationCompletionRate >= 0 &&
  artistAnalytics.applicationCompletionRate <= 100 &&
  artistStatusTotal >= artistAnalytics.activeApplications

export const kleioContentIntegrity = {
  i18n: i18nIntegrity,
  routeCounts: {
    public: publicRoutes.length,
    artist: artistWorkspaceRoutes.length,
    institution: institutionWorkspaceRoutes.length,
    collaborator: collaboratorWorkspaceRoutes.length,
    total: allDemoRoutes.length,
  },
  analytics: {
    institution: institutionAnalyticsChecksPass,
    artist: artistAnalyticsChecksPass,
    collaborator: collaboratorAnalyticsIntegrity.allChecksPass,
  },
  allChecksPass:
    i18nIntegrity.allChecksPass &&
    institutionAnalyticsChecksPass &&
    artistAnalyticsChecksPass &&
    collaboratorAnalyticsIntegrity.allChecksPass,
}

if (process.env.NODE_ENV === "development" && !kleioContentIntegrity.allChecksPass) {
  console.warn("KLEIO content integrity check failed", kleioContentIntegrity)
}
