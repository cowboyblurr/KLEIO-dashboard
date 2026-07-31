"use client"

import { useEffect, useState } from "react"
import { Building2, Loader2, ShieldCheck, UsersRound } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  loadInstitutionProfile,
  saveInstitutionProfile,
  type InstitutionProfileRecord,
} from "@/lib/kleio-live-data"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"

function Field({ label, value, onChange, type = "text", multiline = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; multiline?: boolean }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      {multiline
        ? <textarea className={textarea} rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
        : <input type={type} className={input} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  )
}

export function LiveInstitutionSettingsBeta() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [profile, setProfile] = useState<InstitutionProfileRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    void loadInstitutionProfile()
      .then((record) => { if (active) setProfile(record) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load this institution profile.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function save() {
    if (!profile || saving) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      setProfile(await saveInstitutionProfile(profile))
      setMessage(es ? "Perfil institucional guardado." : "Institution profile saved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save this institution profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1000px] space-y-5">
        <WorkspacePageHeader
          eyebrow={es ? "Espacio institucional" : "Institution workspace"}
          title={es ? "Configuración institucional" : "Institution settings"}
          description={es ? "Mantén la información de la institución actualizada y revisa qué funciones están habilitadas durante la beta." : "Keep the institution record current and review which functions are enabled during beta."}
        />

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`} role="status"><Loader2 className="size-4 animate-spin" />{es ? "Cargando perfil…" : "Loading profile…"}</div>}
        {error && <p className={`${card} border-red-200 text-sm text-red-700`} role="alert">{error}</p>}

        {profile && (
          <section className={card} aria-labelledby="institution-profile-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="institution-profile-heading" className="flex items-center gap-2 font-serif text-xl font-semibold"><Building2 className="size-5 text-primary" />{es ? "Perfil institucional" : "Institution profile"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{es ? "Estos datos pertenecen solamente a la institución conectada a esta cuenta." : "These details belong only to the institution connected to this account."}</p>
              </div>
              <button type="button" onClick={() => void save()} disabled={saving || !profile.name.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving && <Loader2 className="size-4 animate-spin" />}{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar perfil" : "Save profile")}
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={es ? "Nombre de la institución" : "Institution name"} value={profile.name} onChange={(value) => setProfile((current) => current ? { ...current, name: value, display_name: value } : current)} />
              <Field label={es ? "Tipo de organización" : "Organization type"} value={profile.organization_type} onChange={(value) => setProfile((current) => current ? { ...current, organization_type: value } : current)} />
              <Field label={es ? "Ubicación" : "Location"} value={profile.location} onChange={(value) => setProfile((current) => current ? { ...current, location: value } : current)} />
              <Field label={es ? "Sitio web" : "Website"} value={profile.website_url} onChange={(value) => setProfile((current) => current ? { ...current, website_url: value } : current)} />
              <Field label={es ? "Nombre de contacto" : "Contact name"} value={profile.contact_name} onChange={(value) => setProfile((current) => current ? { ...current, contact_name: value } : current)} />
              <Field label={es ? "Correo de contacto" : "Contact email"} type="email" value={profile.contact_email} onChange={(value) => setProfile((current) => current ? { ...current, contact_email: value } : current)} />
            </div>
            <div className="mt-4"><Field multiline label={es ? "Descripción pública" : "Public description"} value={profile.description} onChange={(value) => setProfile((current) => current ? { ...current, description: value } : current)} /></div>
            {message && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{message}</p>}
          </section>
        )}

        <section className={`${card} bg-[linear-gradient(145deg,#F9F6FF,#FFFFFF)]`} aria-labelledby="team-beta-heading">
          <div className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#ECE5FA] text-[#5B4B8A]"><UsersRound className="size-5" /></span>
            <div>
              <h2 id="team-beta-heading" className="font-serif text-xl font-semibold">{es ? "Invitaciones de equipo: no habilitadas en la beta inicial" : "Team invitations: not enabled for the initial beta"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{es ? "KLEIO está manteniendo separadas las cuentas propietarias y los accesos de revisores hasta que el cambio de espacios, la aceptación de invitaciones y la revocación de membresías funcionen como un solo sistema probado. No se crearán enlaces que lleven a un espacio incorrecto." : "KLEIO is keeping owner accounts and reviewer access separate until workspace switching, invitation acceptance, and membership revocation operate as one tested system. The beta will not create links that can lead someone into the wrong workspace."}</p>
              <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-[#5B4B8A]"><ShieldCheck className="mt-0.5 size-4 shrink-0" />{es ? "Esto no afecta la creación de convocatorias ni la revisión realizada por el propietario institucional." : "This does not affect open-call creation or review performed by the institution owner."}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
