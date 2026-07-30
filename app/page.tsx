import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { LandingPage } from "@/components/kleio/landing-page"

/** Public KLEIO homepage — the marketing landing page. */
export const metadata: Metadata = {
  title: "KLEIO Arthouse",
  description:
    "Artist applications and institutional review, brought together in one structured workspace.",
}

export default function Page() {
  return (
    <div className="relative">
      <LandingPage />
      <Link
        href="/opportunities/"
        className="fixed bottom-4 right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white/95 px-4 text-sm font-semibold text-[#5B4B8A] shadow-[0_14px_36px_rgba(82,64,130,0.16)] backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 sm:bottom-6 sm:right-6"
      >
        <Search className="size-4" />
        Browse artist opportunities
      </Link>
    </div>
  )
}
