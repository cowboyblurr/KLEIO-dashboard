import fs from "node:fs"

const workflow = fs.readFileSync(".github/workflows/recipient-live-smoke.yml", "utf8")
const browser = fs.readFileSync("scripts/live-recipient-browser-smoke.mjs", "utf8")
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

if (failures.length) {
  console.error("KLEIO recipient live-smoke contract audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO recipient live-smoke contract audit passed: post-Pages route/asset/function checks, hydrated browser failure states, compose-first messaging interaction, workspace conversion, mobile overflow protection, runtime diagnostics, and screenshot evidence are permanently covered.")
