"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { SignupField, SignupShell, SignupStepCard, SignupTextArea } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const inputClassName = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"

export function GuidedSignupForm({ role }: { role: "artist" | "institution" }) {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const artist = role === "artist"

  const [displayName, setDisplayName] = useState(artist ? "Jordan Ellis" : "Maya Chen")
  const [email, setEmail] = useState(artist ? "artist.preview@kleio.demo" : "institution.preview@kleio.demo")
  const [location, setLocation] = useState(artist ? "Atlanta, Georgia" : "Chicago, Illinois")
  const [website, setWebsite] = useState(artist ? "https://portfolio.example" : "https://northlight.example")
  const [discipline, setDiscipline] = useState("Mixed-media installation")
  const [mediums, setMediums] = useState("Installation, sculpture, sound")
  const [shortBio, setShortBio] = useState("An interdisciplinary artist exploring memory, migration, and the materials people carry between places.")
  const [artistStatement, setArtistStatement] = useState("My practice combines found objects, sound, and spatial storytelling to examine how personal histories become shared environments.")
  const [institutionName, setInstitutionName] = useState("Northlight Arts Foundation")
  const [institutionType, setInstitutionType] = useState("arts_nonprofit")
  const [publicDescription, setPublicDescription] = useState("A synthetic nonprofit arts organization used only to demonstrate KLEIO institution workflows.")
  const [missionStatement, setMissionStatement] = useState("Support artists through clear opportunities, thoughtful review, and transparent program administration.")

  const title = artist
    ? (es ? "Vista previa de configuración del artista" : "Preview the artist setup")
    : (es ? "Vista previa de configuración institucional" : "Preview the institution setup")
  const subtitle = artist
    ? (es ? "Explora cómo comienza un Pasaporte Creativo usando información sintética que no se guarda en una cuenta real." : "Explore how a Creative Passport begins using synthetic information that is never saved to a real account.")
    : (es ? "Explora cómo comienza un espacio institucional usando una organización sintética que no está conectada a una cuenta real." : "Explore how an institution workspace begins using a synthetic organization that is not connected to a real account.")

  return (
    <SignupShell title={title} subtitle={subtitle} stepLabel={es ? "Demo guiado · configuración sintética" : "Guided demo · synthetic setup"}>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D9D0F2] bg-[#F8F5FF] px-4 py-3 text-sm leading-relaxed text-[#5B4B8A]" role="status">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          {es
            ? "Este formulario está aislado del sistema de cuentas real. Los datos son ejemplos, no se guardan en Supabase y no pueden abrir el perfil de otra persona."
            : "This form is isolated from the real account system. The information is sample data, is not saved to Supabase, and cannot open another person’s profile."}
        </p>
      </div>

      <form noValidate>
        <SignupStepCard>
          <div className="grid gap-5 sm:grid-cols-2">
            <SignupField
              label={artist ? (es ? "Nombre profesional" : "Professional name") : (es ? "Tu nombre" : "Your name")}
              value={displayName}
              onChange={setDisplayName}
            />
            <SignupField label={es ? "Correo de demostración" : "Demo email"} value={email} onChange={setEmail} type="email" />
          </div>

          <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">
            {es
              ? "La experiencia real solicita credenciales seguras. Este recorrido utiliza una identidad sintética y nunca autentica este correo."
              : "The real experience requests secure credentials. This walkthrough uses a synthetic identity and never authenticates this email."}
          </p>

          <div className="my-6 border-t border-border" />

          {!artist && (
            <div className="mb-5 grid gap-5 sm:grid-cols-2">
              <SignupField label={es ? "Institución u organización" : "Institution or organization"} value={institutionName} onChange={setInstitutionName} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Tipo de institución" : "Institution type"}</span>
                <select value={institutionType} onChange={(event) => setInstitutionType(event.target.value)} className={inputClassName}>
                  <option value="arts_nonprofit">{es ? "Organización artística sin fines de lucro" : "Arts nonprofit"}</option>
                  <option value="museum">{es ? "Museo" : "Museum"}</option>
                  <option value="gallery">{es ? "Galería" : "Gallery"}</option>
                  <option value="foundation">{es ? "Fundación" : "Foundation"}</option>
                </select>
              </label>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <SignupField label={es ? "Ubicación" : "Location"} value={location} onChange={setLocation} />
            <SignupField label={es ? "Sitio web" : "Website"} value={website} onChange={setWebsite} type="url" />
          </div>

          {artist ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <SignupField label={es ? "Disciplina principal" : "Primary discipline"} value={discipline} onChange={setDiscipline} />
                <SignupField label={es ? "Medios" : "Mediums"} value={mediums} onChange={setMediums} />
              </div>
              <SignupTextArea label={es ? "Biografía corta" : "Short bio"} value={shortBio} onChange={setShortBio} rows={3} />
              <SignupTextArea label={es ? "Declaración artística" : "Artist statement"} value={artistStatement} onChange={setArtistStatement} rows={5} />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <SignupTextArea label={es ? "Descripción pública" : "Public description"} value={publicDescription} onChange={setPublicDescription} rows={4} />
              <SignupTextArea label={es ? "Misión" : "Mission statement"} value={missionStatement} onChange={setMissionStatement} rows={4} />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              {es
                ? "Puedes editar los ejemplos para explorar el formulario. Al continuar, KLEIO abrirá únicamente el espacio demo sintético."
                : "You can edit the examples to explore the form. Continuing opens only the isolated synthetic demo workspace."}
            </p>
            <button type="submit" className="inline-flex h-11 min-w-48 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {artist
                ? (es ? "Continuar al demo del artista" : "Continue to artist demo")
                : (es ? "Continuar al demo institucional" : "Continue to institution demo")}
            </button>
          </div>
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
