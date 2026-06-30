"use client"

import Image from "next/image"
import { assetPath } from "@/lib/asset-path"
import { cn } from "@/lib/utils"
import { SmartHomeLink } from "@/components/kleio/smart-home-link"

export function KleioWordmarkLink({
  className,
  imageClassName = "h-6 w-auto",
  priority = false,
  imageStyle,
}: {
  className?: string
  imageClassName?: string
  priority?: boolean
  imageStyle?: React.CSSProperties
}) {
  return (
    <SmartHomeLink
      aria-label="KLEIO home"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src={assetPath("/kleio-wordmark.png")}
        alt="KLEIO"
        width={1024}
        height={189}
        priority={priority}
        className={imageClassName}
        style={imageStyle}
      />
    </SmartHomeLink>
  )
}
