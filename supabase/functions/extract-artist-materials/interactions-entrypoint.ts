import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { installGeminiInteractionsFetchShim } from "../_shared/gemini-interactions-fetch-shim.ts"
import { installGeminiSchemaFallbackFetchShim } from "../_shared/gemini-schema-fallback-fetch-shim.ts"

installGeminiInteractionsFetchShim()
installGeminiSchemaFallbackFetchShim()
await import("./index.ts")
