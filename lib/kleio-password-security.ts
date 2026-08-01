export const KLEIO_PASSWORD_MIN_LENGTH = 12

const UPPERCASE_PATTERN = /[A-Z]/
const LOWERCASE_PATTERN = /[a-z]/
const NUMBER_PATTERN = /[0-9]/
const SYMBOL_PATTERN = /[^A-Za-z0-9]/
const SHA1_HEX_LENGTH = 40
const HIBP_PREFIX_LENGTH = 5
const HIBP_RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range"

type PasswordRuleFailure = "length" | "uppercase" | "lowercase" | "number" | "symbol"

export class KleioPasswordSecurityError extends Error {
  readonly code: "weak_password" | "pwned_password" | "password_check_unavailable"

  constructor(
    code: "weak_password" | "pwned_password" | "password_check_unavailable",
    message: string,
  ) {
    super(message)
    this.name = "KleioPasswordSecurityError"
    this.code = code
  }
}

export function getKleioPasswordRuleFailures(password: string): PasswordRuleFailure[] {
  const failures: PasswordRuleFailure[] = []
  if (password.length < KLEIO_PASSWORD_MIN_LENGTH) failures.push("length")
  if (!UPPERCASE_PATTERN.test(password)) failures.push("uppercase")
  if (!LOWERCASE_PATTERN.test(password)) failures.push("lowercase")
  if (!NUMBER_PATTERN.test(password)) failures.push("number")
  if (!SYMBOL_PATTERN.test(password)) failures.push("symbol")
  return failures
}

export function isKleioPasswordStrong(password: string) {
  return getKleioPasswordRuleFailures(password).length === 0
}

async function sha1Hex(value: string) {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new KleioPasswordSecurityError(
      "password_check_unavailable",
      "KLEIO could not verify password safety. Please try again in a supported browser.",
    )
  }

  const bytes = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest("SHA-1", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

async function fetchPwnedPasswordRange(prefix: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(`${HIBP_RANGE_ENDPOINT}/${prefix}`, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "Add-Padding": "true",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Password safety check failed with status ${response.status}.`)
    }

    return await response.text()
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function getKleioPwnedPasswordCount(password: string) {
  const hash = await sha1Hex(password)
  if (hash.length !== SHA1_HEX_LENGTH) {
    throw new KleioPasswordSecurityError(
      "password_check_unavailable",
      "KLEIO could not verify password safety. Please try again.",
    )
  }

  const prefix = hash.slice(0, HIBP_PREFIX_LENGTH)
  const suffix = hash.slice(HIBP_PREFIX_LENGTH)

  try {
    const range = await fetchPwnedPasswordRange(prefix)
    for (const line of range.split(/\r?\n/)) {
      const [candidateSuffix, rawCount] = line.trim().split(":")
      if (candidateSuffix?.toUpperCase() !== suffix) continue
      const count = Number(rawCount)
      return Number.isFinite(count) && count > 0 ? count : 0
    }
    return 0
  } catch (error) {
    if (error instanceof KleioPasswordSecurityError) throw error
    throw new KleioPasswordSecurityError(
      "password_check_unavailable",
      "KLEIO could not verify password safety. Check your connection and try again.",
    )
  }
}

export async function assertKleioPasswordIsSafe(password: string) {
  if (!isKleioPasswordStrong(password)) {
    throw new KleioPasswordSecurityError(
      "weak_password",
      "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.",
    )
  }

  const exposureCount = await getKleioPwnedPasswordCount(password)
  if (exposureCount > 0) {
    throw new KleioPasswordSecurityError(
      "pwned_password",
      "This password has appeared in a known data breach. Choose a different password.",
    )
  }
}
