import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  mediaImportConfig,
  uploadMediaToLibrary,
} from "@/lib/kleio-universal-media"
import {
  confirmPassportClaim,
  loadPassportReviewInbox,
  requestSourceExtraction,
  setPassportClaimDecision,
  type ClaimStatus,
  type PassportClaim,
} from "@/lib/kleio-upload-to-passport"

export type ArtistImportProposalStatus = ClaimStatus
export type ArtistImportProposal = PassportClaim

async function invokeTextExtraction(body: Record<string, unknown>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("extract-artist-materials", { body })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error).replaceAll("_", " "))
  return data as {
    sourceId: string
    jobId: string
    proposalCount: number
    extractionStatus: string
    classification: string
    documentVersion: number
    warnings: string[]
  }
}

export async function extractArtistText(input: { label: string; text: string }) {
  if (!input.text.trim()) throw new Error("Paste artist material before extracting Passport updates.")
  if (input.text.length > 120_000) throw new Error("Pasted material must be 120,000 characters or fewer.")
  return invokeTextExtraction({ sourceType: "pasted_text", label: input.label, text: input.text })
}

export async function extractArtistPdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Choose a PDF file.")
  if (file.size > 20 * 1024 * 1024) throw new Error("PDF files must be 20 MB or smaller.")
  const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()))
  if (signature !== "%PDF-") throw new Error("The selected file does not have a valid PDF signature.")

  const result = await uploadMediaToLibrary({
    file,
    source: "device",
    config: mediaImportConfig("creative_passport", {
      allowedMimeTypes: ["application/pdf"],
      maxFileSizeBytes: 20 * 1024 * 1024,
      maxSelectionCount: 1,
      allowMultiple: false,
      usageRole: "cv",
    }),
  })
  if (!result.item.sourceId) throw new Error("KLEIO stored the PDF but could not create its canonical source record.")
  return requestSourceExtraction(result.item.sourceId, "artist_cv")
}

export async function loadArtistImportProposals(statuses?: ArtistImportProposalStatus[]) {
  const groups = await loadPassportReviewInbox()
  const claims = groups.flatMap((group) => group.claims)
  return statuses?.length ? claims.filter((claim) => statuses.includes(claim.status)) : claims
}

export async function setArtistImportProposalStatus(
  proposalId: string,
  status: Extract<ArtistImportProposalStatus, "rejected" | "deferred">,
) {
  return setPassportClaimDecision(proposalId, status)
}

export async function approveArtistImportProposal(proposal: ArtistImportProposal, editedValue?: string) {
  return confirmPassportClaim(proposal, {
    value: editedValue,
    visibility: "private",
    replaceExisting: proposal.relationship_status === "conflict" && Boolean(proposal.existing_record_id),
  })
}
