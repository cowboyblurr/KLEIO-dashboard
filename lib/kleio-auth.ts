import type { AuthError, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { getKleioAbsoluteUrl, getKleioAuthCallbackUrl } from "@/lib/kleio-url"

export { getKleioAbsoluteUrl }

function authErrorDetails(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  const status = typeof error === "object" && error && "status" in error ? Number((error as AuthError).status) : 0
  const code = typeof error === "object" && error && "code" in error ? String((error as AuthError & { code?: string }).code || "").toLowerCase() : ""
  return { message, status, code }
}

function isEmailRateLimitError(error: unknown) {
  const { message, status, code } = authErrorDetails(error)
  return code === "over_email_send_rate_limit" || message.includes("email rate limit") || message.includes("over_email_send_rate_limit") || (status === 429 && message.includes("email"))
}

export function getKleioAuthErrorMessage(error: unknown, locale: "en" | "es" = "en") {
  const { message, status } = authErrorDetails(error)
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
  if (message.includes("known data breach") || message.includes("pwned password")) {
    return es
      ? "Esta contraseña apareció en una filtración de datos conocida. Elige una contraseña diferente."
      : "This password has appeared in a known data breach. Choose a different password."
  }
  if (message.includes("verify password safety") || message.includes("password safety check")) {
    return es
      ? "KLEIO no pudo verificar la seguridad de la contraseña. Revisa tu conexión e inténtalo de nuevo."
      : "KLEIO could not verify password safety. Check your connection and try again."
  }
  if (message.includes("password") && (message.includes("weak") || message.includes("least") || message.includes("uppercase"))) {
    return es
      ? "Usa al menos 12 caracteres e incluye mayúscula, minúscula, número y símbolo."
      : "Use at least 12 characters and include uppercase, lowercase, a number, and a symbol."
  }
  if (isEmailRateLimitError(error)) {
    return es
      ? "KLEIO no puede enviar otro correo de confirmación todavía. Revisa tu bandeja de entrada y correo no deseado antes de volver a intentarlo. El límite de correo puede tardar hasta una hora en restablecerse."
      : "KLEIO cannot send another confirmation email yet. Check your inbox and spam folder before trying again. The email limit may take up to an hour to reset."
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

export function getKleioSignupErrorMessage(error: unknown, locale: "en" | "es" = "en") {
  if (isEmailRateLimitError(error)) {
    return locale === "es"
      ? "KLEIO no pudo crear la cuenta ahora porque el envío de correos de confirmación alcanzó temporalmente su límite. Tus datos siguen en este formulario. Inténtalo de nuevo cuando el límite se restablezca; esta solicitud no creó una cuenta."
      : "KLEIO could not create the account right now because confirmation email sending is temporarily rate-limited. Your details are still in this form. Try again after the limit resets; this attempt did not create an account."
  }
  return getKleioAuthErrorMessage(error, locale)
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
      emailRedirectTo: getKleioAuthCallbackUrl(role),
    },
  })
  if (error) throw error
}
