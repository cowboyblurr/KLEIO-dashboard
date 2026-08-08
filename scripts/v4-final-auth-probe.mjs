import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error("Missing public Supabase configuration")

const nonce = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
const email = `qa-v4-final-${nonce}@kleioarthouse.com`
const password = `V4!Final-${crypto.randomBytes(18).toString("base64url")}`
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
const started = Date.now()
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role: "artist", display_name: "KLEIO V4 Final Auth Probe", qa_v4_probe: true, qa_probe_nonce: nonce },
    emailRedirectTo: "https://www.kleioarthouse.com/auth/callback/?role=artist",
  },
})
const result = {
  checked_at: new Date().toISOString(),
  latency_ms: Date.now() - started,
  email,
  error: error ? { message: error.message || null, code: error.code || null, status: error.status || null } : null,
  user_id: data?.user?.id || null,
  identities_count: Array.isArray(data?.user?.identities) ? data.user.identities.length : null,
  session_present: Boolean(data?.session),
}
console.log(JSON.stringify(result, null, 2))
if (error || !data?.user?.id) process.exitCode = 1
