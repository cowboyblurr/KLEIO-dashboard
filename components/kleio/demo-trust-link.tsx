import Link from "next/link"
import { cn } from "@/lib/utils"

export function DemoTrustLink({
  className,
  label = "What is real?",
}: {
  className?: string
  label?: string
}) {
  return (
    <Link
      href="/demo/trust/"
      className={cn(
        "inline-flex items-center rounded-full border border-[#E7E1F7] bg-white/90 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#5B4B8A] shadow-[0_10px_28px_rgba(82,64,130,0.1)] backdrop-blur-sm transition-colors hover:bg-[#F7F4FF]",
        className,
      )}
    >
      {label}
    </Link>
  )
}
