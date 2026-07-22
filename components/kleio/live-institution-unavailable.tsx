import Link from "next/link"
import { Construction, Database, LayoutDashboard } from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"

export function LiveInstitutionUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[980px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Institution workspace"
          title={title}
          description={description}
          primaryCta={{ label: "Return to overview", href: "/dashboard/" }}
        />
        <section className="rounded-2xl border border-[#E7E1F7] bg-white p-8 text-center shadow-[0_18px_48px_rgba(82,64,130,0.06)]">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F7F4FF] text-[#5B4B8A]"><Construction className="size-5" /></span>
          <h2 className="mt-4 font-serif text-xl font-semibold text-[#292631]">No live records are available for this tool yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#6F6882]">KLEIO is intentionally not substituting guided-demo records inside an authenticated institution workspace. This page will remain empty until its live persistence workflow is implemented.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><LayoutDashboard className="size-4" />Institution overview</Link>
            <Link href="/reports/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]"><Database className="size-4" />Live reports</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
