"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ComponentProps } from "react"
import { getExploreArthouseHref, getHomeHrefForSession } from "@/lib/kleio-demo-auth"

type SmartHomeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  fallbackHref?: string
}

/** Session-aware KLEIO wordmark-style navigation. */
export function SmartHomeLink({ fallbackHref = "/", children, ...props }: SmartHomeLinkProps) {
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    setHref(getHomeHrefForSession())
  }, [])

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

/** Institution workspace entry — AuthGate login wall when logged out. */
export function ExploreArthouseLink({ fallbackHref = "/dashboard/", children, ...props }: SmartHomeLinkProps) {
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    setHref(getExploreArthouseHref())
  }, [])

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}
