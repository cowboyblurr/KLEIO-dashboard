import {
  activityLog,
  allSubmissions,
  artists,
  collaborators,
  demoMessages,
  institution,
  messageThreads,
  notes,
  programs,
  reviews,
  type ActivityLogEntry,
  type Artist,
  type Collaborator,
  type DemoMessage,
  type Institution,
  type MessageThread,
  type Note,
  type Program,
  type Review,
  type Submission,
} from "@/lib/kleio-data"

export type KleioSourceKind = "seed" | "database" | "api" | "ingested" | "user-created" | "institution-created"

export type KleioSourceRecord<T> = {
  sourceKind: KleioSourceKind
  sourceLabel: string
  fetchedAt: string
  verified: boolean
  record: T
}

export type KleioSourceSnapshot = {
  sourceKind: KleioSourceKind
  sourceLabel: string
  generatedAt: string
  institution: KleioSourceRecord<Institution>
  artists: KleioSourceRecord<Artist>[]
  programs: KleioSourceRecord<Program>[]
  submissions: KleioSourceRecord<Submission>[]
  collaborators: KleioSourceRecord<Collaborator>[]
  reviews: KleioSourceRecord<Review>[]
  notes: KleioSourceRecord<Note>[]
  messages: KleioSourceRecord<DemoMessage>[]
  messageThreads: KleioSourceRecord<MessageThread>[]
  activityLog: KleioSourceRecord<ActivityLogEntry>[]
}

const GENERATED_AT = "2026-08-10T12:00:00.000Z"
const SEED_LABEL = "KLEIO synthetic seed data"

function withSeedSource<T>(record: T): KleioSourceRecord<T> {
  return {
    sourceKind: "seed",
    sourceLabel: SEED_LABEL,
    fetchedAt: GENERATED_AT,
    verified: false,
    record,
  }
}

export function getKleioSourceSnapshot(): KleioSourceSnapshot {
  return {
    sourceKind: "seed",
    sourceLabel: SEED_LABEL,
    generatedAt: GENERATED_AT,
    institution: withSeedSource(institution),
    artists: artists.map(withSeedSource),
    programs: programs.map(withSeedSource),
    submissions: allSubmissions.map(withSeedSource),
    collaborators: collaborators.map(withSeedSource),
    reviews: reviews.map(withSeedSource),
    notes: notes.map(withSeedSource),
    messages: demoMessages.map(withSeedSource),
    messageThreads: messageThreads.map(withSeedSource),
    activityLog: activityLog.map(withSeedSource),
  }
}

export function getKleioRecords() {
  const snapshot = getKleioSourceSnapshot()
  return {
    institution: snapshot.institution.record,
    artists: snapshot.artists.map((entry) => entry.record),
    programs: snapshot.programs.map((entry) => entry.record),
    submissions: snapshot.submissions.map((entry) => entry.record),
    collaborators: snapshot.collaborators.map((entry) => entry.record),
    reviews: snapshot.reviews.map((entry) => entry.record),
    notes: snapshot.notes.map((entry) => entry.record),
    messages: snapshot.messages.map((entry) => entry.record),
    messageThreads: snapshot.messageThreads.map((entry) => entry.record),
    activityLog: snapshot.activityLog.map((entry) => entry.record),
  }
}

export function getKleioSourceSummary() {
  const snapshot = getKleioSourceSnapshot()
  return {
    sourceKind: snapshot.sourceKind,
    sourceLabel: snapshot.sourceLabel,
    generatedAt: snapshot.generatedAt,
    verified: false,
    counts: {
      institutions: 1,
      artists: snapshot.artists.length,
      programs: snapshot.programs.length,
      submissions: snapshot.submissions.length,
      collaborators: snapshot.collaborators.length,
      reviews: snapshot.reviews.length,
      notes: snapshot.notes.length,
      messages: snapshot.messages.length,
      messageThreads: snapshot.messageThreads.length,
      activityLogEntries: snapshot.activityLog.length,
    },
  }
}
