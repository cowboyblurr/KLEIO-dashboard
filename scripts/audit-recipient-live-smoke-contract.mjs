import fs from "node:fs"

const workflow = fs.readFileSync(".github/workflows/recipient-live-smoke.yml", "utf8")
const failures = []

function requirePattern(pattern, message) {
  if (!pattern.test(workflow)) failures.push(message)
}

function forbidPattern(pattern, message) {
  if (pattern.test(workflow)) failures.push(message)
}

requirePattern(/workflow_run:[\s\S]*Deploy KLEIO Dashboard to GitHub Pages/, "Live recipient smoke must run after the GitHub Pages deployment workflow.")
requirePattern(/application-review\/demo\//, "Live smoke must verify the synthetic Review Room route.")
requirePattern(/application-review\/conversation\//, "Live smoke must verify the secure conversation-return route.")
requirePattern(/application-review\//, "Live smoke must verify the secure application review route.")
requirePattern(/recipient-application-review/, "Live smoke must probe the recipient review Edge Function boundary.")
requirePattern(/application-conversation/, "Live smoke must probe the authenticated conversation Edge Function boundary.")
requirePattern(/invalid_token/, "Live smoke must assert invalid review tokens fail closed.")
requirePattern(/status[^\n]*= \"401\"|test \"\$status\" = \"401\"/, "Live smoke must assert the conversation function rejects anonymous access.")
requirePattern(/headless=new/, "Live smoke must execute rendered client behavior in a real headless browser.")
requirePattern(/This application link is invalid or no longer available\./, "Live browser smoke must verify the invalid-token UI state.")
requirePattern(/This conversation link is incomplete\./, "Live browser smoke must verify the incomplete-conversation UI state.")
requirePattern(/Synthetic preview/, "Live browser smoke must verify the synthetic Review Room renders.")
requirePattern(/Message applicant/, "Live browser smoke must verify the recipient communication affordance renders.")
requirePattern(/Write first\. Verification appears only when you choose to send\./, "Live browser smoke must protect the compose-first messaging contract.")
forbidPattern(/vercel/i, "Recipient production smoke must not depend on Vercel.")

if (failures.length) {
  console.error("KLEIO recipient live-smoke contract audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO recipient live-smoke contract audit passed: post-Pages execution, live route checks, live asset checks, Edge Function boundaries, and headless-browser recipient states are permanently covered.")
