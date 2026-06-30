// Production version should store intelligence records server-side with source, confidence,
// approval status, and visibility. Current implementation is static demo data.

export type KleioIntelligenceSubjectType = "artist" | "institution"

export type KleioIntelligenceSourceType =
  | "website"
  | "instagram"
  | "drive"
  | "dropbox"
  | "youtube"
  | "vimeo"
  | "spotify"
  | "soundcloud"
  | "csv"
  | "directory"

export type KleioIntelligenceRecord = {
  id: string
  subjectType: KleioIntelligenceSubjectType
  subjectId: string
  status: "draft" | "reviewed" | "approved"
  generatedAt: string
  sourceSummary: {
    sourceId: string
    label: string
    type: KleioIntelligenceSourceType
    access: "public-reference" | "user-connected" | "demo"
    status: "connected-for-demo" | "available" | "needs-review"
  }[]
  suggestedFields: {
    field: string
    label: string
    suggestedValue: string | string[]
    sourceIds: string[]
    confidence: "low" | "medium" | "high"
    approvalStatus: "suggested" | "approved" | "edited" | "rejected"
    visibility: "profile" | "workspace" | "backend-reference-only"
  }[]
  missingFields: string[]
  riskFlags: {
    label: string
    severity: "low" | "medium" | "high"
    note: string
  }[]
  assistSummary: string
}

export type SuggestedField = KleioIntelligenceRecord["suggestedFields"][number]

