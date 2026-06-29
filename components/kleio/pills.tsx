import { cn } from "@/lib/utils"
import type { Priority, SubmissionStatus } from "@/lib/kleio-data"

const statusStyles: Record<SubmissionStatus, string> = {
  "In Review": "bg-[oklch(0.95_0.03_287)] text-[oklch(0.45_0.16_287)]",
  "Pending Vote": "bg-[oklch(0.96_0.05_75)] text-[oklch(0.5_0.12_60)]",
  "Pending Info": "bg-[oklch(0.96_0.05_75)] text-[oklch(0.5_0.12_60)]",
  Shortlisted: "bg-[oklch(0.95_0.06_150)] text-[oklch(0.45_0.12_150)]",
  Interview: "bg-[oklch(0.95_0.04_220)] text-[oklch(0.46_0.12_235)]",
  Withdrawn: "bg-[oklch(0.95_0.04_25)] text-[oklch(0.5_0.16_25)]",
  Incomplete: "bg-muted text-muted-foreground",
}

const priorityStyles: Record<Priority, string> = {
  High: "bg-[oklch(0.95_0.04_18)] text-[oklch(0.52_0.18_18)]",
  Medium: "bg-[oklch(0.96_0.05_70)] text-[oklch(0.5_0.12_60)]",
  Low: "bg-muted text-muted-foreground",
}

export function StatusPill({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        priorityStyles[priority],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {priority}
    </span>
  )
}
