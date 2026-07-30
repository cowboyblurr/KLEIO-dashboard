import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { loadArtistPassport, saveArtistPassport, type ArtistPassportRecord } from "@/lib/kleio-live-data"

export type ArtistImportProposalStatus =
  | "proposed"
  | "approved"
  | "edited_approved"
  | "rejected"
  | "deferred"
  | "conflicting"
  | "needs_clarification"
  | "source_unavailable"
  | "extraction_failed"

export type ArtistImportProposal = {
  id: string
  source_id: string
  target_field: keyof ArtistPassportRecord | "reusable_answer"
  proposed_value: string
  evidence_excerpt: string
  page_number: number | null
  extraction_method: string
  confidence: number | null
  status: ArtistImportProposalStatus
  artist_edited_value: string
  decided_at: string | null
  created_at: string
  source: {
    label: string
    source_type: string
    storage_path: string
    external_url: string
    extraction_status: string
    extracted_at: string | null
  } | null
}

function safeFilename(value: string) {
  const extension = value.toLowerCase().endsWith(".pdf") ? ".pdf" : ""
  const base = value.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 90) || "artist-material"
  return `${base}${extension}`
}

function splitTerms(value: string) {
  return Array.from(new Set(value.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean)))
}

async function invokeExtraction(body: Record<string, unknown>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("extract-artist-materials", { body })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error).replaceAll("_", " "))
  return data as { sourceId: string; proposalCount: number; extractionStatus: string }
}

export async function extractArtistText(input: { label: string; text: string }) {
  if (!input.text.trim()) throw new Error("Paste artist material before extracting proposals.")
  if (input.text.length > 120_000) throw new Error("Pasted material must be 120,000 characters or fewer.")
  return invokeExtraction({ sourceType: "pasted_text", label: input.label, text: input.text })
}

export async function extractArtistPdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Choose a PDF file.")
  if (file.size > 15 * 1024 * 1024) throw new Error("PDF files must be 15 MB or smaller.")
  const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()))
  if (signature !== "%PDF-") throw new Error("The selected file does not have a valid PDF signature.")

  const supabase = getSupabaseBrowserClient()
  const { data: userResponse, error: userError } = await supabase.auth.getUser()
  if (userError || !userResponse.user) throw userError ?? new Error("Sign in again to import this PDF.")
  const path = `${userResponse.user.id}/imports/${crypto.randomUUID()}-${safeFilename(file.name)}`
  const { error: uploadError } = await supabase.storage.from("artist-documents").upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
    cacheControl: "private, max-age=0, no-store",
  })
  if (uploadError) throw uploadError
  return invokeExtraction({ sourceType: "pdf", label: file.name, storagePath: path })
}

export async function loadArtistImportProposals(statuses?: ArtistImportProposalStatus[]) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("artist_import_proposals")
    .select("id,source_id,target_field,proposed_value,evidence_excerpt,page_number,extraction_method,confidence,status,artist_edited_value,decided_at,created_at,source:artist_import_sources(label,source_type,storage_path,external_url,extraction_status,extracted_at)")
    .order("created_at", { ascending: false })
  if (statuses?.length) query = query.in("status", statuses)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ArtistImportProposal[]
}

export async function setArtistImportProposalStatus(
  proposalId: string,
  status: Extract<ArtistImportProposalStatus, "rejected" | "deferred">,
) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("artist_import_proposals")
    .update({ status, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", proposalId)
  if (error) throw error
}

export async function approveArtistImportProposal(proposal: ArtistImportProposal, editedValue?: string) {
  const value = (editedValue ?? proposal.proposed_value).trim()
  if (!value) throw new Error("Approved information cannot be empty.")
  const passport = await loadArtistPassport()
  if (!passport) throw new Error("Open your Creative Passport once before approving imported information.")

  if (proposal.target_field === "reusable_answer") {
    const supabase = getSupabaseBrowserClient()
    const { data: userResponse, error: userError } = await supabase.auth.getUser()
    if (userError || !userResponse.user) throw userError ?? new Error("Sign in again.")
    const { error } = await supabase.from("artist_materials").insert({
      artist_user_id: userResponse.user.id,
      material_type: "reusable_answer",
      title: proposal.source?.label || "Imported reusable answer",
      body_text: value,
      visibility: "private",
      metadata: { import_proposal_id: proposal.id, source_id: proposal.source_id },
    })
    if (error) throw error
  } else {
    const next: ArtistPassportRecord = { ...passport }
    if (proposal.target_field === "disciplines" || proposal.target_field === "mediums" || proposal.target_field === "languages") {
      const existing = next[proposal.target_field] as string[]
      next[proposal.target_field] = Array.from(new Set([...existing, ...splitTerms(value)])) as never
    } else if (proposal.target_field in next) {
      next[proposal.target_field] = value as never
    } else {
      throw new Error("This proposal targets an unsupported Passport field.")
    }
    await saveArtistPassport({
      ...next,
      disciplines_text: next.disciplines.join(", "),
      mediums_text: next.mediums.join(", "),
      languages_text: next.languages.join(", "),
    })
  }

  const supabase = getSupabaseBrowserClient()
  const edited = value !== proposal.proposed_value.trim()
  const { error } = await supabase
    .from("artist_import_proposals")
    .update({
      status: edited ? "edited_approved" : "approved",
      artist_edited_value: edited ? value : "",
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposal.id)
  if (error) throw error
}
