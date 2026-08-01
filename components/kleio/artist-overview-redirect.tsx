"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function ArtistOverviewRedirect({ message }: { message: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace("/artist-dashboard/")
  }, [router])

  return (
    <main className="grid h-full place-items-center bg-[#FCFBFE] px-6">
      <p
        className="flex items-center gap-2 text-sm font-medium text-[#625C70]"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-4 animate-spin text-[#5B4B8A]" />
        {message}
      </p>
    </main>
  )
}
