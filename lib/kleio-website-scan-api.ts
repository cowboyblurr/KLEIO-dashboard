import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import type { WebsiteImportSession } from "@/lib/kleio-website-import"

export type WebsiteScanStatus =
  | "analyzing"
  | "review_ready"
  | "limited_review"
  | "image_only_review"
  | "manual_input_recommended"
  | "importing"
  | "completed"
  | "failed"
  | "blocked"
  | "expired"
  | "dismissed"

export type WebsiteScanSummary = {
  submitted_website?: string
  canonical_website?: string
  outcome?: WebsiteScanStatus
  pages_discovered?: number
  pages_collected?: number
  pages_skipped?: number
  pages_blocked?: number
  text_sections_found?: number
  metadata_found?: number
  structured_data_found?: number
  valid_images_found?: number
  weak_candidates_rejected?: number
  extraction_methods?: string[]
  javascript_rendering?: "not_required" | "required" | "recommended_unavailable"
  gemini_called?: boolean
  limitations?: string[]
}

export type WebsiteScanSession = Omit<WebsiteImportSession, "status"> & {
  status: WebsiteScanStatus
  scan_summary?: WebsiteScanSummary
  dismissed_at?: string | null
}

type FunctionPayload = {
  error?: unknown
  code?: unknown
  message?: unknown
  outcome?: unknown
  retryable?: unknown
}

const messages: Record<string, string> = {
  authentication_required: "Sign in again to continue. Your current website URL has not been saved.",
  artist_account_required: "Website Import Assist is available only from an artist workspace.",
  invalid_website_url: "Enter a complete public website address, such as https://yourportfolio.com.",
  https_required: "Use the secure HTTPS version of the artist website.",
  private_network_url_blocked: "KLEIO can analyze only public websites. Local, private-network, and internal addresses are blocked.",
  website_disallows_automated_access: "This website does not allow automated review. Try a direct public page, upload a CV or statement, or import artwork from your device or Google Drive.",
  unsupported_source_type: "The address did not return a supported public webpage or image.",
  source_too_large: "The website response was too large for a safe beta scan. Try a direct About, Work, Portfolio, or CV page.",
  website_dns_lookup_failed: "KLEIO could not find this website on the public internet. Check the address and try again.",
  website_request_timeout: "The website took too long to respond. Your existing KLEIO information remains unchanged.",
  website_fetch_failed: "KLEIO could not retrieve the public website. Check the address or try a direct page.",
  cross_origin_redirect_blocked: "The website redirected to a different domain, so KLEIO stopped the scan for safety.",
  website_scan_validation_failed: "KLEIO reached the scanner but could not validate the collected evidence. Nothing was saved to the Creative Passport.",
  website_import_service_unavailable: "Website Import Assist is temporarily unavailable. Your existing Passport and Media Library remain unchanged.",
  website_scan_has_insufficient_evidence: "Not enough public website material was collected. KLEIO reached the website but could not read enough text or valid artwork information to organize it with Gemini. The site may load its content after JavaScript. Try a direct About, Portfolio, Work, or CV page, or import files from your device or Google Drive.",
  javascript_rendering_unavailable: "This website appears to require JavaScript rendering, which is not available in the current beta collector. Try a direct About or Work page, paste public text, or upload files.",
  no_valid_images_found: "KLEIO did not find an image that passed its public URL, content-type, and file-signature checks.",
  gemini_not_configured: "AI organization is temporarily unavailable. The completed deterministic scan remains available for manual review.",
  gemini_model_not_configured: "AI organization is temporarily unavailable. The completed deterministic scan remains available for manual review.",
  gemini_provider_unavailable: "Gemini is temporarily unavailable. Your website scan and review progress remain saved.",
  gemini_rate_limited: "Gemini is currently rate-limited. Your website scan and review progress remain saved.",
  gemini_timeout: "Gemini took too long to respond. No unreviewed proposal was saved.",
  gemini_invalid_structured_output: "The Gemini response did not pass KLEIO’s source and schema checks, so no proposals were saved.",
  ai_output_failed_validation: "The Gemini response did not pass KLEIO’s source and schema checks, so no proposals were saved.",
  website_ai_daily_limit_reached: "Today’s website-organization allowance has been reached. Your scan and review progress remain saved.",
  website_ai_session_limit_reached: "This scan has reached its organization limit. Continue reviewing the existing result or start a new scan.",
  website_import_session_not_found: "This website scan could not be found or is no longer available.",
  website_scan_expired: "This website scan has expired. Start a new scan to continue.",
  unsupported_import_source: "Use the source’s supported connected import, a public personal portfolio website, or upload original files.",
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

async function payloadFromError(error: unknown): Promise<FunctionPayload> {
  const context = error && typeof error === "object" ? (error as { context?: unknown }).context : undefined
  if (context instanceof Response) {
    try {
      return await context.clone().json() as FunctionPayload
    } catch {
      try {
        return { message: await context.clone().text() }
      } catch {
        return {}
      }
    }
  }
  return {}
}

export async function websiteFunctionMessage(error: unknown, fallback: string, suppliedPayload?: FunctionPayload) {
  const payload = suppliedPayload || await payloadFromError(error)
  const code = text(payload.code) || text(payload.error)
  if (code && messages[code]) return messages[code]
  const safeProviderMessage = text(payload.message)
  if (safeProviderMessage && code === "unsupported_import_source") return safeProviderMessage
  const errorMessage = error instanceof Error ? error.message : ""
  const normalized = errorMessage.toLowerCase().replaceAll("_", " ")
  const matched = Object.keys(messages).find((key) => normalized.includes(key.replaceAll("_", " ")))
  if (matched) return messages[matched]
  return fallback
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error(messages.authentication_required)
  if (account.profile.role !== "artist") throw new Error(messages.artist_account_required)
  return account
}

export async function analyzeWebsiteScan(websiteUrl: string, ownershipConfirmed: boolean): Promise<WebsiteScanSession> {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-website", {
    body: { action: "analyze", websiteUrl, ownershipConfirmed },
  })
  if (error) throw new Error(await websiteFunctionMessage(error, "KLEIO could not analyze this website."))
  if (data?.error) throw new Error(await websiteFunctionMessage(undefined, "KLEIO could not analyze this website.", data as FunctionPayload))
  if (!data?.session) throw new Error("KLEIO completed the request but did not receive a reviewable scan.")
  return data.session as WebsiteScanSession
}

export async function dismissWebsiteScan(sessionId: string) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-website", {
    body: { action: "dismiss", sessionId },
  })
  if (error) throw new Error(await websiteFunctionMessage(error, "The active website scan could not be cleared."))
  if (data?.error) throw new Error(await websiteFunctionMessage(undefined, "The active website scan could not be cleared.", data as FunctionPayload))
  return data.session as { id: string; status: "dismissed"; dismissed_at: string }
}

export function scanAllowsTextOrganization(session: Pick<WebsiteScanSession, "status" | "scan_summary" | "pages">) {
  if (["manual_input_recommended", "image_only_review", "blocked", "failed", "expired", "dismissed"].includes(session.status)) return false
  const summaryText = Number(session.scan_summary?.text_sections_found || 0)
  if (summaryText > 0) return true
  return session.pages.some((page) => Boolean(page.description || page.headings?.length || page.paragraphs?.length))
}
