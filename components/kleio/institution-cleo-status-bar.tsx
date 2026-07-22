"use client"

import { Sparkles } from "lucide-react"

export function InstitutionCleoStatusBar() {
  return (
    <section className="rounded-2xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 shadow-[0_12px_36px_rgba(82,64,130,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F1ECFB] text-[#5B4B8A]">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#292631]">Cleo Assist for open-call preparation</p>
          <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">
            Cleo may eventually help prepare reviewable drafts for descriptions, eligibility language, application questions, rubrics, and applicant communications. It is not active in this connected editor yet, and KLEIO does not generate, approve, publish, or change institutional criteria automatically.
          </p>
        </div>
      </div>
    </section>
  )
}
