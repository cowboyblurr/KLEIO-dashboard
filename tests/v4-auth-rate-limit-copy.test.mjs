import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const source = fs.readFileSync("lib/kleio-auth.ts", "utf8")

test("email rate-limit handling recognizes Supabase provider code", () => {
  assert.match(source, /over_email_send_rate_limit/)
})

test("rate-limit copy does not imply a new signup definitely created an account", () => {
  assert.match(source, /may not have created it/)
  assert.match(source, /form details remain available/)
  assert.match(source, /puede no haberla creado/)
})

test("rate-limit copy still gives existing confirmation flows a recovery path", () => {
  assert.match(source, /earlier link/)
  assert.match(source, /enlace anterior/)
})
