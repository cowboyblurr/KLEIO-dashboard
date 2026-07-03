import { cn } from "@/lib/utils"

const toneStyles: Record<string, string> = {
  default: "bg-[#F1ECFB] text-[#5B4B8A]",
  success: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.4_0.13_150)]",
  warning: "bg-[oklch(0.95_0.04_75)] text-[oklch(0.48_0.12_65)]",
  info: "bg-[#F7F4FF] text-[#5B4B8A] border border-[#E7E1F7]",
}

export function DemoStatusChip({
  label,
  tone = "default",
  className,
}: {
  label: string
  tone?: keyof typeof toneStyles
  className?: string
}) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-semibold", toneStyles[tone], className)}>
      {label}
    </span>
  )
}
