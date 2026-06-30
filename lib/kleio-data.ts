export type SubmissionStatus =
  | "In Review"
  | "Pending Vote"
  | "Shortlisted"
  | "Interview"
  | "Withdrawn"
  | "Incomplete"
  | "Pending Info"
  | "Accepted"
  | "Declined"

export type Priority = "High" | "Medium" | "Low"
export type ProgramStatus = "Draft" | "Open" | "Closed" | "In Review" | "Final Selection" | "Complete"
export type InstitutionType = "Arthouse" | "Residency" | "Gallery" | "Museum" | "Foundation" | "Open Call Organizer"
export type CollaboratorRole = "Program Director" | "Curator" | "Grant Administrator" | "Guest Juror" | "Reviewer" | "Viewer"
export type InviteStatus = "Accepted" | "Invited" | "Pending"

export type ReviewerActivity = {
  id: string
  actor: string
  action: string
  date: string
}

export type Institution = {
  id: string
  name: string
  initials: string
  type: InstitutionType
  location: string
  demoLabel: string
  workspaceLabel: string
  currentCycle: string
  primaryUser: string
  description: string
  activeWorkspace: string
  previousCycleApplicationCount: number
}

export type Program = {
  id: string
  title: string
  category: string
  status: ProgramStatus
  cycle: string
  deadline: string
  reviewStart: string
  decisionDate: string
  description: string
  requiredMaterials: string[]
  rubric: string[]
  committeeIds: string[]
}

export type Collaborator = {
  id: string
  name: string
  role: CollaboratorRole
  organization: string
  email: string
  avatarInitials: string
  permissions: string[]
  inviteStatus: InviteStatus
  assignedProgramIds: string[]
  assignedSubmissionIds: string[]
  reviewsAssigned: number
  reviewsCompleted: number
  lastActive: string
}

export type Artist = {
  id: string
  name: string
  location: string
  discipline: string
  medium: string
  bio: string
  statement: string
  tags: string[]
  portfolioImage: string
  cvStatus: "Complete" | "Incomplete" | "Pending"
  documentStatus: "Complete" | "Incomplete" | "Pending"
  referencesStatus: "Complete" | "Incomplete" | "Pending"
  passportCompleteness: number
}

export type Submission = {
  id: string
  artistId: string
  programId: string
  artist: string
  location: string
  discipline: string
  medium: string
  projectTitle: string
  program: string
  programCycle: string
  completeness: number
  reviewer: string
  reviewerIds: string[]
  submitted: string
  submittedAt: string
  status: SubmissionStatus
  priority: Priority
  image: string
  scenario?: "deadline-triage" | "reviewer-bottleneck" | "strong-shortlist"
  decisionStage?: "Intake" | "Review" | "Committee Vote" | "Shortlist" | "Interview" | "Final Selection" | "Closed"
  missingMaterials?: string[]
  reviewerProgress?: {
    completed: number
    total: number
  }
  score?: number | null
  statement: string
  internalNote: {
    body: string
    author: string
    date: string
  }
  activity: ReviewerActivity[]
}

export type ReviewStatus = "Complete" | "In Progress" | "Pending" | "Completed" | "Not Started" | "Started" | "Requested Info"

export type Review = {
  id: string
  submissionId: string
  reviewerId: string
  score: number | null
  recommendation?: string
  status: ReviewStatus
  note: string
  completedAt?: string
  updatedAt: string
}

export type Note = {
  id: string
  submissionId: string
  authorId: string
  note: string
  createdAt: string
  visibility: "internal"
}

export type DemoMessage = {
  id: string
  submissionId: string
  recipientType: "artist" | "reviewer" | "collaborator"
  recipientId: string
  type: "request-info" | "reviewer-reminder" | "interview-follow-up" | "internal"
  status: "drafted" | "sent" | "pending"
  createdAt: string
}

export type ActivityLogEntry = {
  id: string
  submissionId?: string
  date: string
  actor: string
  action: string
  target: string
  type: "submission" | "review" | "program" | "message" | "decision"
}

export type MessageAuthor = "Program Team" | "Applicant" | "Reviewer" | "Committee" | "System"

export type MessageEntry = {
  id: string
  author: string
  role: MessageAuthor
  body: string
  date: string
}

export type MessageThread = {
  id: string
  submissionId: string
  subject: string
  counterpart: string
  counterpartRole: MessageAuthor
  channel: "Applicant" | "Reviewer" | "Committee"
  scenario?: "deadline-triage" | "reviewer-bottleneck" | "strong-shortlist"
  linkedMessageId?: string
  unread: boolean
  updatedAt: string
  preview: string
  messages: MessageEntry[]
}

export const demoToday = new Date("2026-08-10T12:00:00Z")

export const institution: Institution = {
  id: "kleio-arthouse",
  name: "KLEIO Arthouse",
  initials: "KA",
  type: "Arthouse",
  location: "Brooklyn, NY, USA",
  demoLabel: "Demo environment · Synthetic data",
  workspaceLabel: "Demo environment · Synthetic data",
  currentCycle: "2026 Review Cycle",
  primaryUser: "Mara Voss",
  description:
    "A fictional contemporary arts institution used to demonstrate KLEIO's submission, review, shortlist, and reporting workflow.",
  activeWorkspace: "2026 Review Cycle",
  previousCycleApplicationCount: 29,
}

