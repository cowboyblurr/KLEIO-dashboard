import type { AuthError, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

export function getKleioAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return undefined
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
  return `${window.location.origin}${basePath}${ensureLeadingSlash(path)}`
}

export function getKleioAuthErrorMessage(error: unknown, locale: "en" | "es" = "en") {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  const status = typeof error === "object" && error && "status" in error ? Number((error as AuthError).status) : 0
  const es = locale === "es"

  if (message.includes("invalid login credentials")) {
    return es ? "El correo o la contraseña no coinciden." : "The email or password did not match."
  }
  if (message.includes("email not confirmed")) {
    return es ? "Confirma tu correo antes de iniciar sesión." : "Confirm your email before signing in."
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return es ? "Ya existe una cuenta con este correo. Inicia sesión o restablece la contraseña." : "An account already exists for this email. Sign in or reset the password."
  }
  if (message.includes("email address") && message.includes("invalid")) {
    return es ? "Ingresa una dirección de correo válida." : "Enter a valid email address."
  }
  if (message.includes("password") && (message.includes("weak") || message.includes("least"))) {
    return es ? "Usa una contraseña más segura de al menos 8 caracteres." : "Use a stronger password with at least 8 characters."
  }
  if (message.includes("email rate limit") || message.includes("over_email_send_rate_limit")) {
    return es
      ? "KLEIO no puede enviar otro correo de confirmación todavía. Espera unos minutos antes de volver a intentarlo y revisa también tu bandeja de entrada y correo no deseado."
      : "KLEIO cannot send another confirmation email yet. Wait a few minutes before trying again, and check your inbox and spam folder first."
  }
  if (status === 429 || message.includes("rate limit") || message.includes("too many")) {
    return es ? "Se hicieron demasiados intentos. Espera un momento y vuelve a intentarlo." : "Too many attempts were made. Please wait a moment and try again."
  }
  if (message.includes("network") || message.includes("fetch")) {
    return es ? "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo." : "KLEIO could not connect. Check your connection and try again."
  }

  return error instanceof Error && error.message
    ? error.message
    : es
      ? "No se pudo completar la solicitud."
      : "The request could not be completed."
}

export async function requestKleioPasswordReset(email: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getKleioAbsoluteUrl("/auth/update-password/"),
  })
  if (error) throw error
}

export async function updateKleioPassword(password: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data.user
}

export async function getAuthenticatedKleioUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

export async function signOutAfterKleioPasswordReset() {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resendKleioSignupConfirmation(email: string, role: "artist" | "institution") {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getKleioAbsoluteUrl(`/signup/${role}/`),
    },
  })
  if (error) throw error
}
