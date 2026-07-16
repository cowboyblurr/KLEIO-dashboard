"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase, FileText, FolderOpen, Sparkles } from "lucide-react"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import { getCurrentArtistProfile, listArtistApplications, listPortfolioWorks, type ArtistProfileRecord } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ConnectedArtistOverview() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const session = getDemoSession()
  const [profile, setProfile] = useState<ArtistProfileRecord | null>(null)
  const [workCount, setWorkCount] = useState(0)
  const [applicationCount, setApplicationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([getCurrentArtistProfile(), listPortfolioWorks(), listArtistApplications()])
      .then(([nextProfile, works, applications]) => {
        if (!active) return
        setProfile(nextProfile)
        setWorkCount(works.length)
        setApplicationCount(applications.length)
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load the artist workspace.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const name = profile?.professional_name || session?.name || (es ? "Artista" : "Artist")
  const completion = profile?.profile_completion ?? 0

  return (
    <main className="h-full overflow-y-auto bg-white px-6 py-7 text-[#292631]">
      <div className="mx-auto max-w-[1160px] space-y-5">
        <header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Espacio personal conectado" : "Connected artist workspace"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? `Bienvenido, ${name}` : `Welcome, ${name}`}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Tu Pasaporte Creativo, portafolio y postulaciones se cargan únicamente desde tu cuenta autenticada." : "Your Creative Passport, portfolio, and applications load only from your authenticated account."}</p></header>
        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{error}</p>}
        <section className="grid gap-3 md:grid-cols-3">
          <Metric label={es ? "Pasaporte completo" : "Passport completion"} value={loading ? "—" : `${completion}%`} icon={Sparkles} href="/artist-dashboard/passport/connected/" />
          <Metric label={es ? "Obras guardadas" : "Portfolio works"} value={loading ? "—" : workCount} icon={FolderOpen} href="/artist-dashboard/portfolio/connected/" />
          <Metric label={es ? "Postulaciones" : "Applications"} value={loading ? "—" : applicationCount} icon={FileText} href="/artist-dashboard/applications/connected/" />
        </section>
        {!loading && !profile && <EmptyState title={es ? "Completa tu Pasaporte Creativo" : "Complete your Creative Passport"} body={es ? "Añade tu identidad profesional, bio, declaración y práctica antes de preparar postulaciones." : "Add your professional identity, biography, statement, and practice before preparing applications."} href="/artist-dashboard/passport/connected/" cta={es ? "Abrir Pasaporte" : "Open Passport"} />}
        {!loading && profile && workCount === 0 && <EmptyState title={es ? "Añade tu primera obra" : "Add your first portfolio work"} body={es ? "Tu cuenta está vacía por diseño. KLEIO no sustituye obras faltantes con contenido sintético." : "Your account is intentionally empty. KLEIO never replaces missing work with synthetic content."} href="/artist-dashboard/portfolio/connected/" cta={es ? "Añadir obra" : "Add a work"} />}
        <section className="grid gap-4 lg:grid-cols-2">
          <Link href="/artist-dashboard/calls/" className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5 transition-colors hover:bg-[#F2EDFF]"><Briefcase className="size-5 text-[#5B4B8A]" /><h2 className="mt-4 font-serif text-xl font-semibold">{es ? "Explorar convocatorias" : "Browse open calls"}</h2><p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{es ? "Consulta oportunidades públicas y prepara una postulación desde tus propios materiales." : "View public opportunities and prepare an application from your own materials."}</p></Link>
          <Link href="/artist-dashboard/applications/connected/" className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"><FileText className="size-5 text-primary" /><h2 className="mt-4 font-serif text-xl font-semibold">{es ? "Seguir postulaciones" : "Track applications"}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{es ? "Revisa borradores, estados y mensajes vinculados a esta cuenta." : "Review drafts, statuses, and messages linked to this account."}</p></Link>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value, icon: Icon, href }: { label: string; value: string | number; icon: typeof Sparkles; href: string }) {
  return <Link href={href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-3 font-serif text-3xl font-semibold">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><Icon className="size-4" /></span></div></Link>
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return <section className="rounded-2xl border border-dashed border-[#D8D0F2] bg-white p-7 text-center"><h2 className="font-serif text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p><Link href={href} className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{cta}</Link></section>
}
