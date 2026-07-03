"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { assetPath } from "@/lib/asset-path"
import { cn } from "@/lib/utils"
import { getHomeHrefForSession } from "@/lib/kleio-demo-auth"

export function KleioWordmarkLink({
  className,
  imageClassName = "h-6 w-auto",
  imageStyle,
  priority = false,
  href: staticHref,
}: {
  className?: string
  imageClassName?: string
  imageStyle?: React.CSSProperties
  priority?: boolean
  /** Fixed destination for the wordmark home button. When omitted, routing is session-aware. */
  href?: string
}) {
  const [sessionHref, setSessionHref] = useState("/")

  useEffect(() => {
    if (staticHref) return
    setSessionHref(getHomeHrefForSession())
  }, [staticHref])

  const href = staticHref ?? sessionHref

  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="KLEIO home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath("/kleio-wordmark.png")}
        alt="KLEIO"
        className={imageClassName}
        style={imageStyle}
        draggable={false}
        fetchPriority={priority ? "high" : undefined}
      />
    </Link>
  )
}
