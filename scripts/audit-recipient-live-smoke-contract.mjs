import fs from "node:fs"

const workflow = fs.readFileSync(".github/workflows/recipient-live-smoke.yml", "utf8")
const browser = fs.readFileSync("scripts/live-recipient-browser-smoke.mjs", "utf8")
const rootLayout = fs.readFileSync("app/layout.tsx", "utf8")
const errorNormalizer = fs.readFileSync("lib/kleio-edge-function-error.ts", "utf8")
const reviewClient = fs.readFileSync("lib/kleio-recipient-application.ts", "utf8")
const conversationClient = fs.readFileSync("lib/kleio-recipient-conversation-return.ts", "utf8")
const failures = []

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}
function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

requirePattern(workflow, /workflow_run:[\s\S]*Deploy KLEIO Dashboard to GitHub Pages/, "Live recipient smoke must run after successful GitHub Pages deployment.")
requirePattern(workflow, /application-review\/demo\//, "Live smoke must verify the synthetic Review Room route.")
requirePattern(workflow, /application-review\/conversation\//, "Live smoke must verify the conversation return route.")
requirePattern(workflow, /recipient-application-review/, "Live smoke must probe the recipient Edge Function.")
requirePattern(workflow, /application-conversation/, "Live smoke must probe the conversation Edge Function.")
requirePattern(workflow, /test "\$status" = "401"/, "Conversation Edge Function must be proven closed to anonymous requests.")
requirePattern(workflow, /live-recipient-browser-smoke\.mjs/, "Live smoke must execute a browser interaction test rather than HTML-only assertions.")
requirePattern(workflow, /actions\/upload-artifact@v4/, "Live browser smoke must preserve screenshot evidence.")
forbidPattern(workflow, /vercel/i, "Recipient production validation must not depend on Vercel.")
forbidPattern(rootLayout, /@vercel\/analytics|<Analytics\b/, "The GitHub Pages root layout must not inject Vercel Analytics or request /_vercel/ runtime assets.")

requirePattern(browser, /This application link is invalid or no longer available\./, "Browser smoke must prove invalid secure tokens fail closed after hydration.")
requirePattern(browser, /This conversation link is incomplete\./, "Browser smoke must prove incomplete conversation links fail closed after hydration.")
requirePattern(browser, /Message applicant/, "Browser smoke must exercise the recipient messaging affordance.")
requirePattern(browser, /Continue to send/, "Browser smoke must prove compose-first identity progression.")
requirePattern(browser, /Simulate verified send/, "Browser smoke must exercise the synthetic verified-send transition.")
requirePattern(browser, /Conversation with Ana Martínez/, "Browser smoke must prove the in-page conversation renders after sending.")
requirePattern(browser, /Create Review Workspace/, "Browser smoke must prove workspace conversion appears only after value is demonstrated.")
requirePattern(browser, /setDeviceMetricsOverride[\s\S]*width: 390/, "Live smoke must include a mobile-width Review Room check.")
requirePattern(browser, /scrollWidth[\s\S]*window\.innerWidth/, "Mobile smoke must fail on page-level horizontal overflow.")
requirePattern(browser, /Runtime\.exceptionThrown|Log\.entryAdded|Network\.loadingFailed/, "Browser smoke must capture runtime, console, and network failures.")
requirePattern(browser, /captureScreenshot/, "Live browser smoke must capture screenshot evidence.")
requirePattern(browser, /Network\.responseReceived/, "Expected HTTP failure handling must be grounded in browser network responses.")
requirePattern(browser, /expectedRecipient404RequestIds/, "Expected recipient 404s must be tracked by network request ID rather than by loose console counts.")
requirePattern(browser, /status\) === 404[\s\S]*functions\/v1\/recipient-application-review/, "Only a 404 from the recipient review Edge Function may be classified as expected during invalid-token QA.")
requirePattern(browser, /entry\.networkRequestId[\s\S]*expected404RequestIds\.has\(requestId\)/, "Console 404 suppression must require the exact Chrome request ID of an expected recipient-function 404.")
requirePattern(browser, /expectedRecipient404RequestIds\(client\.events\)\.size < 1/, "Invalid-token QA must prove the expected protected-function 404 actually occurred.")
requirePattern(browser, /allowExpectedRecipient404: true/, "Only the invalid-token assertion may opt into the narrow expected-recipient-404 exception.")
forbidPattern(browser, /generic404\s*&&\s*!requestId/, "A 404 without a correlated Chrome request ID must never be silently accepted.")

requirePattern(errorNormalizer, /"context" in error/, "Structured Supabase non-2xx errors must inspect FunctionsHttpError.context instead of collapsing to technical copy.")
requirePattern(errorNormalizer, /response\.clone\(\)\.json\(\)/, "Structured Edge Function JSON must be recovered from the wrapped response.")
requirePattern(errorNormalizer, /requestError\.name = code/, "Recovered server error codes must become stable Error.name values for recipient UI mapping.")
requirePattern(reviewClient, /functions\.invoke\("recipient-application-review"[\s\S]{0,280}normalizeKleioEdgeFunctionError\(error/, "Secure Review Room Edge Function calls must preserve structured server error codes.")
requirePattern(conversationClient, /functions\.invoke\("application-conversation"[\s\S]{0,280}normalizeKleioEdgeFunctionError\(error/, "Conversation-return Edge Function calls must preserve structured server error codes.")
forbidPattern(reviewClient, /functions\.invoke\("recipient-application-review"[\s\S]{0,220}if \(error\) throw error/, "Secure Review Room Edge Function invoke must not throw raw FunctionsHttpError before normalization.")
forbidPattern(conversationClient, /functions\.invoke\("application-conversation"[\s\S]{0,220}if \(error\) throw error/, "Conversation return Edge Function invoke must not throw raw FunctionsHttpError before normalization.")

if (failures.length) {
  console.error("KLEIO recipient live-smoke contract audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO recipient live-smoke contract audit passed: GitHub Pages is free of Vercel runtime injection; post-deploy route/asset/function checks, structured non-2xx error recovery, request-correlated recipient-404 handling, hydrated browser failure states, compose-first messaging interaction, workspace conversion, mobile overflow protection, runtime diagnostics, and screenshot evidence are permanently covered.")
