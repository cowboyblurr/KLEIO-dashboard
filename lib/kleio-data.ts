export type SubmissionStatus =
  | "In Review"
  | "Pending Vote"
  | "Shortlisted"
  | "Interview"
  | "Withdrawn"
  | "Incomplete"
  | "Pending Info"

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
  email: string
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
  passportCompleteness: number
  tags: string[]
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

export type Review = {
  id: string
  submissionId: string
  reviewerId: string
  score: number | null
  status: "Not Started" | "Started" | "Completed" | "Requested Info"
  note: string
  updatedAt: string
}

export type ActivityLogEntry = {
  id: string
  date: string
  actor: string
  action: string
  target: string
  type: "submission" | "review" | "program" | "message" | "decision"
}

export const demoToday = new Date("2026-06-29T12:00:00Z")

export const institution: Institution = {
  id: "kleio-arthouse",
  name: "KLEIO Arthouse",
  initials: "KA",
  type: "Arthouse",
  location: "Brooklyn, NY, USA",
  demoLabel: "Demo environment · Synthetic data",
  description:
    "A fictional contemporary arts institution used to demonstrate KLEIO's submission, review, shortlist, and reporting workflow.",
  activeWorkspace: "KLEIO Arthouse Residency Program",
  previousCycleApplicationCount: 29,
}

export const programs: Program[] = [
  {
    id: "residency-2026",
    title: "KLEIO Arthouse Residency",
    category: "Residency / Open Call",
    status: "Open",
    cycle: "2026",
    deadline: "2026-07-03",
    reviewStart: "2026-07-04",
    decisionDate: "2026-07-21",
    description:
      "A residency for artists working across installation, image-making, archival practice, sound, performance, and socially engaged research.",
    requiredMaterials: ["Artist bio", "Artist statement", "CV", "Portfolio", "Project proposal", "Budget outline", "References"],
    rubric: ["Conceptual strength", "Material clarity", "Program fit", "Feasibility", "Research depth"],
    committeeIds: ["mara-voss", "sophia-lee", "marcus-chen", "avery-thomas"],
  },
  {
    id: "archive-fellowship-2026",
    title: "Emerging Image & Archive Fellowship",
    category: "Fellowship / Grant",
    status: "In Review",
    cycle: "2026",
    deadline: "2026-06-24",
    reviewStart: "2026-06-25",
    decisionDate: "2026-07-12",
    description:
      "A focused fellowship for artists building projects around personal archives, memory, photography, and research-based practice.",
    requiredMaterials: ["Artist statement", "Portfolio", "Research summary", "Timeline", "References"],
    rubric: ["Research clarity", "Archive relevance", "Visual strength", "Feasibility", "Public program potential"],
    committeeIds: ["mara-voss", "camille-hart", "avery-thomas"],
  },
  {
    id: "public-forms-2026",
    title: "Public Forms Exhibition Call",
    category: "Exhibition / Open Call",
    status: "Open",
    cycle: "2026",
    deadline: "2026-07-05",
    reviewStart: "2026-07-06",
    decisionDate: "2026-07-26",
    description:
      "An exhibition call for artists working with public space, civic memory, site-responsive sculpture, and experimental forms of display.",
    requiredMaterials: ["Artist bio", "Statement", "Portfolio", "Installation plan", "Technical needs"],
    rubric: ["Public relevance", "Spatial awareness", "Technical feasibility", "Community connection", "Program fit"],
    committeeIds: ["mara-voss", "sophia-lee", "nina-patel"],
  },
]

