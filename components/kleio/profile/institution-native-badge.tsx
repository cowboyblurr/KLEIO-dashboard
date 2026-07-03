import { BadgeCheck } from "lucide-react"

/**
 * Native/source signal for institution profiles.
 * `nativeOnKleio === true` → "Native KLEIO profile" (demo-only native badge, not legal verification).
 * Otherwise → subtle directory-source label.
 */
export function InstitutionNativeBadge({ nativeOnKleio }: { nativeOnKleio: boolean }) {
  if (nativeOnKleio) {
    return (
      <span
        title="Profile created natively in KLEIO."
        className="inline-flex items-center gap-1 rounded-full bg-[#F1ECFB] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A]"
      >
        <BadgeCheck className="size-3.5" />
        Native KLEIO profile
      </span>
    )
  }

  return (
    <span
      title="Profile sourced from a public directory."
      className="inline-flex items-center rounded-full border border-[#E7E1F7] px-2.5 py-1 text-[0.68rem] font-medium text-[#7F7890]"
    >
      Directory profile
    </span>
  )
}
