import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { installGeminiInteractionsFetchShim } from "../_shared/gemini-interactions-fetch-shim.ts"

installGeminiInteractionsFetchShim()
await import("./index.ts")
