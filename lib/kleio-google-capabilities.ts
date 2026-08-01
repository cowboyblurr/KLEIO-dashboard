export function isGoogleAuthenticationConfigured() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
}

export function isGoogleDriveConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
    && process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY,
  )
}

export function googleAuthenticationAvailabilityMessage(locale: "en" | "es" = "en") {
  if (isGoogleAuthenticationConfigured()) {
    return locale === "es"
      ? "Google crea o abre tu cuenta. El acceso a Drive se solicita por separado solo cuando eliges archivos."
      : "Google creates or opens your account. Drive access is requested separately only when you choose files."
  }
  return locale === "es"
    ? "El acceso con Google se está configurando. Puedes crear tu cuenta con correo ahora sin perder ninguna función del Creative Passport."
    : "Google sign-in is being configured. You can create your account with email now without losing any Creative Passport features."
}

export function googleDriveAvailabilityMessage() {
  return isGoogleDriveConfigured()
    ? "Drive access is separate from Google login. KLEIO receives only files you select in Google Picker."
    : "Google Drive setup is pending. Upload from this device or reuse your private KLEIO Library for now."
}
