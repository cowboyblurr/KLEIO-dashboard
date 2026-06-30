// Production version can connect through backend OAuth/API services for user-authorized imports.
// Current implementation is demo-only and performs no external data access.

export type KleioConnectorUserType = "artist" | "institution"

export type KleioConnectorCategory =
  | "website"
  | "social"
  | "files"
  | "video"
  | "audio"
  | "submission-system"

export type KleioConnector = {
  id: string
  label: string
  userTypes: KleioConnectorUserType[]
  category: KleioConnectorCategory
  description: string
  demoPreviewText: string
  trustNote: string
}

export const kleioConnectors: KleioConnector[] = [
  {
    id: "portfolio-website",
    label: "Portfolio Website",
    userTypes: ["artist"],
    category: "website",
    description: "Prefill bio, statement links, press, contact, and featured works.",
    demoPreviewText: "Profile basics and public links ready for review.",
    trustNote: "You choose which public details become part of your passport.",
  },
  {
    id: "instagram",
    label: "Instagram",
    userTypes: ["artist", "institution"],
    category: "social",
    description: "Reference public visual practice, captions, exhibitions, and recent work.",
    demoPreviewText: "Recent visual context prepared as a private draft.",
    trustNote: "KLEIO never publishes social content without approval.",
  },
  {
    id: "drive-dropbox",
    label: "Google Drive / Dropbox",
    userTypes: ["artist"],
    category: "files",
    description: "Bring in CVs, portfolio PDFs, project proposals, and application documents.",
    demoPreviewText: "Documents organized into passport sections.",
    trustNote: "You decide which files are attached or excluded.",
  },
  {
    id: "youtube-vimeo",
    label: "YouTube / Vimeo",
    userTypes: ["artist"],
    category: "video",
    description: "Attach video works, performances, installation walkthroughs, and artist talks.",
    demoPreviewText: "Video works prepared for portfolio review.",
    trustNote: "Media stays contextual; you decide what represents your practice.",
  },
  {
    id: "spotify-soundcloud",
    label: "Spotify / SoundCloud",
    userTypes: ["artist"],
    category: "audio",
    description: "Connect audio work, playlists, sound practice, or sonic references.",
    demoPreviewText: "Audio practice and listening references prepared for review.",
    trustNote: "Useful for sound artists, musicians, performance work, and sonic research.",
  },
  {
    id: "institution-website",
    label: "Institution Website",
    userTypes: ["institution"],
    category: "website",
    description: "Prefill mission, location, program language, and public-facing details.",
    demoPreviewText: "Workspace profile details prepared for review.",
    trustNote: "Your team approves every public-facing field.",
  },
  {
    id: "institution-drive-dropbox",
    label: "Google Drive / Dropbox",
    userTypes: ["institution"],
    category: "files",
    description: "Organize past open-call folders, reviewer docs, program files, and visual assets.",
    demoPreviewText: "Program files and review materials organized into draft sections.",
    trustNote: "Nothing is shared with reviewers until your team approves it.",
  },
  {
    id: "institution-instagram",
    label: "Instagram",
    userTypes: ["institution"],
    category: "social",
    description: "Reference exhibitions, artist features, announcements, and public identity.",
    demoPreviewText: "Public program tone and recent activity prepared as context.",
    trustNote: "KLEIO treats social data as reference, not official record.",
  },
  {
    id: "institution-youtube-vimeo",
    label: "YouTube / Vimeo",
    userTypes: ["institution"],
    category: "video",
    description: "Attach lectures, walkthroughs, artist talks, and documentation.",
    demoPreviewText: "Program media prepared for workspace review.",
    trustNote: "Your team decides which media is shown to applicants or reviewers.",
  },
  {
    id: "submission-csv",
    label: "Submission System / CSV",
    userTypes: ["institution"],
    category: "submission-system",
    description: "Prepare past application records from Submittable, SlideRoom, CaFÉ, or CSV exports.",
    demoPreviewText: "Historical application structure prepared for review.",
    trustNote: "This is an import preview, not a live sync.",
  },
]

export function getConnectorsForUserType(userType: KleioConnectorUserType): KleioConnector[] {
  return kleioConnectors.filter((c) => c.userTypes.includes(userType))
}

export function getConnectorById(id: string): KleioConnector | undefined {
  return kleioConnectors.find((c) => c.id === id)
}