export const programs: Program[] = [
  {
    id: "residency-2026",
    title: "KLEIO Arthouse Residency 2026",
    category: "Residency / Open Call",
    status: "Open",
    cycle: "2026",
    deadline: "2026-08-14",
    reviewStart: "2026-08-15",
    decisionDate: "2026-09-05",
    description:
      "A residency for artists working across installation, image-making, archival practice, sound, performance, and socially engaged research.",
    requiredMaterials: ["Artist bio", "Artist statement", "CV", "Portfolio", "Project proposal", "Budget outline", "References"],
    rubric: ["Conceptual strength", "Material clarity", "Program fit", "Feasibility", "Research depth"],
    committeeIds: ["mara-voss", "theo-malik", "celeste-rowan", "lina-park"],
  },
  {
    id: "archive-fellowship-2026",
    title: "Emerging Image & Archive Fellowship 2026",
    category: "Fellowship / Grant",
    status: "In Review",
    cycle: "2026",
    deadline: "2026-08-12",
    reviewStart: "2026-08-13",
    decisionDate: "2026-08-28",
    description:
      "A focused fellowship for artists building projects around personal archives, memory, photography, and research-based practice.",
    requiredMaterials: ["Artist statement", "Portfolio", "Research summary", "Timeline", "References"],
    rubric: ["Research clarity", "Archive relevance", "Visual strength", "Feasibility", "Public program potential"],
    committeeIds: ["mara-voss", "mateo-alvarez", "lina-park"],
  },
  {
    id: "public-forms-2026",
    title: "Public Forms Exhibition Call 2026",
    category: "Exhibition / Open Call",
    status: "Open",
    cycle: "2026",
    deadline: "2026-08-22",
    reviewStart: "2026-08-23",
    decisionDate: "2026-09-10",
    description:
      "An exhibition call for artists working with public space, civic memory, site-responsive sculpture, and experimental forms of display.",
    requiredMaterials: ["Artist bio", "Statement", "Portfolio", "Installation plan", "Technical needs"],
    rubric: ["Public relevance", "Spatial awareness", "Technical feasibility", "Community connection", "Program fit"],
    committeeIds: ["mara-voss", "theo-malik", "anika-shaw"],
  },
]

