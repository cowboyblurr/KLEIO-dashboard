import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = [
  'lib/kleio-url.ts',
  'lib/kleio-live-onboarding.ts',
  'lib/kleio-auth.ts',
]

const contents = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
const failures = []

if (!contents.includes('getKleioAuthCallbackUrl')) failures.push('Signup and resend flows must use the shared auth callback URL helper.')
if (!contents.includes('emailRedirectTo')) failures.push('Signup must pass an explicit emailRedirectTo value.')
if (!contents.includes('redirectTo')) failures.push('Resend or recovery flows must pass an explicit redirectTo value.')
if (/emailRedirectTo\s*:\s*["'`]http:\/\/localhost/i.test(contents)) failures.push('Signup contains a hard-coded localhost redirect.')
if (/redirectTo\s*:\s*["'`]http:\/\/localhost/i.test(contents)) failures.push('Auth contains a hard-coded localhost redirect.')

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
if (process.env.CI && (!siteUrl || /localhost|127\.0\.0\.1/i.test(siteUrl))) {
  failures.push('NEXT_PUBLIC_SITE_URL must be a non-local production URL in CI.')
}

if (failures.length) {
  console.error('Auth redirect audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Auth redirect audit passed for ${siteUrl || 'browser-origin fallback'}.`)