const aminaRecord: KleioIntelligenceRecord = {
  id: "intel-amina-el-badri",
  subjectType: "artist",
  subjectId: "amina-el-badri",
  status: "draft",
  generatedAt: "2026-06-30T10:00:00Z",
  sourceSummary: [
    { sourceId: "portfolio-website", label: "Portfolio Website", type: "website", access: "public-reference", status: "available" },
    { sourceId: "instagram", label: "Instagram", type: "instagram", access: "public-reference", status: "available" },
    { sourceId: "drive-dropbox", label: "Google Drive / Dropbox", type: "drive", access: "user-connected", status: "available" },
    { sourceId: "youtube-vimeo", label: "YouTube / Vimeo", type: "youtube", access: "demo", status: "available" },
    { sourceId: "spotify-soundcloud", label: "Spotify / SoundCloud", type: "soundcloud", access: "demo", status: "available" },
  ],
  suggestedFields: [
    {
      field: "bio",
      label: "Bio draft",
      suggestedValue: "Amina builds immersive environments from fabric, sound, archival fragments, and light.",
      sourceIds: ["portfolio-website", "drive-dropbox"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "statementThemes",
      label: "Artist statement themes",
      suggestedValue: ["Memory", "Light", "Archive", "Installation", "Collective history"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "disciplineTags",
      label: "Discipline tags",
      suggestedValue: ["Visual Artist", "Installation", "Conceptual"],
      sourceIds: ["portfolio-website"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "mediumTags",
      label: "Medium tags",
      suggestedValue: ["Fabric", "Light", "Sound", "Archival materials"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "featuredWorks",
      label: "Featured works",
      suggestedValue: ["Echoes of Memory", "Between Breaths", "Thresholds", "Liminal Field"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "portfolioCategories",
      label: "Portfolio categories",
      suggestedValue: ["Installation", "Site-responsive", "Archival practice"],
      sourceIds: ["drive-dropbox"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "documentChecklist",
      label: "Document checklist",
      suggestedValue: ["Artist CV", "Artist Statement", "Portfolio PDF", "Project Deck"],
      sourceIds: ["drive-dropbox"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "opportunityPreferences",
      label: "Opportunity preferences",
      suggestedValue: ["Residencies", "Exhibitions", "Open Calls", "Commissions"],
      sourceIds: ["portfolio-website"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "publicLinks",
      label: "Public links",
      suggestedValue: ["aminaelbadri.com", "@amina.albadri"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "sonicReferences",
      label: "Audio / sonic references",
      suggestedValue: ["Ambient field recordings — Cairo archive walks", "Installation sound sketches"],
      sourceIds: ["spotify-soundcloud", "youtube-vimeo"],
      confidence: "low",
      approvalStatus: "suggested",
      visibility: "backend-reference-only",
    },
  ],
  missingFields: ["Reference contacts", "Installation dimensions for Between Breaths"],
  riskFlags: [
    {
      label: "Social captions may not match statement tone",
      severity: "low",
      note: "Instagram captions are informal; review before attaching to passport.",
    },
  ],
  assistSummary:
    "KLEIO Assist prepared a draft passport structure from connected materials. Amina reviews every field before saving.",
}

const meiLinRecord: KleioIntelligenceRecord = {
  id: "intel-mei-lin-zhang",
  subjectType: "artist",
  subjectId: "mei-lin-zhang",
  status: "draft",
  generatedAt: "2026-06-30T10:00:00Z",
  sourceSummary: [
    { sourceId: "portfolio-website", label: "Portfolio Website", type: "website", access: "public-reference", status: "available" },
    { sourceId: "instagram", label: "Instagram", type: "instagram", access: "public-reference", status: "available" },
    { sourceId: "drive-dropbox", label: "Google Drive / Dropbox", type: "drive", access: "user-connected", status: "needs-review" },
  ],
  suggestedFields: [
    {
      field: "bio",
      label: "Bio draft",
      suggestedValue: "Mei Lin works with ink, suspended paper, and gestural notation to explore disappearance and trace.",
      sourceIds: ["portfolio-website"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "statementThemes",
      label: "Artist statement themes",
      suggestedValue: ["Gesture", "Trace", "Disappearance", "Time"],
      sourceIds: ["portfolio-website", "drive-dropbox"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "disciplineTags",
      label: "Discipline tags",
      suggestedValue: ["Visual Artist", "Works on Paper", "Drawing"],
      sourceIds: ["portfolio-website"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "featuredWorks",
      label: "Featured works",
      suggestedValue: ["瞬間 / Trace", "Disappearance Study No. 3", "Notation"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "documentChecklist",
      label: "Document checklist",
      suggestedValue: ["Artist Statement", "Portfolio PDF"],
      sourceIds: ["drive-dropbox"],
      confidence: "low",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "publicLinks",
      label: "Public links",
      suggestedValue: ["meilz.art", "@meil.zhang"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
  ],
  missingFields: ["Updated CV", "Installation dimensions", "Reference contact"],
  riskFlags: [
    {
      label: "Incomplete document set",
      severity: "medium",
      note: "Drive folder appears to lack an updated CV and reference list.",
    },
    {
      label: "Deadline-sensitive materials",
      severity: "high",
      note: "Missing items may affect application completeness for open calls.",
    },
  ],
  assistSummary:
    "KLEIO Assist prepared a draft passport structure. Several materials still need review before applications are complete.",
}

const sofiaRecord: KleioIntelligenceRecord = {
  id: "intel-sofia-karim",
  subjectType: "artist",
  subjectId: "sofia-karim",
  status: "draft",
  generatedAt: "2026-06-30T10:00:00Z",
  sourceSummary: [
    { sourceId: "portfolio-website", label: "Portfolio Website", type: "website", access: "public-reference", status: "available" },
    { sourceId: "instagram", label: "Instagram", type: "instagram", access: "public-reference", status: "available" },
    { sourceId: "drive-dropbox", label: "Google Drive / Dropbox", type: "drive", access: "user-connected", status: "available" },
    { sourceId: "youtube-vimeo", label: "YouTube / Vimeo", type: "vimeo", access: "demo", status: "available" },
  ],
  suggestedFields: [
    {
      field: "bio",
      label: "Bio draft",
      suggestedValue: "Sofia paints luminous thresholds between landscape, memory, and architectural atmosphere.",
      sourceIds: ["portfolio-website", "drive-dropbox"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "statementThemes",
      label: "Artist statement themes",
      suggestedValue: ["Threshold", "Light", "Landscape", "Horizon"],
      sourceIds: ["portfolio-website"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "mediumTags",
      label: "Medium tags",
      suggestedValue: ["Oil painting", "Colour field", "Large format"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "featuredWorks",
      label: "Featured works",
      suggestedValue: ["The Second Horizon", "Threshold Light", "Margin"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "documentChecklist",
      label: "Document checklist",
      suggestedValue: ["Artist CV", "Artist Statement", "Portfolio PDF", "Research Summary", "References"],
      sourceIds: ["drive-dropbox"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "opportunityPreferences",
      label: "Opportunity preferences",
      suggestedValue: ["Fellowships", "Residencies", "Solo exhibitions"],
      sourceIds: ["portfolio-website"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "profile",
    },
    {
      field: "publicLinks",
      label: "Public links",
      suggestedValue: ["sofiakarim.fr", "@sofia_karim"],
      sourceIds: ["portfolio-website", "instagram"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "profile",
    },
  ],
  missingFields: [],
  riskFlags: [],
  assistSummary:
    "KLEIO Assist prepared a complete draft passport structure from connected materials. Sofia reviews every field before saving.",
}

const arthouseRecord: KleioIntelligenceRecord = {
  id: "intel-kleio-arthouse",
  subjectType: "institution",
  subjectId: "kleio-arthouse",
  status: "draft",
  generatedAt: "2026-06-30T10:00:00Z",
  sourceSummary: [
    { sourceId: "institution-website", label: "Institution Website", type: "website", access: "public-reference", status: "available" },
    { sourceId: "institution-instagram", label: "Instagram", type: "instagram", access: "public-reference", status: "available" },
    { sourceId: "institution-drive-dropbox", label: "Google Drive / Dropbox", type: "drive", access: "user-connected", status: "available" },
    { sourceId: "institution-youtube-vimeo", label: "YouTube / Vimeo", type: "youtube", access: "demo", status: "available" },
    { sourceId: "submission-csv", label: "Submission System / CSV", type: "csv", access: "demo", status: "available" },
  ],
  suggestedFields: [
    {
      field: "institutionName",
      label: "Institution name",
      suggestedValue: "KLEIO Arthouse",
      sourceIds: ["institution-website"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "institutionType",
      label: "Institution type",
      suggestedValue: "Arthouse",
      sourceIds: ["institution-website", "directory"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "location",
      label: "Location",
      suggestedValue: "Brooklyn, NY, USA",
      sourceIds: ["institution-website"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "missionSummary",
      label: "Mission summary",
      suggestedValue:
        "A contemporary arts institution demonstrating submission, review, shortlist, and reporting workflows for open calls and residencies.",
      sourceIds: ["institution-website"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "programCategories",
      label: "Program categories",
      suggestedValue: ["Residency", "Fellowship", "Exhibition", "Open Call"],
      sourceIds: ["institution-website", "institution-drive-dropbox"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "defaultMaterials",
      label: "Default application materials",
      suggestedValue: ["Artist bio", "Artist statement", "CV", "Portfolio", "Project proposal", "References"],
      sourceIds: ["institution-drive-dropbox", "submission-csv"],
      confidence: "high",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "reviewerRoles",
      label: "Reviewer roles",
      suggestedValue: ["Program Director", "Curator", "Reviewer", "Guest Juror", "Grant Administrator"],
      sourceIds: ["institution-drive-dropbox"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "reportingNeeds",
      label: "Reporting needs",
      suggestedValue: ["Cycle summary", "Discipline distribution", "Reviewer throughput", "Shortlist export"],
      sourceIds: ["submission-csv"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "backend-reference-only",
    },
    {
      field: "publicDescription",
      label: "Public-facing description",
      suggestedValue:
        "KLEIO Arthouse supports artists and institutions through structured open calls, committee review, and cultural legacy workflows.",
      sourceIds: ["institution-website", "institution-instagram"],
      confidence: "medium",
      approvalStatus: "suggested",
      visibility: "workspace",
    },
    {
      field: "importStructure",
      label: "Past application import structure",
      suggestedValue: ["29 prior-cycle applications", "CSV column mapping draft", "Program cycle tags"],
      sourceIds: ["submission-csv"],
      confidence: "low",
      approvalStatus: "suggested",
      visibility: "backend-reference-only",
    },
  ],
  missingFields: ["Branding assets folder", "Reviewer onboarding checklist"],
  riskFlags: [
    {
      label: "CSV import is preview-only",
      severity: "low",
      note: "Historical application import requires team review before any data is used in reports.",
    },
  ],
  assistSummary:
    "KLEIO Assist prepared a draft workspace structure from public and connected materials. The institution approves every field before launch.",
}

const intelligenceRecords: KleioIntelligenceRecord[] = [
  aminaRecord,
  meiLinRecord,
  sofiaRecord,
  arthouseRecord,
]

export function getIntelligenceRecord(
  subjectType: KleioIntelligenceSubjectType,
  subjectId: string,
): KleioIntelligenceRecord | undefined {
  return intelligenceRecords.find((r) => r.subjectType === subjectType && r.subjectId === subjectId)
}

export function getSuggestedFields(
  subjectType: KleioIntelligenceSubjectType,
  subjectId: string,
): SuggestedField[] {
  return getIntelligenceRecord(subjectType, subjectId)?.suggestedFields ?? []
}

export function getApprovedFields(
  subjectType: KleioIntelligenceSubjectType,
  subjectId: string,
): SuggestedField[] {
  return getSuggestedFields(subjectType, subjectId).filter((f) => f.approvalStatus === "approved")
}

export function getMissingFields(
  subjectType: KleioIntelligenceSubjectType,
  subjectId: string,
): string[] {
  return getIntelligenceRecord(subjectType, subjectId)?.missingFields ?? []
}

export function getAssistSummary(
  subjectType: KleioIntelligenceSubjectType,
  subjectId: string,
): string {
  return getIntelligenceRecord(subjectType, subjectId)?.assistSummary ?? ""
}

export function getConfidenceSummary(fields: SuggestedField[]): string {
  const high = fields.filter((f) => f.confidence === "high").length
  const medium = fields.filter((f) => f.confidence === "medium").length
  const low = fields.filter((f) => f.confidence === "low").length
  return `${high} high · ${medium} medium · ${low} low confidence`
}
