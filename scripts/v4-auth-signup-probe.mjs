import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trekynurdgxgtaaqqtyq.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_XdYXvd0fQm3IJKxNrFXgUQ_M4RgDj1M"
const RUN_ID = process.env.GITHUB_RUN_ID || `${Date.now()}`
const suffix = crypto.randomBytes(5).toString("hex")
const email = `qa-v4-signup-${RUN_ID}-${suffix}@kleioarthouse.com`
const password = `V4!Probe-${crypto.randomBytes(18).toString("base64url")}`
const acceptedAt = new Date().toISOString()
const recovery = {
  email,
  displayName: "KLEIO V4 Signup Probe",
  acceptedAt,
  policyVersion: "2026-07-30",
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const started = Date.now()
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: "artist",
      display_name: "KLEIO V4 Signup Probe",
      kleio_artist_account_recovery: recovery,
      qa_v4_probe: true,
      qa_run_id: RUN_ID,
    },
    emailRedirectTo: "https://www.kleioarthouse.com/auth/callback/?role=artist",
  },
})

const result = {
  generated_at: new Date().toISOString(),
  run_id: RUN_ID,
  email,
  latency_ms: Date.now() - started,
  error: error ? {
    name: error.name || null,
    message: error.message || null,
    code: error.code || null,
    status: error.status || null,
  } : null,
  user_present: Boolean(data?.user),
  user_id: data?.user?.id || null,
  identities_count: Array.isArray(data?.user?.identities) ? data.user.identities.length : null,
  email_confirmed_at: data?.user?.email_confirmed_at || null,
  session_present: Boolean(data?.session),
  access_token_present: Boolean(data?.session?.access_token),
}

fs.mkdirSync(path.join(process.cwd(), "qa-artifacts", "v4-auth"), { recursive: true })
fs.writeFileSync(path.join(process.cwd(), "qa-artifacts", "v4-auth", "signup-probe.json"), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))

// This probe deliberately does not infer PASS from a non-error HTTP response.
// A current signup capability requires an actual user object/ID; session may be absent when email confirmation is required.
if (error || !data?.user?.id) process.exitCode = 1
