"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, Check, CopyCheck, FileSearch, FileText, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react"
import {
  confirmPassportClaim,
  loadPassportReviewInbox,
  mergeDuplicateClaim,
  setPassportClaimDecision,
  type PassportClaim,
  type PassportReviewGroup,
} from "@/lib/kleio-upload-to-passport"
import { kleioSpanishError } from "@/lib/kleio-spanish-error"

const panel = "rounded-[24px] border border-[#E2DCF1] bg-white shadow-[0_18px_52px_rgba(82,64,130,0.06)]"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3.5 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const danger = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#8B3A4A] transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
const textarea = "w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-3 text-sm leading-6 text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const pendingStatuses: PassportClaim["status"][] = ["proposed", "needs_clarification", "conflicting", "deferred"]

const CLAIM_LABELS: Record<string, string> = {
  education_record: "Formación",
  solo_exhibition_record: "Exposición individual",
  group_exhibition_record: "Exposición colectiva",
  exhibition_record: "Exposición",
  award_record: "Premio",
  grant_record: "Beca o subvención",
  fellowship_record: "Beca de investigación",
  professional_name: "Nombre profesional",
  location: "Ubicación",
  bio: "Biografía",
  artist_statement: "Declaración artística",
  practice_description: "Descripción de la práctica",
  discipline: "Disciplina",
  medium: "Medio o material",
  language: "Idioma",
}

function claimLabel(claim: PassportClaim) {
  return CLAIM_LABELS[claim.claim_type] ?? CLAIM_LABELS[claim.target_field] ?? claim.claim_type.replaceAll("_", " ")
}

function confidencePresentation(claim: PassportClaim) {
  if (claim.relationship_status === "duplicate") return {
    label: "Coincide con información existente",
    detail: "KLEIO encontró una entrada similar en el Pasaporte. Puedes conservar la existente sin crear otra copia.",
    className: "border-blue-200 bg-blue-50 text-blue-900",
    Icon: CopyCheck,
  }
  if (claim.relationship_status === "conflict" || claim.relationship_status === "unresolved" || claim.status === "conflicting" || claim.status === "needs_clarification") return {
    label: "Necesita tu revisión",
    detail: "La información es ambigua, incompleta o no coincide con algo que ya está en el perfil.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    Icon: AlertTriangle,
  }
  if (claim.sensitivity !== "standard") return {
    label: "Información confidencial",
    detail: "KLEIO la mantiene privada y requiere una decisión explícita antes de utilizarla.",
    className: "border-rose-200 bg-rose-50 text-rose-900",
    Icon: ShieldAlert,
  }
  if ((claim.confidence ?? 0) >= 0.85) return {
    label: "Claramente respaldado por el documento",
    detail: "KLEIO encontró evidencia explícita y no detectó un conflicto con el perfil actual.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    Icon: ShieldCheck,
  }
  return {
    label: "Revisa antes de aprobar",
    detail: "La sugerencia tiene evidencia, pero necesita que confirmes el contexto o la redacción.",
    className: "border-violet-200 bg-violet-50 text-violet-900",
    Icon: FileSearch,
  }
}

function sourceName(group: PassportReviewGroup) {
  return group.source.original_filename || group.source.label || "Documento artístico"
}