export const collaborators: Collaborator[] = [
  {
    id: "mara-voss",
    name: "Mara Voss",
    role: "Program Director",
    email: "mara@kleioarthouse.demo",
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "archive-fellowship-2026", "public-forms-2026"],
    assignedSubmissionIds: [],
    reviewsAssigned: 0,
    reviewsCompleted: 0,
    lastActive: "Today",
  },
  {
    id: "sophia-lee",
    name: "Sophia Lee",
    role: "Curator",
    email: "sophia@kleioarthouse.demo",
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "public-forms-2026"],
    assignedSubmissionIds: ["amina-el-badri", "sofia-karim", "daniel-osei"],
    reviewsAssigned: 9,
    reviewsCompleted: 7,
    lastActive: "Today",
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    role: "Guest Juror",
    email: "marcus@kleioarthouse.demo",
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026"],
    assignedSubmissionIds: ["julian-reyes", "sofia-karim", "daniel-osei"],
    reviewsAssigned: 8,
    reviewsCompleted: 5,
    lastActive: "Yesterday",
  },
  {
    id: "avery-thomas",
    name: "Avery Thomas",
    role: "Grant Administrator",
    email: "avery@kleioarthouse.demo",
    inviteStatus: "Accepted",
    assignedProgramIds: ["residency-2026", "archive-fellowship-2026"],
    assignedSubmissionIds: ["mei-lin-zhang", "iris-okafor", "hana-park"],
    reviewsAssigned: 10,
    reviewsCompleted: 6,
    lastActive: "Today",
  },
  {
    id: "camille-hart",
    name: "Camille Hart",
    role: "Reviewer",
    email: "camille@kleioarthouse.demo",
    inviteStatus: "Invited",
    assignedProgramIds: ["archive-fellowship-2026"],
    assignedSubmissionIds: [],
    reviewsAssigned: 5,
    reviewsCompleted: 0,
    lastActive: "Invitation sent",
  },
  {
    id: "nina-patel",
    name: "Nina Patel",
    role: "Viewer",
    email: "nina@kleioarthouse.demo",
    inviteStatus: "Pending",
    assignedProgramIds: ["public-forms-2026"],
    assignedSubmissionIds: [],
    reviewsAssigned: 0,
    reviewsCompleted: 0,
    lastActive: "Pending invite",
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
    passportCompleteness: 95,
    tags: ["memory", "installation", "archive", "material practice"],
  },
  {
    id: "mei-lin-zhang",
    name: "Mei Lin Zhang",
    location: "Shanghai, China",
    discipline: "Visual Artist",
    medium: "Works on Paper",
    bio: "Mei Lin works with ink, suspended paper, and gestural notation to explore disappearance and trace.",
    passportCompleteness: 82,
    tags: ["drawing", "paper", "gesture", "deadline triage"],
  },
  {
    id: "sofia-karim",
    name: "Sofia Karim",
    location: "Paris, France",
    discipline: "Visual Artist",
    medium: "Painting",
    bio: "Sofia paints luminous thresholds between landscape, memory, and architectural atmosphere.",
    passportCompleteness: 100,
    tags: ["painting", "committee vote", "finalist", "landscape"],
  },
  {
    id: "julian-reyes",
    name: "Julian Reyes",
    location: "Mexico City, Mexico",
    discipline: "Visual Artist",
    medium: "Sculpture",
    bio: "Julian creates sculptural systems that trace water, migration, and civic infrastructure.",
    passportCompleteness: 100,
    tags: ["sculpture", "migration", "water", "research"],
  },
  {
    id: "daniel-osei",
    name: "Daniel Osei",
    location: "Accra, Ghana",
    discipline: "Visual Artist",
    medium: "Mixed Media",
    bio: "Daniel gathers material fragments from shifting coastlines into quiet environmental assemblages.",
    passportCompleteness: 96,
    tags: ["mixed media", "coastline", "ecology", "shortlist"],
  },
  {
    id: "iris-okafor",
    name: "Iris Okafor",
    location: "Lagos, Nigeria",
    discipline: "Multidisciplinary Artist",
    medium: "Video / Sound",
    bio: "Iris works across moving image, sound, and oral history to build layered civic portraits.",
    passportCompleteness: 64,
    tags: ["video", "sound", "incomplete", "oral history"],
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
    program: "KLEIO Arthouse Residency",
    programCycle: "2026",
    completeness: 95,
    reviewer: "Sophia Lee",
    reviewerIds: ["sophia-lee", "marcus-chen"],
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
      { id: "a1", actor: "Sophia Lee", action: "completed review", date: "Jun 28, 2026" },
      { id: "a2", actor: "Marcus Chen", action: "added shortlist recommendation", date: "Jun 27, 2026" },
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
    program: "KLEIO Arthouse Residency",
    programCycle: "2026",
    completeness: 82,
    reviewer: "Avery Thomas",
    reviewerIds: ["avery-thomas"],
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
      author: "Avery Thomas",
      date: "Jun 29, 2026",
    },
    activity: [
      { id: "m1", actor: "Avery Thomas", action: "flagged missing materials", date: "Jun 29, 2026" },
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
    program: "Emerging Image & Archive Fellowship",
    programCycle: "2026",
    completeness: 100,
    reviewer: "Sophia Lee",
    reviewerIds: ["sophia-lee", "marcus-chen", "camille-hart"],
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
      date: "Jun 29, 2026",
    },
    activity: [
      { id: "s1", actor: "Sophia Lee", action: "completed review", date: "Jun 25, 2026" },
      { id: "s2", actor: "Marcus Chen", action: "completed review", date: "Jun 26, 2026" },
      { id: "s3", actor: "Camille Hart", action: "vote pending", date: "Jun 29, 2026" },
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
    program: "Public Forms Exhibition Call",
    programCycle: "2026",
    completeness: 96,
    reviewer: "Marcus Chen",
    reviewerIds: ["marcus-chen", "nina-patel"],
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
      author: "Marcus Chen",
      date: "Jun 28, 2026",
    },
    activity: [
      { id: "d1", actor: "Marcus Chen", action: "moved to shortlist", date: "Jun 28, 2026" },
      { id: "d2", actor: "Nina Patel", action: "added public-space note", date: "Jun 27, 2026" },
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
    program: "Public Forms Exhibition Call",
    programCycle: "2026",
    completeness: 100,
    reviewer: "Marcus Chen",
    reviewerIds: ["marcus-chen"],
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
      author: "Marcus Chen",
      date: "Jun 27, 2026",
    },
    activity: [
      { id: "j1", actor: "Marcus Chen", action: "started review", date: "Jun 25, 2026" },
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
    program: "Emerging Image & Archive Fellowship",
    programCycle: "2026",
    completeness: 64,
    reviewer: "Avery Thomas",
    reviewerIds: ["avery-thomas"],
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
      author: "Avery Thomas",
      date: "Jun 29, 2026",
    },
    activity: [
      { id: "i1", actor: "System", action: "Completeness check marked 64%", date: "Jun 23, 2026" },
      { id: "i2", actor: "Avery Thomas", action: "queued information request", date: "Jun 29, 2026" },
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
const reviewerCycle = ["Sophia Lee", "Marcus Chen", "Avery Thomas", "Camille Hart"]
const reviewerIdCycle = ["sophia-lee", "marcus-chen", "avery-thomas", "camille-hart"]
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

export const submissions: Submission[] = [
  allSubmissions.find((s) => s.id === "amina-el-badri")!,
  allSubmissions.find((s) => s.id === "mei-lin-zhang")!,
  allSubmissions.find((s) => s.id === "sofia-karim")!,
  allSubmissions.find((s) => s.id === "daniel-osei")!,
  allSubmissions.find((s) => s.id === "julian-reyes")!,
  allSubmissions.find((s) => s.id === "iris-okafor")!,
  ...generatedSubmissions.filter((s) => s.priority === "High" || s.status === "Pending Vote" || s.status === "Pending Info").slice(0, 17),
]

export const reviews: Review[] = [
  { id: "review-amina-sophia", submissionId: "amina-el-badri", reviewerId: "sophia-lee", score: 94, status: "Completed", note: "Exceptional material sensitivity and clear fit for residency.", updatedAt: "2026-06-28" },
  { id: "review-amina-marcus", submissionId: "amina-el-badri", reviewerId: "marcus-chen", score: 92, status: "Completed", note: "Recommend shortlist.", updatedAt: "2026-06-27" },
  { id: "review-mei-avery", submissionId: "mei-lin-zhang", reviewerId: "avery-thomas", score: null, status: "Requested Info", note: "Missing CV, dimensions, and reference contact.", updatedAt: "2026-06-29" },
  { id: "review-sofia-sophia", submissionId: "sofia-karim", reviewerId: "sophia-lee", score: 91, status: "Completed", note: "Strong finalist candidate.", updatedAt: "2026-06-25" },
  { id: "review-sofia-marcus", submissionId: "sofia-karim", reviewerId: "marcus-chen", score: 89, status: "Completed", note: "Committee vote should advance.", updatedAt: "2026-06-26" },
  { id: "review-sofia-camille", submissionId: "sofia-karim", reviewerId: "camille-hart", score: null, status: "Not Started", note: "Vote pending.", updatedAt: "2026-06-29" },
]

export const activityLog: ActivityLogEntry[] = [
  { id: "log-1", date: "Jun 29, 2026", actor: "Avery Thomas", action: "flagged missing materials", target: "Mei Lin Zhang · Trace", type: "submission" },
  { id: "log-2", date: "Jun 29, 2026", actor: "Camille Hart", action: "has pending committee vote", target: "Sofia Karim · The Second Horizon", type: "review" },
  { id: "log-3", date: "Jun 28, 2026", actor: "Sophia Lee", action: "recommended shortlist", target: "Amina El Badri · Echoes of Memory", type: "decision" },
  { id: "log-4", date: "Jun 28, 2026", actor: "Marcus Chen", action: "moved to shortlist", target: "Daniel Osei · Fragments of the Coast", type: "decision" },
  { id: "log-5", date: "Jun 26, 2026", actor: "System", action: "sent deadline reminder", target: "KLEIO Arthouse Residency", type: "message" },
]

const statusOrder: SubmissionStatus[] = [
  "In Review",
  "Shortlisted",
  "Interview",
  "Pending Vote",
  "Pending Info",
  "Incomplete",
  "Withdrawn",
]

const statusColors: Record<SubmissionStatus, string> = {
  "In Review": "oklch(0.55 0.2 287)",
  Shortlisted: "oklch(0.72 0.13 150)",
  Interview: "oklch(0.66 0.13 235)",
  "Pending Vote": "oklch(0.74 0.15 60)",
  "Pending Info": "oklch(0.78 0.13 78)",
  Incomplete: "oklch(0.86 0.045 290)",
  Withdrawn: "oklch(0.62 0.2 18)",
}

function countByStatus(status: SubmissionStatus) {
  return allSubmissions.filter((submission) => submission.status === status).length
}

function pct(count: number, total = allSubmissions.length) {
  if (!total) return "0%"
  return `${((count / total) * 100).toFixed(1)}%`
}

function isWithinNextSevenDays(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`)
  const diffMs = date.getTime() - demoToday.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

function monthLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`)).replace(" ", " '")
}

