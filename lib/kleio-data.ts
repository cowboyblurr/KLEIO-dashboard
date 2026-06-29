export type SubmissionStatus =
  | "In Review"
  | "Pending Vote"
  | "Shortlisted"
  | "Interview"
  | "Withdrawn"
  | "Incomplete"
  | "Pending Info"

export type Priority = "High" | "Medium" | "Low"

export type ReviewerActivity = {
  id: string
  actor: string
  action: string
  date: string
}

export type Submission = {
  id: string
  artist: string
  location: string
  discipline: string
  medium: string
  projectTitle: string
  program: string
  programCycle: string
  completeness: number
  reviewer: string
  submitted: string
  status: SubmissionStatus
  priority: Priority
  image: string
  statement: string
  internalNote: {
    body: string
    author: string
    date: string
  }
  activity: ReviewerActivity[]
}

export const submissions: Submission[] = [
  {
    id: "amina-el-badri",
    artist: "Amina El Badri",
    location: "Cairo, Egypt",
    discipline: "Visual Artist",
    medium: "Installation",
    projectTitle: "Echoes of Memory",
    program: "ISCP Residency",
    programCycle: "Fall 2024",
    completeness: 95,
    reviewer: "Sophia Lee",
    submitted: "May 12, 2024",
    status: "In Review",
    priority: "High",
    image: "/artwork/echoes-of-memory.png",
    statement:
      "My work investigates the way personal and collective memories are preserved, distorted, and remembered across generations. Through material, light, and archival traces, I build immersive environments that ask viewers to sit with what lingers after a moment has passed.",
    internalNote: {
      body: "Strong concept and material sensitivity. Excellent alignment with residency goals.",
      author: "Olivia Carter",
      date: "May 12, 2024",
    },
    activity: [
      { id: "a1", actor: "Sophia Lee", action: "started review", date: "May 12, 2024" },
      { id: "a2", actor: "Avery Thomas", action: "requested info", date: "May 11, 2024" },
      { id: "a3", actor: "System", action: "Application submitted", date: "May 10, 2024" },
    ],
  },
  {
    id: "julian-reyes",
    artist: "Julian Reyes",
    location: "Mexico City, Mexico",
    discipline: "Visual Artist",
    medium: "Sculpture",
    projectTitle: "Between Currents",
    program: "Open Call: New Voices",
    programCycle: "2024",
    completeness: 100,
    reviewer: "Marcus Chen",
    submitted: "May 11, 2024",
    status: "In Review",
    priority: "High",
    image: "/artwork/between-currents.png",
    statement:
      "Between Currents maps the unseen migrations of water and people. Layered translucent panels refract light into shifting tidal patterns, inviting reflection on movement, displacement, and the porous borders we cross.",
    internalNote: {
      body: "Highly resolved proposal. Budget and timeline are realistic for the cycle.",
      author: "Marcus Chen",
      date: "May 11, 2024",
    },
    activity: [
      { id: "b1", actor: "Marcus Chen", action: "started review", date: "May 11, 2024" },
      { id: "b2", actor: "System", action: "Application submitted", date: "May 11, 2024" },
    ],
  },
  {
    id: "mei-lin-zhang",
    artist: "Mei Lin Zhang",
    location: "Shanghai, China",
    discipline: "Visual Artist",
    medium: "Works on Paper",
    projectTitle: "瞬間 / Trace",
    program: "Foundation for Contemporary Arts",
    programCycle: "2024",
    completeness: 88,
    reviewer: "Avery Thomas",
    submitted: "May 10, 2024",
    status: "Pending Vote",
    priority: "Medium",
    image: "/artwork/trace.png",
    statement:
      "Trace examines the fleeting instant between gesture and disappearance. Working with ink on suspended paper, I record the residue of movement, allowing each mark to hover between presence and erasure.",
    internalNote: {
      body: "Compelling work; awaiting one reference letter before committee vote.",
      author: "Avery Thomas",
      date: "May 10, 2024",
    },
    activity: [
      { id: "c1", actor: "Committee", action: "scheduled for vote", date: "May 13, 2024" },
      { id: "c2", actor: "Avery Thomas", action: "completed review", date: "May 12, 2024" },
      { id: "c3", actor: "System", action: "Application submitted", date: "May 10, 2024" },
    ],
  },
  {
    id: "sofia-karim",
    artist: "Sofia Karim",
    location: "Paris, France",
    discipline: "Visual Artist",
    medium: "Painting",
    projectTitle: "The Second Horizon",
    program: "Cité Internationale des Arts",
    programCycle: "2024",
    completeness: 100,
    reviewer: "Sophia Lee",
    submitted: "May 8, 2024",
    status: "Shortlisted",
    priority: "High",
    image: "/artwork/second-horizon.png",
    statement:
      "The Second Horizon is a series of luminous landscapes that dissolve the line between land and sky. I am interested in thresholds — the soft, uncertain zones where one state becomes another.",
    internalNote: {
      body: "Shortlisted unanimously. Exceptional portfolio and clear institutional fit.",
      author: "Sophia Lee",
      date: "May 9, 2024",
    },
    activity: [
      { id: "d1", actor: "Committee", action: "moved to shortlist", date: "May 9, 2024" },
      { id: "d2", actor: "Sophia Lee", action: "completed review", date: "May 8, 2024" },
      { id: "d3", actor: "System", action: "Application submitted", date: "May 8, 2024" },
    ],
  },
  {
    id: "daniel-osei",
    artist: "Daniel Osei",
    location: "Accra, Ghana",
    discipline: "Visual Artist",
    medium: "Mixed Media",
    projectTitle: "Fragments of the Coast",
    program: "ISCP Residency",
    programCycle: "Fall 2024",
    completeness: 92,
    reviewer: "Marcus Chen",
    submitted: "May 8, 2024",
    status: "In Review",
    priority: "Medium",
    image: "/artwork/fragments-of-the-coast.png",
    statement:
      "Fragments of the Coast gathers weathered objects from disappearing shorelines into quiet assemblages. The work is a meditation on erosion, memory, and the fragile archives the sea leaves behind.",
    internalNote: {
      body: "Promising material practice. Requesting clarification on installation logistics.",
      author: "Marcus Chen",
      date: "May 9, 2024",
    },
    activity: [
      { id: "e1", actor: "Marcus Chen", action: "requested info", date: "May 9, 2024" },
      { id: "e2", actor: "Marcus Chen", action: "started review", date: "May 8, 2024" },
      { id: "e3", actor: "System", action: "Application submitted", date: "May 8, 2024" },
    ],
  },
]

