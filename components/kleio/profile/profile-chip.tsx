import { cn } from "@/lib/utils"

/** Soft lavender pill used across the public profile pages. */
export function ProfileChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
        muted ? "bg-[#F1ECFB] text-[#6F6882]" : "bg-[#F1ECFB] text-[#5B4B8A]",
      )}
    >
      {label}
    </span>
  )
}
