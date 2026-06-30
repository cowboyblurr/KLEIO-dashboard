"use client"

import Image from "next/image"
import Link from "next/link"
import { assetPath } from "@/lib/asset-path"
import { cn } from "@/lib/utils"
import { getPublicHomeHref } from "@/lib/kleio-demo-auth"

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
    <Link
      href={getPublicHomeHref()}
      aria-label="KLEIO homepage"
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
    </Link>
  )
}