export const collaborators: Collaborator[] = [
  {
    id: "mara-voss",
    name: "Mara Voss",
    role: "Program Director",
    organization: "KLEIO Arthouse",
    email: "mara@kleioarthouse.demo",
    avatarInitials: "MV",
    permissions: ["manage-programs", "manage-submissions", "committee", "reports"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "archive-fellowship-2026", "public-forms-2026"],
    assignedSubmissionIds: [],
    reviewsAssigned: 0,
    reviewsCompleted: 0,
    lastActive: "Today",
  },
  {
    id: "theo-malik",
    name: "Theo Malik",
    role: "Curator",
    organization: "KLEIO Arthouse",
    email: "theo@kleioarthouse.demo",
    avatarInitials: "TM",
    permissions: ["review", "shortlist", "committee"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "public-forms-2026"],
    assignedSubmissionIds: ["amina-el-badri", "sofia-karim", "daniel-osei"],
    reviewsAssigned: 9,
    reviewsCompleted: 7,
    lastActive: "Today",
  },
  {
    id: "lina-park",
    name: "Lina Park",
    role: "Grant Administrator",
    organization: "KLEIO Arthouse",
    email: "lina@kleioarthouse.demo",
    avatarInitials: "LP",
    permissions: ["review", "intake", "messages"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "archive-fellowship-2026"],
    assignedSubmissionIds: ["mei-lin-zhang", "iris-okafor", "hana-park"],
    reviewsAssigned: 10,
    reviewsCompleted: 6,
    lastActive: "Today",
  },
  {
    id: "celeste-rowan",
    name: "Celeste Rowan",
    role: "Guest Juror",
    organization: "Independent",
    email: "celeste@kleioarthouse.demo",
    avatarInitials: "CR",
    permissions: ["review", "committee"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026"],
    assignedSubmissionIds: ["julian-reyes", "sofia-karim", "daniel-osei"],
    reviewsAssigned: 8,
    reviewsCompleted: 5,
    lastActive: "Yesterday",
  },
  {
    id: "mateo-alvarez",
    name: "Mateo Alvarez",
    role: "Reviewer",
    organization: "KLEIO Arthouse",
    email: "mateo@kleioarthouse.demo",
    avatarInitials: "MA",
    permissions: ["review"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["archive-fellowship-2026"],
    assignedSubmissionIds: ["sofia-karim"],
    reviewsAssigned: 5,
    reviewsCompleted: 2,
    lastActive: "Today",
  },
  {
    id: "anika-shaw",
    name: "Anika Shaw",
    role: "Reviewer",
    organization: "KLEIO Arthouse",
    email: "anika@kleioarthouse.demo",
    avatarInitials: "AS",
    permissions: ["review"],
    inviteStatus: "Accepted",
    assignedProgramIds: ["public-forms-2026"],
    assignedSubmissionIds: ["daniel-osei"],
    reviewsAssigned: 4,
    reviewsCompleted: 3,
    lastActive: "Today",
  },
]

export const artists: Artist[] = [
  {
    id: "amina-el-badri",
    name: "Amina El Badri",
    location: "Cairo, Egypt",
    discipline: "Visual Artist",
    medium: "Installation",
    bio: "Amina builds immersive environments from fabric, sound, archival fragments, and light.",
    statement:
      "My work investigates the way personal and collective memories are preserved, distorted, and remembered across generations.",
    tags: ["memory", "installation", "archive", "material practice"],
    portfolioImage: "/artwork/echoes-of-memory.png",
    cvStatus: "Complete",
    documentStatus: "Complete",
    referencesStatus: "Pending",
    passportCompleteness: 95,
  },
  {
    id: "mei-lin-zhang",
    name: "Mei Lin Zhang",
    location: "Shanghai, China",
    discipline: "Visual Artist",
    medium: "Works on Paper",
    bio: "Mei Lin works with ink, suspended paper, and gestural notation to explore disappearance and trace.",
    statement:
      "Trace examines the fleeting instant between gesture and disappearance through ink on suspended paper.",
    tags: ["drawing", "paper", "gesture", "deadline triage"],
    portfolioImage: "/artwork/trace.png",
    cvStatus: "Incomplete",
    documentStatus: "Incomplete",
    referencesStatus: "Incomplete",
    passportCompleteness: 82,
  },
  {
    id: "sofia-karim",
    name: "Sofia Karim",
    location: "Paris, France",
    discipline: "Visual Artist",
    medium: "Painting",
    bio: "Sofia paints luminous thresholds between landscape, memory, and architectural atmosphere.",
    statement:
      "The Second Horizon is a series of luminous landscapes that dissolve the line between land and sky.",
    tags: ["painting", "committee vote", "finalist", "landscape"],
    portfolioImage: "/artwork/second-horizon.png",
    cvStatus: "Complete",
    documentStatus: "Complete",
    referencesStatus: "Complete",
    passportCompleteness: 100,
  },
  {
    id: "julian-reyes",
    name: "Julian Reyes",
    location: "Mexico City, Mexico",
    discipline: "Visual Artist",
    medium: "Sculpture",
    bio: "Julian creates sculptural systems that trace water, migration, and civic infrastructure.",
    statement: "Between Currents maps the unseen migrations of water and people.",
    tags: ["sculpture", "migration", "water", "research"],
    portfolioImage: "/artwork/between-currents.png",
    cvStatus: "Complete",
    documentStatus: "Complete",
    referencesStatus: "Complete",
    passportCompleteness: 100,
  },
  {
    id: "daniel-osei",
    name: "Daniel Osei",
    location: "Accra, Ghana",
    discipline: "Visual Artist",
    medium: "Mixed Media",
    bio: "Daniel gathers material fragments from shifting coastlines into quiet environmental assemblages.",
    statement: "Fragments of the Coast gathers weathered objects from disappearing shorelines.",
    tags: ["mixed media", "coastline", "ecology", "shortlist"],
    portfolioImage: "/artwork/fragments-of-the-coast.png",
    cvStatus: "Complete",
    documentStatus: "Complete",
    referencesStatus: "Complete",
    passportCompleteness: 96,
  },
  {
    id: "iris-okafor",
    name: "Iris Okafor",
    location: "Lagos, Nigeria",
    discipline: "Multidisciplinary Artist",
    medium: "Video / Sound",
    bio: "Iris works across moving image, sound, and oral history to build layered civic portraits.",
    statement: "Signal House uses oral history, low-frequency sound, and video fragments.",
    tags: ["video", "sound", "incomplete", "oral history"],
    portfolioImage: "/placeholder.svg",
    cvStatus: "Incomplete",
    documentStatus: "Incomplete",
    referencesStatus: "Incomplete",
    passportCompleteness: 64,
  },
]

const baseSpotlightSubmissions: Submission[] = [
  {
    id: "amina-el-badri",
    artistId: "amina-el-badri",
    programId: "residency-2026",
    artist: "Amina El Badri",
    location: "Cairo, Egypt",
    discipline: "Visual Artist",
    medium: "Installation",
    projectTitle: "Echoes of Memory",
    program: "KLEIO Arthouse Residency 2026",
    programCycle: "2026",
    completeness: 95,
    reviewer: "Theo Malik",
    reviewerIds: ["theo-malik", "celeste-rowan"],
    submitted: "Jun 24, 2026",
    submittedAt: "2026-06-24",
    status: "In Review",
    priority: "High",
    scenario: "strong-shortlist",
    decisionStage: "Review",
    reviewerProgress: { completed: 2, total: 3 },
    score: 94,
    image: "/artwork/echoes-of-memory.png",
    statement:
      "My work investigates the way personal and collective memories are preserved, distorted, and remembered across generations. Through material, light, and archival traces, I build immersive environments that ask viewers to sit with what lingers after a moment has passed.",
    internalNote: {
      body: "Strong concept and material sensitivity. Excellent alignment with residency goals. This is the clearest shortlist candidate in the current review queue.",
      author: "Mara Voss",
      date: "Jun 28, 2026",
    },
    activity: [
      { id: "a1", actor: "Theo Malik", action: "completed review", date: "Jun 28, 2026" },
      { id: "a2", actor: "Celeste Rowan", action: "added shortlist recommendation", date: "Jun 27, 2026" },
      { id: "a3", actor: "System", action: "Application submitted", date: "Jun 24, 2026" },
    ],
  },
  {
    id: "mei-lin-zhang",
    artistId: "mei-lin-zhang",
    programId: "residency-2026",
    artist: "Mei Lin Zhang",
    location: "Shanghai, China",
    discipline: "Visual Artist",
    medium: "Works on Paper",
    projectTitle: "瞬間 / Trace",
    program: "KLEIO Arthouse Residency 2026",
    programCycle: "2026",
    completeness: 82,
    reviewer: "Lina Park",
    reviewerIds: ["lina-park"],
    submitted: "Jun 26, 2026",
    submittedAt: "2026-06-26",
    status: "Pending Info",
    priority: "High",
    scenario: "deadline-triage",
    decisionStage: "Intake",
    missingMaterials: ["Updated CV", "Installation dimensions", "Reference contact"],
    reviewerProgress: { completed: 0, total: 2 },
    score: null,
    image: "/artwork/trace.png",
    statement:
      "Trace examines the fleeting instant between gesture and disappearance. Working with ink on suspended paper, I record the residue of movement, allowing each mark to hover between presence and erasure.",
    internalNote: {
      body: "Promising application but missing three required items. Send a single request before the July 3 deadline so the artist is not lost to admin friction.",
      author: "Lina Park",
      date: "Aug 9, 2026",
    },
    activity: [
      { id: "m1", actor: "Lina Park", action: "flagged missing materials", date: "Aug 9, 2026" },
      { id: "m2", actor: "System", action: "Completeness check marked 82%", date: "Jun 26, 2026" },
      { id: "m3", actor: "System", action: "Application submitted", date: "Jun 26, 2026" },
    ],
  },
  {
    id: "sofia-karim",
    artistId: "sofia-karim",
    programId: "archive-fellowship-2026",
    artist: "Sofia Karim",
    location: "Paris, France",
    discipline: "Visual Artist",
    medium: "Painting",
    projectTitle: "The Second Horizon",
    program: "Emerging Image & Archive Fellowship 2026",
    programCycle: "2026",
    completeness: 100,
    reviewer: "Theo Malik",
    reviewerIds: ["theo-malik", "celeste-rowan", "mateo-alvarez"],
    submitted: "Jun 18, 2026",
    submittedAt: "2026-06-18",
    status: "Pending Vote",
    priority: "High",
    scenario: "reviewer-bottleneck",
    decisionStage: "Committee Vote",
    reviewerProgress: { completed: 2, total: 3 },
    score: 91,
    image: "/artwork/second-horizon.png",
    statement:
      "The Second Horizon is a series of luminous landscapes that dissolve the line between land and sky. I am interested in thresholds — the soft, uncertain zones where one state becomes another.",
    internalNote: {
      body: "Two reviews are complete. Camille has not submitted the final vote. Strong finalist candidate but decision is blocked until committee vote is complete.",
      author: "Mara Voss",
      date: "Aug 9, 2026",
    },
    activity: [
      { id: "s1", actor: "Theo Malik", action: "completed review", date: "Jun 25, 2026" },
      { id: "s2", actor: "Celeste Rowan", action: "completed review", date: "Jun 26, 2026" },
      { id: "s3", actor: "Mateo Alvarez", action: "vote pending", date: "Aug 9, 2026" },
    ],
  },
  {
    id: "daniel-osei",
    artistId: "daniel-osei",
    programId: "public-forms-2026",
    artist: "Daniel Osei",
    location: "Accra, Ghana",
    discipline: "Visual Artist",
    medium: "Mixed Media",
    projectTitle: "Fragments of the Coast",
    program: "Public Forms Exhibition Call 2026",
    programCycle: "2026",
    completeness: 96,
    reviewer: "Celeste Rowan",
    reviewerIds: ["celeste-rowan", "anika-shaw"],
    submitted: "Jun 20, 2026",
    submittedAt: "2026-06-20",
    status: "Shortlisted",
    priority: "Medium",
    decisionStage: "Shortlist",
    reviewerProgress: { completed: 2, total: 2 },
    score: 87,
    image: "/artwork/fragments-of-the-coast.png",
    statement:
      "Fragments of the Coast gathers weathered objects from disappearing shorelines into quiet assemblages. The work is a meditation on erosion, memory, and the fragile archives the sea leaves behind.",
    internalNote: {
      body: "Shortlisted for interview. Strong regional research; ask for budget clarification before final decision.",
      author: "Celeste Rowan",
      date: "Jun 28, 2026",
    },
    activity: [
      { id: "d1", actor: "Celeste Rowan", action: "moved to shortlist", date: "Jun 28, 2026" },
      { id: "d2", actor: "Anika Shaw", action: "added public-space note", date: "Jun 27, 2026" },
      { id: "d3", actor: "System", action: "Application submitted", date: "Jun 20, 2026" },
    ],
  },
  {
    id: "julian-reyes",
    artistId: "julian-reyes",
    programId: "public-forms-2026",
    artist: "Julian Reyes",
    location: "Mexico City, Mexico",
    discipline: "Visual Artist",
    medium: "Sculpture",
    projectTitle: "Between Currents",
    program: "Public Forms Exhibition Call 2026",
    programCycle: "2026",
    completeness: 100,
    reviewer: "Celeste Rowan",
    reviewerIds: ["celeste-rowan"],
    submitted: "Jun 22, 2026",
    submittedAt: "2026-06-22",
    status: "In Review",
    priority: "High",
    decisionStage: "Review",
    reviewerProgress: { completed: 1, total: 2 },
    score: 86,
    image: "/artwork/between-currents.png",
    statement:
      "Between Currents maps the unseen migrations of water and people. Layered translucent panels refract light into shifting tidal patterns, inviting reflection on movement, displacement, and the porous borders we cross.",
    internalNote: {
      body: "Highly resolved proposal. Strong public-space potential; needs one more reviewer note before advancement.",
      author: "Celeste Rowan",
      date: "Jun 27, 2026",
    },
    activity: [
      { id: "j1", actor: "Celeste Rowan", action: "started review", date: "Jun 25, 2026" },
      { id: "j2", actor: "System", action: "Application submitted", date: "Jun 22, 2026" },
    ],
  },
  {
    id: "iris-okafor",
    artistId: "iris-okafor",
    programId: "archive-fellowship-2026",
    artist: "Iris Okafor",
    location: "Lagos, Nigeria",
    discipline: "Multidisciplinary Artist",
    medium: "Video / Sound",
    projectTitle: "Signal House",
    program: "Emerging Image & Archive Fellowship 2026",
    programCycle: "2026",
    completeness: 64,
    reviewer: "Lina Park",
    reviewerIds: ["lina-park"],
    submitted: "Jun 23, 2026",
    submittedAt: "2026-06-23",
    status: "Incomplete",
    priority: "Medium",
    decisionStage: "Intake",
    missingMaterials: ["Portfolio video link", "Project timeline", "Reference letter", "Budget outline"],
    reviewerProgress: { completed: 0, total: 2 },
    score: null,
    image: "/placeholder.svg",
    statement:
      "Signal House uses oral history, low-frequency sound, and video fragments to explore how memory circulates through domestic space and public infrastructure.",
    internalNote: {
      body: "The concept is aligned with the fellowship, but the application is not review-ready. Needs structured follow-up.",
      author: "Lina Park",
      date: "Aug 9, 2026",
    },
    activity: [
      { id: "i1", actor: "System", action: "Completeness check marked 64%", date: "Jun 23, 2026" },
      { id: "i2", actor: "Lina Park", action: "queued information request", date: "Aug 9, 2026" },
    ],
  },
]

const generatedNames = [
  ["Leila Haddad", "Beirut, Lebanon", "Performance", "The Listening Room"],
  ["Rafael Mendez", "Bogotá, Colombia", "Photography", "Index of Dust"],
  ["Hana Park", "Seoul, South Korea", "Textile", "Soft Architecture"],
  ["Omar Keita", "Dakar, Senegal", "Film", "After the Square"],
  ["Nia Baptiste", "Port of Spain, Trinidad", "Installation", "Blue Ledger"],
  ["Tomas Greco", "Buenos Aires, Argentina", "Drawing", "Fault Lines"],
  ["Elena Mar", "Lisbon, Portugal", "Sculpture", "Salt Index"],
  ["Kaito Mori", "Tokyo, Japan", "Sound", "Rooms for Weather"],
  ["Samira Noor", "Amman, Jordan", "Photography", "Unfixed Light"],
  ["Lucia Ferrer", "Madrid, Spain", "Painting", "Night Inventory"],
  ["Malik Brooks", "Detroit, USA", "Mixed Media", "Signal Commons"],
  ["Priya Raman", "Chennai, India", "Video", "Threshold Study"],
  ["Anika Weiss", "Berlin, Germany", "Installation", "The Archive Breathes"],
  ["Mateo Silva", "São Paulo, Brazil", "Sculpture", "Civic Objects"],
  ["Yara Haddad", "Marrakesh, Morocco", "Textile", "Folded City"],
  ["Theo Blake", "London, UK", "Photography", "Public Proof"],
  ["Ren Ito", "Kyoto, Japan", "Works on Paper", "Cloud Notation"],
  ["Zara Mensah", "Kumasi, Ghana", "Performance", "Ledger Body"],
  ["Clara Novak", "Prague, Czech Republic", "Painting", "Quiet Structures"],
  ["Emil Torres", "San Juan, Puerto Rico", "Film", "Harbor Signals"],
  ["Farah Sayegh", "Ramallah, Palestine", "Research", "Letters to Stone"],
  ["Noa Stein", "Tel Aviv, Israel", "Digital Media", "Afterimage Protocol"],
  ["Mina Petrova", "Sofia, Bulgaria", "Drawing", "Rooms Without Walls"],
  ["Kwame Adu", "Kumasi, Ghana", "Mixed Media", "Market Weather"],
]

const statusPattern: SubmissionStatus[] = [
  "In Review",
  "In Review",
  "In Review",
  "Shortlisted",
  "Pending Vote",
  "Incomplete",
  "In Review",
  "Interview",
  "Pending Info",
  "In Review",
  "Withdrawn",
  "Shortlisted",
  "In Review",
  "Pending Vote",
  "Incomplete",
  "In Review",
  "Interview",
  "Pending Info",
  "In Review",
  "Shortlisted",
  "In Review",
  "Pending Vote",
  "Incomplete",
  "In Review",
]

const programCycle = [programs[0], programs[1], programs[2]]
const reviewerCycle = ["Theo Malik", "Celeste Rowan", "Lina Park", "Mateo Alvarez"]
const reviewerIdCycle = ["theo-malik", "celeste-rowan", "lina-park", "mateo-alvarez"]
const imageCycle = [
  "/artwork/echoes-of-memory.png",
  "/artwork/between-currents.png",
  "/artwork/trace.png",
  "/artwork/second-horizon.png",
  "/artwork/fragments-of-the-coast.png",
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function displayDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

const generatedSubmissions: Submission[] = generatedNames.map((item, index) => {
  const [artist, location, medium, projectTitle] = item
  const program = programCycle[index % programCycle.length]
  const reviewer = reviewerCycle[index % reviewerCycle.length]
  const reviewerId = reviewerIdCycle[index % reviewerIdCycle.length]
  const status = statusPattern[index]
  const day = 1 + ((index * 3) % 27)
  const month = index < 4 ? "01" : index < 8 ? "02" : index < 12 ? "03" : index < 16 ? "04" : index < 20 ? "05" : "06"
  const submittedAt = `2026-${month}-${String(day).padStart(2, "0")}`
  const incomplete = status === "Incomplete" || status === "Pending Info"
  const completeness = status === "Withdrawn" ? 100 : incomplete ? 68 + (index % 18) : 90 + (index % 11)

  return {
    id: slugify(artist),
    artistId: slugify(artist),
    programId: program.id,
    artist,
    location,
    discipline: index % 3 === 0 ? "Multidisciplinary Artist" : "Visual Artist",
    medium,
    projectTitle,
    program: program.title,
    programCycle: program.cycle,
    completeness,
    reviewer,
    reviewerIds: [reviewerId],
    submitted: displayDate(submittedAt),
    submittedAt,
    status,
    priority: index % 5 === 0 ? "High" : index % 2 === 0 ? "Medium" : "Low",
    decisionStage:
      status === "Shortlisted"
        ? "Shortlist"
        : status === "Interview"
          ? "Interview"
          : status === "Pending Vote"
            ? "Committee Vote"
            : status === "Withdrawn"
              ? "Closed"
              : incomplete
                ? "Intake"
                : "Review",
    missingMaterials: incomplete ? ["CV update", "Reference contact", "Technical details"] : undefined,
    reviewerProgress: { completed: status === "Pending Vote" ? 2 : status === "In Review" ? 1 : status === "Incomplete" ? 0 : 2, total: 3 },
    score: status === "Incomplete" || status === "Pending Info" || status === "Withdrawn" ? null : 72 + (index % 24),
    image: imageCycle[index % imageCycle.length],
    statement:
      `${projectTitle} is a synthetic demo proposal created for KLEIO Arthouse. The project explores memory, material research, site, and institutional context through a structured artist submission workflow.`,
    internalNote: {
      body:
        status === "Pending Vote"
          ? "Committee visibility needed: one vote remains pending before this can move forward."
          : incomplete
            ? "Application has promise but requires additional information before review."
            : status === "Shortlisted"
              ? "Candidate has moved into shortlist review for final comparison."
              : "Ready for continued review in the current program cycle.",
      author: reviewer,
      date: "Jun 29, 2026",
    },
    activity: [
      { id: `${slugify(artist)}-1`, actor: reviewer, action: status === "Pending Vote" ? "review completed" : "started review", date: "Jun 28, 2026" },
      { id: `${slugify(artist)}-2`, actor: "System", action: "Application submitted", date: displayDate(submittedAt) },
    ],
  }
})

export const allSubmissions: Submission[] = [...baseSpotlightSubmissions, ...generatedSubmissions]

/** Full submission list — analytics and KPIs derive from allSubmissions. */
export const submissions: Submission[] = allSubmissions

export const reviews: Review[] = [
  { id: "review-amina-theo", submissionId: "amina-el-badri", reviewerId: "theo-malik", score: 94, recommendation: "Shortlist", status: "Complete", note: "Exceptional material sensitivity and clear fit for residency.", completedAt: "2026-06-28", updatedAt: "2026-06-28" },
  { id: "review-amina-celeste", submissionId: "amina-el-badri", reviewerId: "celeste-rowan", score: 92, recommendation: "Shortlist", status: "Complete", note: "Recommend shortlist.", completedAt: "2026-06-27", updatedAt: "2026-06-27" },
  { id: "review-mei-lina", submissionId: "mei-lin-zhang", reviewerId: "lina-park", score: null, status: "In Progress", note: "Missing CV, dimensions, and reference contact.", updatedAt: "2026-08-09" },
  { id: "review-sofia-theo", submissionId: "sofia-karim", reviewerId: "theo-malik", score: 91, recommendation: "Advance", status: "Complete", note: "Strong finalist candidate.", completedAt: "2026-06-25", updatedAt: "2026-06-25" },
  { id: "review-sofia-celeste", submissionId: "sofia-karim", reviewerId: "celeste-rowan", score: 89, recommendation: "Advance", status: "Complete", note: "Committee vote should advance.", completedAt: "2026-06-26", updatedAt: "2026-06-26" },
  { id: "review-sofia-mateo", submissionId: "sofia-karim", reviewerId: "mateo-alvarez", score: null, status: "Pending", note: "Vote pending.", updatedAt: "2026-08-09" },
]

export const notes: Note[] = [
  { id: "note-amina-1", submissionId: "amina-el-badri", authorId: "mara-voss", note: "Strong concept and material sensitivity. Excellent alignment with residency goals. This is the clearest shortlist candidate in the current review queue.", createdAt: "2026-06-28", visibility: "internal" },
  { id: "note-mei-1", submissionId: "mei-lin-zhang", authorId: "lina-park", note: "Promising application but missing three required items. Send a single request before the August 14 deadline.", createdAt: "2026-08-09", visibility: "internal" },
  { id: "note-sofia-1", submissionId: "sofia-karim", authorId: "mara-voss", note: "Two reviews are complete. Mateo has not submitted the final vote. Strong finalist candidate but decision is blocked until committee vote is complete.", createdAt: "2026-08-09", visibility: "internal" },
  { id: "note-daniel-1", submissionId: "daniel-osei", authorId: "celeste-rowan", note: "Shortlisted for interview. Strong regional research; ask for budget clarification before final decision.", createdAt: "2026-06-28", visibility: "internal" },
  { id: "note-julian-1", submissionId: "julian-reyes", authorId: "celeste-rowan", note: "Highly resolved proposal. Strong public-space potential; needs one more reviewer note before advancement.", createdAt: "2026-06-27", visibility: "internal" },
  { id: "note-iris-1", submissionId: "iris-okafor", authorId: "lina-park", note: "The concept is aligned with the fellowship, but the application is not review-ready. Needs structured follow-up.", createdAt: "2026-08-09", visibility: "internal" },
]

export const demoMessages: DemoMessage[] = [
  { id: "msg-mei-1", submissionId: "mei-lin-zhang", recipientType: "artist", recipientId: "mei-lin-zhang", type: "request-info", status: "drafted", createdAt: "2026-08-09" },
  { id: "msg-sofia-1", submissionId: "sofia-karim", recipientType: "reviewer", recipientId: "mateo-alvarez", type: "reviewer-reminder", status: "pending", createdAt: "2026-08-09" },
  { id: "msg-iris-1", submissionId: "iris-okafor", recipientType: "artist", recipientId: "iris-okafor", type: "request-info", status: "drafted", createdAt: "2026-08-08" },
  { id: "msg-daniel-1", submissionId: "daniel-osei", recipientType: "artist", recipientId: "daniel-osei", type: "interview-follow-up", status: "sent", createdAt: "2026-06-28" },
  { id: "msg-amina-1", submissionId: "amina-el-badri", recipientType: "reviewer", recipientId: "theo-malik", type: "internal", status: "sent", createdAt: "2026-06-28" },
]

export const activityLog: ActivityLogEntry[] = [
  { id: "log-1", submissionId: "mei-lin-zhang", date: "Aug 9, 2026", actor: "Lina Park", action: "flagged missing materials", target: "Mei Lin Zhang · 瞬間 / Trace", type: "submission" },
  { id: "log-2", submissionId: "sofia-karim", date: "Aug 9, 2026", actor: "Mateo Alvarez", action: "has pending committee vote", target: "Sofia Karim · The Second Horizon", type: "review" },
  { id: "log-3", submissionId: "amina-el-badri", date: "Jun 28, 2026", actor: "Theo Malik", action: "recommended shortlist", target: "Amina El Badri · Echoes of Memory", type: "decision" },
  { id: "log-4", submissionId: "daniel-osei", date: "Jun 28, 2026", actor: "Celeste Rowan", action: "moved to shortlist", target: "Daniel Osei · Fragments of the Coast", type: "decision" },
  { id: "log-5", date: "Aug 8, 2026", actor: "System", action: "sent deadline reminder", target: "KLEIO Arthouse Residency 2026", type: "message" },
  { id: "log-6", submissionId: "sofia-karim", date: "Jun 26, 2026", actor: "Celeste Rowan", action: "completed review", target: "Sofia Karim · The Second Horizon", type: "review" },
  { id: "log-7", submissionId: "sofia-karim", date: "Jun 25, 2026", actor: "Theo Malik", action: "completed review", target: "Sofia Karim · The Second Horizon", type: "review" },
  { id: "log-8", submissionId: "amina-el-badri", date: "Jun 27, 2026", actor: "Celeste Rowan", action: "added shortlist recommendation", target: "Amina El Badri · Echoes of Memory", type: "decision" },
  { id: "log-9", submissionId: "mei-lin-zhang", date: "Jun 26, 2026", actor: "System", action: "Application submitted", target: "Mei Lin Zhang · 瞬間 / Trace", type: "submission" },
  { id: "log-10", submissionId: "iris-okafor", date: "Aug 9, 2026", actor: "Lina Park", action: "queued information request", target: "Iris Okafor · Signal House", type: "submission" },
]

export const messageThreads: MessageThread[] = [
  {
    id: "thread-mei-lin",
    submissionId: "mei-lin-zhang",
    subject: "Missing materials before the August 14 deadline",
    counterpart: "Mei Lin Zhang",
    counterpartRole: "Applicant",
    channel: "Applicant",
    scenario: "deadline-triage",
    unread: true,
    linkedMessageId: "msg-mei-1",
    updatedAt: "Aug 9, 2026",
    preview: "We still need your updated CV, installation dimensions, and one reference contact.",
    messages: [
      {
        id: "thread-mei-lin-1",
        author: "Lina Park",
        role: "Program Team",
        body: "Hi Mei Lin — your application for the KLEIO Arthouse Residency 2026 looks promising, but three required items are still missing: an updated CV, installation dimensions, and a reference contact. Could you send these before the August 14 deadline so we can move you into review?",
        date: "Aug 9, 2026",
      },
      {
        id: "thread-mei-lin-2",
        author: "System",
        role: "System",
        body: "Completeness check marked this submission at 82%. Outstanding: Updated CV, Installation dimensions, Reference contact.",
        date: "Jun 26, 2026",
      },
    ],
  },
  {
    id: "thread-sofia",
    submissionId: "sofia-karim",
    subject: "Committee vote still pending",
    counterpart: "Mateo Alvarez",
    counterpartRole: "Reviewer",
    channel: "Committee",
    scenario: "reviewer-bottleneck",
    unread: true,
    linkedMessageId: "msg-sofia-1",
    updatedAt: "Aug 9, 2026",
    preview: "Two of three reviews are in. Your vote is the last one blocking a decision.",
    messages: [
      {
        id: "thread-sofia-1",
        author: "Mara Voss",
        role: "Program Team",
        body: "Hi Mateo — The Second Horizon has two completed reviews and strong scores. Your vote is the last one we need before the committee can advance it. Are you able to submit by end of week?",
        date: "Aug 9, 2026",
      },
      {
        id: "thread-sofia-2",
        author: "Theo Malik",
        role: "Reviewer",
        body: "For context, I scored this a 91 — clear finalist for me.",
        date: "Jun 25, 2026",
      },
    ],
  },
  {
    id: "thread-amina",
    submissionId: "amina-el-badri",
    subject: "Shortlist recommendation — Echoes of Memory",
    counterpart: "Theo Malik",
    counterpartRole: "Reviewer",
    channel: "Reviewer",
    scenario: "strong-shortlist",
    unread: false,
    linkedMessageId: "msg-amina-1",
    updatedAt: "Jun 28, 2026",
    preview: "This is the clearest shortlist candidate in the current queue.",
    messages: [
      {
        id: "thread-amina-1",
        author: "Theo Malik",
        role: "Reviewer",
        body: "Review complete — exceptional material sensitivity and a clear fit for the residency. Recommending we move Amina to the shortlist.",
        date: "Jun 28, 2026",
      },
      {
        id: "thread-amina-2",
        author: "Celeste Rowan",
        role: "Reviewer",
        body: "Agreed. This is the strongest application I've seen this cycle.",
        date: "Jun 27, 2026",
      },
    ],
  },
  {
    id: "thread-daniel",
    submissionId: "daniel-osei",
    subject: "Budget clarification before final decision",
    counterpart: "Daniel Osei",
    counterpartRole: "Applicant",
    channel: "Applicant",
    unread: false,
    linkedMessageId: "msg-daniel-1",
    updatedAt: "Jun 28, 2026",
    preview: "Could you confirm material and fabrication costs for the coastal assemblage?",
    messages: [
      {
        id: "thread-daniel-1",
        author: "Celeste Rowan",
        role: "Reviewer",
        body: "Hi Daniel — you've been shortlisted. Before the final decision, could you confirm the material and fabrication costs in your budget outline?",
        date: "Jun 28, 2026",
      },
    ],
  },
  {
    id: "thread-iris",
    submissionId: "iris-okafor",
    subject: "Application not yet review-ready",
    counterpart: "Iris Okafor",
    counterpartRole: "Applicant",
    channel: "Applicant",
    unread: true,
    linkedMessageId: "msg-iris-1",
    updatedAt: "Aug 9, 2026",
    preview: "A few items are still needed before we can send Signal House to reviewers.",
    messages: [
      {
        id: "thread-iris-1",
        author: "Lina Park",
        role: "Program Team",
        body: "Hi Iris — the concept fits the Emerging Image & Archive Fellowship well, but the application is at 64% complete. We still need a portfolio video link, project timeline, reference letter, and budget outline.",
        date: "Aug 9, 2026",
      },
    ],
  },
]

export const demoScenarios = [
  {
    id: "deadline-triage",
    title: "Deadline triage",
    submissionId: "mei-lin-zhang",
    pain: "A promising artist is missing required materials before the open-call deadline.",
    kleioAction: "Open the drawer and request additional information from one place.",
    outcome: "The applicant can be rescued before review instead of getting lost in email/Drive chaos.",
  },
  {
    id: "reviewer-bottleneck",
    title: "Reviewer bottleneck",
    submissionId: "sofia-karim",
    pain: "A finalist-level application is blocked because one committee vote is still pending.",
    kleioAction: "Filter by Pending Committee Vote and check reviewer progress.",
    outcome: "The program director sees exactly who needs to act next.",
  },
  {
    id: "strong-shortlist",
    title: "Strong candidate shortlist",
    submissionId: "amina-el-badri",
    pain: "A strong application is buried across portfolio files, notes, and review comments.",
    kleioAction: "Open the Selected Submission drawer and move the artist to Shortlist.",
    outcome: "The committee moves from review to decision without losing context.",
  },
]

const generatedArtists: Artist[] = generatedNames.map(([name, location, medium]) => ({
  id: slugify(name),
  name,
  location,
  discipline: "Visual Artist",
  medium,
  bio: `${name} is a synthetic demo artist profile for KLEIO Arthouse.`,
  statement: "",
  tags: ["demo", "synthetic"],
  portfolioImage: "/placeholder.svg",
  cvStatus: "Complete" as const,
  documentStatus: "Complete" as const,
  referencesStatus: "Complete" as const,
  passportCompleteness: 90,
}))

export const allArtists: Artist[] = [
  ...artists,
  ...generatedArtists.filter((candidate) => !artists.some((existing) => existing.id === candidate.id)),
]
