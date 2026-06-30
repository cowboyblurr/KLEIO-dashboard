import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { activityLog } from "@/lib/kleio-data"

export default function Page() {
  return (
    <DashboardShell>
      <DemoPageShell
        title="Activity Log"
        description="A complete audit trail of every review, note, and status change across your institution's programs."
      >
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Recent activity</h2>
          </div>
          <ul className="divide-y divide-border">
            {activityLog.map((entry) => (
              <li key={entry.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.actor}</span>{" "}
                    <span className="text-muted-foreground">{entry.action}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{entry.target}</p>
              </li>
            ))}
          </ul>
        </section>
      </DemoPageShell>
    </DashboardShell>
  )
}