export const kpis = [
  {
    label: "Total Applications",
    value: "1,248",
    delta: "18% from last cycle",
    trend: "up" as const,
    icon: "clipboard",
  },
  {
    label: "In Review",
    value: "432",
    delta: "34.6% of total",
    trend: "neutral" as const,
    icon: "eye",
  },
  {
    label: "Shortlisted",
    value: "128",
    delta: "10.3% of total",
    trend: "neutral" as const,
    icon: "bookmark",
  },
  {
    label: "Pending Committee Vote",
    value: "28",
    delta: "2.2% of total",
    trend: "neutral" as const,
    icon: "users",
  },
  {
    label: "Deadlines This Week",
    value: "12",
    delta: "3 programs",
    trend: "neutral" as const,
    icon: "calendar",
  },
  {
    label: "Incomplete Applications",
    value: "79",
    delta: "6.3% of total",
    trend: "neutral" as const,
    icon: "file",
  },
]

export const applicationsOverTime = [
  { month: "Dec '23", applications: 156 },
  { month: "Jan '24", applications: 198 },
  { month: "Feb '24", applications: 264 },
  { month: "Mar '24", applications: 312 },
  { month: "Apr '24", applications: 372 },
  { month: "May '24", applications: 414 },
]

export const statusBreakdown = [
  { label: "In Review", pct: "34.6%", count: 432, color: "oklch(0.55 0.2 287)" },
  { label: "Shortlisted", pct: "10.3%", count: 128, color: "oklch(0.72 0.13 150)" },
  { label: "Interview", pct: "9.1%", count: 114, color: "oklch(0.66 0.13 235)" },
  { label: "Pending Vote", pct: "2.2%", count: 28, color: "oklch(0.74 0.15 60)" },
  { label: "Withdrawn", pct: "1.4%", count: 18, color: "oklch(0.62 0.2 18)" },
  { label: "Incomplete", pct: "42.4%", count: 528, color: "oklch(0.86 0.045 290)" },
]
