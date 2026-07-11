import Link from "next/link"
import { FileCheck2, Layers3, MapPin, UsersRound } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { programHrefByTitle } from "@/lib/kleio-entity-routes"
import type { kleioSyntheticInstitutionProfiles } from "@/lib/kleio-profile-data"
import { InstitutionProfileCta } from "@/components/kleio/profile/institution-profile-cta"
import { InstitutionNativeBadge } from "@/components/kleio/profile/institution-native-badge"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"

type InstitutionProfile = (typeof kleioSyntheticInstitutionProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

const cardStyle = { borderColor: lavenderSoftLine, boxShadow: cardShadow } as const

const workflowSteps = [
  ["Intake", "/signup/artist/"],
  ["Eligibility Check", "/review-queue/"],
  ["Reviewer Assignment", "/committee/"],
  ["Committee Review", "/review-room/"],
  ["Shortlist", "/shortlist/"],
  ["Decision Record", "/activity-log/"],
  ["Report", "/reports/"],
] as const

const workspaceValue = [
  { title: "Cleaner Intake", body: "Receive applications, documents, links, and missing-material signals in one place.", href: "/submissions/" },
  { title: "Reviewer Coordination", body: "Keep committee notes, assignments, progress, and decisions connected to the same program.", href: "/committee/" },
  { title: "Preserved Records", body: "Turn review activity into reports and institutional memory your team can revisit.", href: "/reports/" },
]

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border bg-white p-5 xl:p-6 ${className}`} style={cardStyle}>{children}</section>
}

function programStatusStyle(status: string) {
  switch (status) {
    case "Open": return "bg-[oklch(0.94_0.04_150)] text-[oklch(0.4_0.13_150)]"
    case "Reviewing": return "bg-[oklch(0.95_0.04_75)] text-[oklch(0.48_0.12_65)]"
    default: return "bg-[#F1ECFB] text-[#5B4B8A]"
  }
}

export function InstitutionPublicProfile({ profile }: { profile: InstitutionProfile }) {
  const stats = [
    { label: "Active Programs", value: profile.publicSignals.activePrograms, href: "/programs/" },
    { label: "Applications in Review", value: profile.publicSignals.applicationsInReview, href: "/submissions/" },
    { label: "Reviewers", value: profile.publicSignals.reviewers, href: "/committee/" },
    { label: "Reports in Progress", value: profile.publicSignals.reportsInProgress, href: "/reports/" },
  ]

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <section className="overflow-hidden rounded-[1.5rem] border bg-white" style={cardStyle}>
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1fr)] xl:p-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(profile.coverImage)} alt={`${profile.displayName} profile image`} className="h-full w-full object-cover object-center" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: lavenderDeep }}>Institution Profile</p>
            <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: inkColor }}>{profile.displayName}</h1><InstitutionNativeBadge nativeOnKleio={profile.nativeOnKleio} /></div>
            <p className="mt-2 text-sm" style={{ color: mutedColor }}>{profile.institutionType} · {profile.location}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{profile.tags.map((tag) => <ProfileChip key={tag} label={tag} />)}</div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "#4A4458" }}>{profile.shortDescription}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => <Link key={stat.label} href={stat.href} className="rounded-xl border px-3 py-2.5 transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}><p className="font-serif text-xl font-semibold tabular-nums" style={{ color: inkColor }}>{stat.value}</p><p className="mt-0.5 text-[0.65rem] leading-tight" style={{ color: mutedColor }}>{stat.label}</p></Link>)}
            </div>
          </div>
        </div>
      </section>

      <Card>
        <h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: inkColor }}>Active Programs</h2>
        <p className="mt-1 mb-4 max-w-2xl text-xs leading-relaxed" style={{ color: mutedColor }}>Open calls, grants, residencies, exhibitions, and review processes currently represented through KLEIO.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.activePrograms.map((program) => {
            const href = programHrefByTitle(program.title)
            return <Link key={program.title} href={href} className="block rounded-2xl border p-4 transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold" style={{ color: inkColor }}>{program.title}</h3><span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${programStatusStyle(program.status)}`}>{program.status}</span></div><p className="mt-1 text-xs" style={{ color: mutedColor }}>{program.type} · Deadline {program.deadline}</p><p className="mt-2 text-sm leading-relaxed" style={{ color: "#4A4458" }}>{program.description}</p></Link>
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2"><FileCheck2 className="size-4" style={{ color: lavenderDeep }} /><h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: inkColor }}>Review Workflow</h2></div>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>A structured view of how submissions move from intake to eligibility review, reviewer assignment, shortlist, decision, and reporting.</p>
        <div className="flex flex-wrap gap-2">{workflowSteps.map(([step, href], index) => <Link key={step} href={href} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: inkColor }}><span className="grid size-4 place-items-center rounded-full bg-[#F1ECFB] text-[0.6rem] font-bold" style={{ color: lavenderDeep }}>{index + 1}</span>{step}</Link>)}</div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2"><UsersRound className="size-4" style={{ color: lavenderDeep }} /><h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: inkColor }}>What Artists Can Expect</h2></div>
        <p className="max-w-3xl text-sm leading-relaxed" style={{ color: "#4A4458" }}>KLEIO helps institutions keep submission requirements, reviewer context, missing materials, and decision history organized so artists are not lost in scattered emails or unclear review stages.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {workspaceValue.map((value) => <Link href={value.href} key={value.title} className="block rounded-2xl border bg-white p-5 transition-colors hover:bg-[#F7F4FF] xl:p-6" style={cardStyle}><Layers3 className="size-4" style={{ color: lavenderDeep }} /><h3 className="mt-3 text-sm font-semibold" style={{ color: inkColor }}>{value.title}</h3><p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{value.body}</p></Link>)}
      </div>

      <InstitutionProfileCta />
    </div>
  )
}
