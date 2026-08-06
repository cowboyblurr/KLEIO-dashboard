import type { ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function SupportingTaskDisclosure({
  icon: Icon,
  label,
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: {
  icon: LucideIcon
  label: string
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  return (
    <details
      className={cn(
        "group rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.045)]",
        className,
      )}
      open={defaultOpen || undefined}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/20 [&::-webkit-details-marker]:hidden sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F2EDFC] text-[#5B4B8A]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#81788E]">{label}</span>
          <span className="mt-0.5 block text-sm font-semibold text-[#292631]">{title}</span>
          {description && <span className="mt-0.5 hidden text-xs leading-5 text-[#746E80] sm:block">{description}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#75639E] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-[#EEEAF6] px-4 py-4 sm:px-5">{children}</div>
    </details>
  )
}
