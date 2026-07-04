"use client"

import { useEffect, useState } from "react"
import { assetPath } from "@/lib/asset-path"
import { cn } from "@/lib/utils"

export type KleioAssistObjectMode =
  | "idle"
  | "preparing"
  | "reviewing"
  | "attention"
  | "complete"
  | "translating"

export type KleioAssistObjectSize = "sm" | "md" | "lg"

export type KleioAssistObjectProps = {
  mode?: KleioAssistObjectMode
  title: string
  description?: string
  progress?: number
  size?: KleioAssistObjectSize
  compact?: boolean
  className?: string
}

const SIZE_PX: Record<KleioAssistObjectSize, number> = {
  sm: 52,
  md: 84,
  lg: 140,
}

const MODE_RING_CLASS: Record<KleioAssistObjectMode, string> = {
  idle: "kleio-assist-ring",
  preparing: "kleio-assist-pulse kleio-assist-ring",
  reviewing: "kleio-assist-reviewing",
  attention: "kleio-assist-attention",
  complete: "kleio-assist-complete",
  translating: "kleio-assist-translating",
}

function clampProgress(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined
  return Math.min(100, Math.max(0, value))
}

function AssistFallback({ sizePx }: { sizePx: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: sizePx, height: sizePx }}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, #F7F4FF 0%, #E7E1F7 45%, #D8D0F2 100%)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: sizePx * 0.72,
          height: sizePx * 0.72,
          background:
            "radial-gradient(circle at 50% 40%, #FFFFFF 0%, #E7E1F7 55%, #A997E8 100%)",
          boxShadow: "0 0 24px rgba(169, 151, 232, 0.25)",
        }}
      />
      <div
        className="absolute rounded-full opacity-40"
        style={{
          width: sizePx * 0.45,
          height: sizePx * 0.45,
          background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
    </div>
  )
}

function AssistVideo({
  sizePx,
  reducedMotion,
  onError,
}: {
  sizePx: number
  reducedMotion: boolean
  onError: () => void
}) {
  if (reducedMotion) {
    return <AssistFallback sizePx={sizePx} />
  }

  return (
    <video
      className="kleio-assist-motion h-full w-full object-contain"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      onError={onError}
      style={{ width: sizePx, height: sizePx }}
    >
      <source src={assetPath("/landing/kleio-transparent-center-video.mp4")} type="video/mp4" />
    </video>
  )
}

export function KleioAssistObject({
  mode = "idle",
  title,
  description,
  progress,
  size = "md",
  compact = false,
  className,
}: KleioAssistObjectProps) {
  const [videoError, setVideoError] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const sizePx = SIZE_PX[size]
  const safeProgress = clampProgress(progress)
  const showProgress = safeProgress !== undefined

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const objectVisual =
    videoError || reducedMotion ? (
      <AssistFallback sizePx={sizePx} />
    ) : (
      <AssistVideo sizePx={sizePx} reducedMotion={reducedMotion} onError={() => setVideoError(true)} />
    )

  const ringClass = MODE_RING_CLASS[mode]

  const textNode = (
    <div className={cn("min-w-0", compact ? "flex-1" : "text-center")}>
      <p
        className={cn(
          "font-medium text-[#292631]",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            "mt-1 text-[#7F7890]",
            size === "sm" ? "text-[0.7rem] leading-snug" : "text-xs leading-relaxed",
          )}
        >
          {description}
        </p>
      )}
      {showProgress && (
        <div className={cn("mt-2.5", compact ? "max-w-xs" : "mx-auto max-w-sm")}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
            className="h-1 overflow-hidden rounded-full bg-[#E7E1F7]"
          >
            <div
              className="h-full rounded-full bg-[#A997E8] transition-[width] duration-500 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/60 p-4",
          className,
        )}
      >
        <div
          className={cn("relative flex shrink-0 items-center justify-center rounded-full", ringClass)}
          style={{ width: sizePx, height: sizePx }}
        >
          {objectVisual}
        </div>
        {textNode}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/40 px-6 py-8",
        className,
      )}
    >
      <div
        className={cn("relative flex shrink-0 items-center justify-center rounded-full", ringClass)}
        style={{ width: sizePx, height: sizePx }}
      >
        {objectVisual}
      </div>
      {textNode}
    </div>
  )
}
