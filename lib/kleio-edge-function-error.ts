type EdgeFunctionErrorPayload = {
  error?: unknown
  message?: unknown
}

function asPayload(value: unknown): EdgeFunctionErrorPayload | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as EdgeFunctionErrorPayload
    : null
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function responseFrom(error: unknown): Response | null {
  if (!error || typeof error !== "object" || !("context" in error)) return null
  const context = (error as { context?: unknown }).context
  return typeof Response !== "undefined" && context instanceof Response ? context : null
}

/**
 * Supabase FunctionsHttpError wraps non-2xx function responses and otherwise
 * hides the structured JSON body behind `error.context`. KLEIO recipient flows
 * rely on stable server error codes such as `invalid_token`, `expired`, and
 * `revoked` so the UI can fail closed with useful, non-technical language.
 */
export async function normalizeKleioEdgeFunctionError(
  error: unknown,
  fallbackMessage = "The KLEIO request could not be completed.",
): Promise<Error> {
  const response = responseFrom(error)
  if (response) {
    let payload: EdgeFunctionErrorPayload | null = null
    try {
      payload = asPayload(await response.clone().json())
    } catch {
      // Preserve the original FunctionsHttpError when a response body is not JSON.
    }

    const code = asText(payload?.error)
    if (code) {
      const requestError = new Error(asText(payload?.message) || code)
      requestError.name = code
      return requestError
    }
  }

  if (error instanceof Error) return error
  return new Error(fallbackMessage)
}