export function PassportUpdatesInboxSpanish() {
  const [groups, setGroups] = useState<PassportReviewGroup[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [activeId, setActiveId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const next = await loadPassportReviewInbox()
      setGroups(next)
      setEdits((current) => {
        const updated = { ...current }
        for (const group of next) {
          for (const claim of group.claims) {
            if (!(claim.id in updated)) updated[claim.id] = claim.artist_edited_value || claim.proposed_value
          }
        }
        return updated
      })
    } catch (reason) {
      setError(kleioSpanishError(reason, "KLEIO no pudo cargar las sugerencias del Pasaporte Creativo."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const pendingGroups = useMemo(() => groups
    .map((group) => ({ ...group, claims: group.claims.filter((claim) => pendingStatuses.includes(claim.status)) }))
    .filter((group) => group.claims.length > 0), [groups])
  const pendingCount = pendingGroups.reduce((total, group) => total + group.claims.length, 0)

  async function act(claim: PassportClaim, action: "approve" | "replace" | "keep_existing" | "reject") {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      if (action === "approve") {
        await confirmPassportClaim(claim, { value: edits[claim.id] || claim.proposed_value })
        setMessage("La información se añadió al Pasaporte Creativo.")
      } else if (action === "replace") {
        await confirmPassportClaim(claim, { value: edits[claim.id] || claim.proposed_value, replaceExisting: true })
        setMessage("La información existente se reemplazó con la versión que aprobaste.")
      } else if (action === "keep_existing") {
        await mergeDuplicateClaim(claim)
        setMessage("KLEIO conservó la información existente y no creó otra copia.")
      } else {
        await setPassportClaimDecision(claim.id, "rejected", "El artista decidió no añadir esta sugerencia.")
        setMessage("La sugerencia se descartó sin cambiar el Pasaporte Creativo.")
      }
      await refresh()
    } catch (reason) {
      setError(kleioSpanishError(reason))
    } finally {
      setActiveId("")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8" lang="es">
      <div className="mx-auto max-w-[1100px] space-y-5">
        <Link href="/artist-dashboard/import/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F3EFFB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><ArrowLeft className="size-4" />Volver al análisis de documentos</Link>

        <section className={`${panel} p-5 sm:p-6`} aria-labelledby="passport-review-spanish-title">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Revisión del Pasaporte Creativo</p>
              <h1 id="passport-review-spanish-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Tú decides qué información se añade</h1>
              <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO organiza lo que encontró en tus documentos, muestra la evidencia y te permite editar, aprobar o descartar cada sugerencia.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8D0F2] bg-[#F8F5FF] px-3 py-1.5 text-xs font-semibold text-[#625C70]"><FileText className="size-3.5" />{pendingCount} pendiente{pendingCount === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]"><strong className="text-[#292631]">Cómo leer la confianza:</strong> “claramente respaldado” significa que hay evidencia explícita en el documento. No significa que KLEIO pueda publicar o modificar tu perfil sin tu aprobación.</div>
        </section>

        {message && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"><Check className="mt-0.5 size-4 shrink-0" />{message}</div>}
        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
        {loading && <div role="status" className={`${panel} flex items-center gap-3 p-6 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Cargando sugerencias…</div>}

        {!loading && pendingGroups.length === 0 && (
          <section className={`${panel} p-8 text-center`}><ShieldCheck className="mx-auto size-7 text-emerald-700" /><h2 className="mt-3 font-serif text-2xl font-semibold text-[#292631]">No hay sugerencias pendientes</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#746E80]">Todo lo analizado ya fue revisado o el documento todavía no ha preparado información para aprobar.</p><Link href="/artist-dashboard/profile/" className={`${primary} mt-5`}>Ver perfil artístico</Link></section>
        )}

        {!loading && pendingGroups.map((group) => (
          <section key={group.source.id} className={`${panel} overflow-hidden`} aria-labelledby={`source-${group.source.id}`}>
            <header className="border-b border-[#E7E1F7] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Documento privado</p>
              <h2 id={`source-${group.source.id}`} className="mt-1 break-all font-serif text-xl font-semibold text-[#292631]">{sourceName(group)}</h2>
              <p className="mt-1 text-xs text-[#8A8296]">{group.claims.length} sugerencia{group.claims.length === 1 ? "" : "s"} por revisar</p>
            </header>

            <div className="divide-y divide-[#EEE9F8]">
              {group.claims.map((claim) => {
                const presentation = confidencePresentation(claim)
                const StatusIcon = presentation.Icon
                const working = activeId === claim.id
                const canReplace = claim.relationship_status === "conflict" && Boolean(claim.existing_record_id)
                return (
                  <article key={claim.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">{claimLabel(claim)}</p>
                        <div className={`mt-2 flex items-start gap-3 rounded-2xl border p-3.5 text-xs leading-5 ${presentation.className}`}><StatusIcon className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">{presentation.label}</p><p className="mt-0.5 opacity-90">{presentation.detail}</p></div></div>
                      </div>
                      {typeof claim.confidence === "number" && <span className="shrink-0 rounded-full bg-[#F7F4FF] px-3 py-1.5 text-xs font-semibold text-[#625C70]">Evidencia {Math.round(claim.confidence * 100)}%</span>}
                    </div>

                    <label className="mt-4 block text-xs font-semibold text-[#625C70]"><span>Información preparada para revisión</span><textarea className={`${textarea} mt-1.5`} rows={3} value={edits[claim.id] ?? claim.proposed_value} disabled={working} onChange={(event) => setEdits((current) => ({ ...current, [claim.id]: event.target.value }))} /></label>
                    {claim.evidence_excerpt && <blockquote className="mt-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4 text-xs leading-5 text-[#746E80]"><strong className="text-[#292631]">Evidencia del documento{claim.page_number ? ` · página ${claim.page_number}` : ""}:</strong><br />“{claim.evidence_excerpt}”</blockquote>}
                    {claim.existing_record?.display_value && <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><strong>Información que ya existe:</strong><br />{claim.existing_record.display_value}</div>}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {claim.relationship_status === "duplicate" ? (
                        <button type="button" className={primary} disabled={working} onClick={() => void act(claim, "keep_existing")}>{working ? <Loader2 className="size-4 animate-spin" /> : <CopyCheck className="size-4" />}Conservar la existente</button>
                      ) : canReplace ? (
                        <button type="button" className={primary} disabled={working || !(edits[claim.id] ?? claim.proposed_value).trim()} onClick={() => void act(claim, "replace")}>{working ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Reemplazar con esta versión</button>
                      ) : (
                        <button type="button" className={primary} disabled={working || !(edits[claim.id] ?? claim.proposed_value).trim()} onClick={() => void act(claim, "approve")}>{working ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Aprobar</button>
                      )}
                      <button type="button" className={danger} disabled={working} onClick={() => void act(claim, "reject")}><X className="size-4" />Descartar</button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

        {!loading && pendingGroups.length > 0 && <div className="flex justify-end"><Link href="/artist-dashboard/profile/" className={secondary}>Ver perfil artístico</Link></div>}
      </div>
    </main>
  )
}
