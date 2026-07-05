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

const STAGE_PX: Record<KleioAssistObjectSize, number> = {
  sm: 64,
  md: 112,
  lg: 168,
}

const VISUAL_PX: Record<KleioAssistObjectSize, number> = {
  sm: 40,
  md: 68,
  lg: 100,
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

// KLEIO Assist uses a separate GIF asset from the landing hero video. Do not replace the landing hero video with this asset.
function AssistGif({
  visualPx,
  onError,
}: {
  visualPx: number
  onError: () => void
}) {
  return (
    <img
      src={assetPath("/assist/kleio-assist-object.gif")}
      alt=""
      aria-hidden
      className="kleio-assist-object-gif kleio-assist-motion"
      style={{ width: visualPx, height: visualPx }}
      onError={onError}
    />
  )
}

function AssistObjectStage({
  size,
  mode,
  assetError,
  reducedMotion,
  onAssetError,
}: {
  size: KleioAssistObjectSize
  mode: KleioAssistObjectMode
  assetError: boolean
  reducedMotion: boolean
  onAssetError: () => void
}) {
  const stagePx = STAGE_PX[size]
  const visualPx = VISUAL_PX[size]
  const ringClass = MODE_RING_CLASS[mode]

  const inner =
    assetError || reducedMotion ? (
      <AssistFallback sizePx={visualPx} />
    ) : (
      <AssistGif visualPx={visualPx} onError={onAssetError} />
    )

  return (
    <div className="kleio-assist-object-visual">
      <div
        className="kleio-assist-object-stage"
        style={{ width: stagePx, height: stagePx }}
      >
        {inner}
        <div className={cn("kleio-assist-object-ring", ringClass)} aria-hidden />
      </div>
    </div>
  )
}

/** Standalone visual — circular stage + GIF + ring. Same composition as inside KleioAssistObject. */
export function KleioAssistObjectVisual({
  size = "sm",
  mode = "idle",
  className,
}: {
  size?: KleioAssistObjectSize
  mode?: KleioAssistObjectMode
  className?: string
}) {
  const [assetError, setAssetError] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return (
    <div className={className}>
      <AssistObjectStage
        size={size}
        mode={mode}
        assetError={assetError}
        reducedMotion={reducedMotion}
        onAssetError={() => setAssetError(true)}
      />
    </div>
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
  const [assetError, setAssetError] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const safeProgress = clampProgress(progress)
  const showProgress = safeProgress !== undefined

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const objectStage = (
    <AssistObjectStage
      size={size}
      mode={mode}
      assetError={assetError}
      reducedMotion={reducedMotion}
      onAssetError={() => setAssetError(true)}
    />
  )

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
        {objectStage}
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
      {objectStage}
      {textNode}
    </div>
  )
}
