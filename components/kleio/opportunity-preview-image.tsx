"use client"

import { useMemo, useState } from "react"
import {
  Award,
  Building2,
  ImageIcon,
  Landmark,
  Megaphone,
  Palette,
  Plane,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { resolveOpportunityImageUrl, type OpportunityImageMetadata } from "@/lib/kleio-opportunity-images"

type PreviewOpportunity = Partial<OpportunityImageMetadata> & {
  title: string
  provider_name?: string
  opportunity_type?: string
}

type Variant = "thumbnail" | "hero" | "editor"

const visualByType: Record<string, { icon: LucideIcon; label: string; classes: string }> = {
  grant: { icon: Landmark, label: "Grant", classes: "from-[#ECE7FF] via-[#F7F4FF] to-[#E6F1FF] text-[#5C4B96]" },
  residency: { icon: Plane, label: "Residency", classes: "from-[#E8F7F3] via-[#F5FBF9] to-[#EAF1FF] text-[#286F69]" },
  fellowship: { icon: Sparkles, label: "Fellowship", classes: "from-[#FFF1DC] via-[#FFF8ED] to-[#F3ECFF] text-[#9A642F]" },
  commission: { icon: Palette, label: "Commission", classes: "from-[#F7EAF2] via-[#FFF7FB] to-[#ECE9FF] text-[#8A4E70]" },
  prize_award: { icon: Award, label: "Prize or award", classes: "from-[#FFF3D6] via-[#FFF9EC] to-[#F0EBFF] text-[#8A682C]" },
  open_call: { icon: Megaphone, label: "Open call", classes: "from-[#EAE7FF] via-[#F8F6FF] to-[#E8F4FF] text-[#5A4B8B]" },
  exhibition: { icon: Building2, label: "Exhibition", classes: "from-[#E7F3EF] via-[#F7FBFA] to-[#EFEAFF] text-[#376D62]" },
  other: { icon: ImageIcon, label: "Opportunity", classes: "from-[#ECE8F7] via-[#F9F7FC] to-[#EAF1F5] text-[#63597B]" },
}

function originLabel(origin: string | undefined, hasImage: boolean) {
  if (!hasImage) return "KLEIO category cover"
  if (origin === "institution_upload") return "Institution image"
  if (origin === "provider_upload") return "Provider image"
  if (origin === "official_source") return "Official source image"
  if (origin === "provider_logo") return "Provider logo"
  return "Source image"
}

export function OpportunityPreviewImage({
  opportunity,
  variant = "thumbnail",
  showCaption = false,
  className = "",
}: {
  opportunity: PreviewOpportunity
  variant?: Variant
  showCaption?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const imageUrl = useMemo(() => resolveOpportunityImageUrl(opportunity), [opportunity.preview_image_path, opportunity.preview_image_url])
  const hasImage = Boolean(imageUrl) && !failed
  const typeKey = opportunity.opportunity_type?.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "") || "other"
  const visual = visualByType[typeKey] || visualByType.other
  const Icon = visual.icon
  const sizeClass = variant === "hero" ? "aspect-[16/7] min-h-56" : variant === "editor" ? "aspect-video min-h-48" : "aspect-video min-h-40"
  const alt = opportunity.preview_image_alt_text?.trim() || `${opportunity.title} opportunity preview image`
  const caption = opportunity.preview_image_attribution?.trim()

  return <figure className={className}>
    <div className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br shadow-[0_18px_44px_rgba(70,54,114,0.10)] ${sizeClass} ${visual.classes}`}>
      {hasImage ? <img
        src={imageUrl}
        alt={alt}
        loading={variant === "hero" ? "eager" : "lazy"}
        className="absolute inset-0 size-full object-cover"
        onError={() => setFailed(true)}
      /> : <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] backdrop-blur">{visual.label}</span>
          <div className="rounded-2xl border border-white/80 bg-white/65 p-3 backdrop-blur"><Icon className="size-6" /></div>
        </div>
        <div>
          <p className="max-w-[90%] font-serif text-xl font-semibold leading-tight">{opportunity.title}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{opportunity.provider_name || "KLEIO opportunity directory"}</p>
        </div>
      </div>}
      <div className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A] shadow-sm backdrop-blur">
        {originLabel(opportunity.preview_image_origin, hasImage)}
      </div>
    </div>
    {showCaption && <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
      {hasImage ? <>{caption || "Image supplied by the opportunity source."}{opportunity.preview_image_source_url && <> · <a className="font-medium text-primary underline-offset-2 hover:underline" href={opportunity.preview_image_source_url} target="_blank" rel="noreferrer">Image source</a></>}</> : <>This is a KLEIO category cover, not provider artwork.</>}
    </figcaption>}
  </figure>
}