const totalApplications = allSubmissions.length
const previousApplications = institution.previousCycleApplicationCount
const totalDelta = Math.round(((totalApplications - previousApplications) / previousApplications) * 100)
const inReviewCount = countByStatus("In Review")
const shortlistedCount = countByStatus("Shortlisted")
const pendingVoteCount = countByStatus("Pending Vote")
const incompleteCount = allSubmissions.filter(
  (submission) =>
    submission.status === "Incomplete" ||
    submission.status === "Pending Info" ||
    (submission.missingMaterials?.length ?? 0) > 0,
).length
const deadlinesThisWeekCount = programs.filter((program) => isWithinNextSevenDays(program.deadline)).length
const needsAttentionCount = allSubmissions.filter(
  (submission) => submission.status === "Pending Info" || submission.status === "Incomplete" || submission.completeness < 85,
).length
const priorityQueueCount = submissions.length

export const analytics = {
  totalApplications,
  previousApplications,
  totalDelta,
  inReviewCount,
  shortlistedCount,
  pendingVoteCount,
  incompleteCount,
  deadlinesThisWeekCount,
  needsAttentionCount,
  priorityQueueCount,
  activePrograms: programs.filter((program) => program.status === "Open" || program.status === "In Review").length,
  reviewerCompletionRate: `${Math.round((collaborators.reduce((sum, person) => sum + person.reviewsCompleted, 0) / Math.max(collaborators.reduce((sum, person) => sum + person.reviewsAssigned, 0), 1)) * 100)}%`,
}

