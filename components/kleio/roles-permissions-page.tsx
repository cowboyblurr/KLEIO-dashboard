import Link from "next/link"
import { ArrowLeft, CheckCircle2, LockKeyhole, UserRoundCheck } from "lucide-react"

const roles = [
  {
    role: "Artist",
    purpose: "Owns the Creative Passport and controls what materials are shared.",
    can: ["edit own profile", "manage materials", "authorize sharing", "track own applications", "respond to artist-facing messages"],
    cannot: ["see internal notes", "see other artists' private applications", "edit institution programs"],
  },
  {
    role: "Institution admin",
    purpose: "Runs programs, review workflows, committees, reports, and preserved history.",
    can: ["create programs", "manage submissions", "invite reviewers", "assign reviews", "send messages", "view reports"],
    cannot: ["edit artist-owned source materials without authorization", "access unrelated institution workspaces"],
  },
  {
    role: "Reviewer",
    purpose: "Reviews assigned submissions without unnecessary administrative access.",
    can: ["view assigned submissions", "read rubric", "submit scores", "leave review notes", "track assigned deadlines"],
    cannot: ["manage programs", "see unrelated submissions", "invite reviewers", "open admin settings"],
  },
  {
    role: "Collaborator / viewer",
    purpose: "Receives limited context based on invitation permissions.",
    can: ["view permitted workspace context", "participate in assigned committee review"],
    cannot: ["perform admin actions", "access private artist files outside scope", "change review settings"],
  },
]

export function RolesPermissionsPage() {
  return (
    <main className="min-h-dvh bg-white px-5 py-10 text-[#292631]">
      <section className="mx-auto w-full max-w-[1120px]">
        <Link href="/demo/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B4B8A] hover:opacity-75">
          <ArrowLeft className="size-3.5" /> Back to demo
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Roles & permissions preview</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] max-md:text-3xl">
            KLEIO separates artist control, institutional work, and reviewer access.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F6882]">
            This preview shows the intended access model before production authentication is connected. It is here to clarify how the live system should protect artist materials, limit reviewer access, and preserve institutional review history.
          </p>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[#5B4B8A] shadow-sm">
              <LockKeyhole className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Current boundary</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
                The current demo uses simulated access for walkthrough purposes. Production authentication, database-backed permissions, file storage, and user sessions are part of the next backend implementation phase.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          {roles.map((item) => (
            <article key={item.role} className="rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_16px_44px_rgba(82,64,130,0.07)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#F7F4FF] text-[#5B4B8A]">
                  <UserRoundCheck className="size-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#292631]">{item.role}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#6F6882]">{item.purpose}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Can</p>
                  <ul className="mt-2 space-y-2 text-sm text-[#6F6882]">
                    {item.can.map((entry) => (
                      <li key={entry} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#5B4B8A]" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Cannot</p>
                  <ul className="mt-2 space-y-2 text-sm text-[#6F6882]">
                    {item.cannot.map((entry) => (
                      <li key={entry} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A997E8]" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#292631] p-5 text-white">
          <h2 className="font-serif text-2xl font-semibold">Next backend requirement</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            The next credibility jump is connecting this role model to real authentication, database-backed policies, assignment checks, and file permissions before accepting real user data.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/demo/infrastructure/" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-[#292631] transition-opacity hover:opacity-90">
              View infrastructure audit
            </Link>
            <Link href="/collaborator-dashboard/" className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
              Preview reviewer seat
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
