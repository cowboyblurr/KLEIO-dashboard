import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Production hotfix for Instagram API with Instagram Login.
// The complete implementation remains in index.ts at the pinned audited commit below.
// This wrapper only normalizes authenticated-account Graph requests and forces
// OAuth HTML callback pages to render inline instead of appearing as raw source.

const PINNED_IMPLEMENTATION =
  "https://raw.githubusercontent.com/cowboyblurr/KLEIO-dashboard/381fbcbf832f849cdd5a4459434524e2e753e821/supabase/functions/instagram-import/index.ts"

const NativeResponse = globalThis.Response

class InlineHtmlResponse extends NativeResponse {
  constructor(body?: BodyInit | null, init: ResponseInit = {}) {
    const headers = new Headers(init.headers)
    const contentType = headers.get("content-type") || ""
    const isHtml = contentType.toLowerCase().includes("text/html")
    const requestedStatus = init.status ?? 200

    if (isHtml) {
      headers.set("Content-Disposition", "inline")
    }

    super(body, {
      ...init,
      // OAuth result pages communicate their outcome through postMessage and
      // must remain renderable browser documents even when the operation failed.
      status: isHtml && requestedStatus >= 400 ? 200 : requestedStatus,
      statusText: isHtml && requestedStatus >= 400 ? "OK" : init.statusText,
      headers,
    })
  }
}

globalThis.Response = InlineHtmlResponse as typeof Response

const nativeFetch = globalThis.fetch.bind(globalThis)

function requestUrl(input: RequestInfo | URL) {
  if (input instanceof URL) return new URL(input.href)
  if (typeof input === "string") return new URL(input)
  return new URL(input.url)
}

function requestInit(input: RequestInfo | URL, init?: RequestInit) {
  if (input instanceof Request) {
    return {
      method: init?.method || input.method,
      headers: init?.headers || input.headers,
      body: init?.body,
      redirect: init?.redirect || input.redirect,
      signal: init?.signal || input.signal,
    } satisfies RequestInit
  }
  return init
}

function isNumericId(value: string | undefined) {
  return Boolean(value && /^\d+$/.test(value))
}

function rewriteAuthenticatedAccountUrl(url: URL) {
  if (url.hostname !== "graph.instagram.com") {
    return { url, kind: "other" as const }
  }

  const parts = url.pathname.split("/").filter(Boolean)
  const versionOffset = /^v\d+\.\d+$/.test(parts[0] || "") ? 1 : 0
  const objectIndex = versionOffset
  const objectId = parts[objectIndex]
  const edge = parts[objectIndex + 1]

  // The code-exchange user_id is not a reliable node path for the current
  // Instagram Login Graph surface. Resolve the authorized professional account
  // through /me and normalize user_id back to id for the existing implementation.
  const fields = url.searchParams.get("fields") || ""
  const isProfileLookup =
    isNumericId(objectId) &&
    !edge &&
    fields.includes("username") &&
    fields.includes("media_count")

  if (isProfileLookup) {
    parts[objectIndex] = "me"
    url.pathname = `/${parts.join("/")}`
    url.searchParams.set("fields", "user_id,username,account_type,media_count")
    return { url, kind: "profile" as const }
  }

  const isOwnMediaLookup = isNumericId(objectId) && edge === "media"
  if (isOwnMediaLookup) {
    parts[objectIndex] = "me"
    url.pathname = `/${parts.join("/")}`
    return { url, kind: "media" as const }
  }

  return { url, kind: "other" as const }
}

async function normalizedProfileResponse(
  url: URL,
  init: RequestInit | undefined,
) {
  let response = await nativeFetch(url, init)
  let bodyText = await response.text()
  let body: Record<string, unknown> = {}

  try {
    body = JSON.parse(bodyText) as Record<string, unknown>
  } catch {
    return new NativeResponse(bodyText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

  const error = body.error && typeof body.error === "object"
    ? body.error as Record<string, unknown>
    : null

  // Some app/account combinations reject optional account fields with error 100.
  // Retry with the minimum identity fields so connection establishment is not
  // blocked by account_type or media_count availability.
  if (!response.ok && String(error?.code || "") === "100") {
    const fallback = new URL(url.href)
    fallback.searchParams.set("fields", "user_id,username")
    response = await nativeFetch(fallback, init)
    bodyText = await response.text()
    try {
      body = JSON.parse(bodyText) as Record<string, unknown>
    } catch {
      return new NativeResponse(bodyText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }
  }

  if (body.user_id && !body.id) body.id = body.user_id

  const headers = new Headers(response.headers)
  headers.set("Content-Type", "application/json; charset=utf-8")
  return new NativeResponse(JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  let url: URL
  try {
    url = requestUrl(input)
  } catch {
    return nativeFetch(input, init)
  }

  const rewritten = rewriteAuthenticatedAccountUrl(url)
  const nextInit = requestInit(input, init)

  if (rewritten.kind === "profile") {
    return normalizedProfileResponse(rewritten.url, nextInit)
  }

  return nativeFetch(rewritten.url, nextInit)
}) as typeof fetch

await import(PINNED_IMPLEMENTATION)