export const kpis = [
  {
    label: "Total Applications",
    value: totalApplications.toLocaleString(),
    delta: `${totalDelta >= 0 ? "+" : ""}${totalDelta}% from previous cycle`,
    trend: totalDelta >= 0 ? ("up" as const) : ("neutral" as const),
    icon: "clipboard",
  },
  {
    label: "In Review",
    value: inReviewCount.toLocaleString(),
    delta: `${pct(inReviewCount)} of total`,
    trend: "neutral" as const,
    icon: "eye",
  },
  {
    label: "Shortlisted",
    value: shortlistedCount.toLocaleString(),
    delta: `${pct(shortlistedCount)} of total`,
    trend: "neutral" as const,
    icon: "bookmark",
  },
  {
    label: "Pending Committee Vote",
    value: pendingVoteCount.toLocaleString(),
    delta: `${pct(pendingVoteCount)} of total`,
    trend: "neutral" as const,
    icon: "users",
  },
  {
    label: "Deadlines This Week",
    value: deadlinesThisWeekCount.toLocaleString(),
    delta: `${deadlinesThisWeekCount} programs`,
    trend: "neutral" as const,
    icon: "calendar",
  },
  {
    label: "Incomplete Applications",
    value: incompleteCount.toLocaleString(),
    delta: `${pct(incompleteCount)} of total`,
    trend: "neutral" as const,
    icon: "file",
  },
]

const months = ["Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26", "Jun '26"]
const countsByMonth = allSubmissions.reduce<Record<string, number>>((acc, submission) => {
  const label = monthLabel(submission.submittedAt)
  acc[label] = (acc[label] ?? 0) + 1
  return acc
}, {})

export const applicationsOverTime = months.map((month) => ({
  month,
  applications: countsByMonth[month] ?? 0,
}))

export const statusBreakdown = statusOrder.map((label) => {
  const count = countByStatus(label)
  return {
    label,
    pct: pct(count),
    count,
    color: statusColors[label],
  }
})

export const reviewQueueTabs = [
  { id: "priority", label: "Priority Review Queue", count: priorityQueueCount },
  { id: "attention", label: "Needs Attention", count: needsAttentionCount },
  { id: "deadlines", label: "Upcoming Deadlines", count: deadlinesThisWeekCount },
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
