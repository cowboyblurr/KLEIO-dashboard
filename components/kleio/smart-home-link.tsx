"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ComponentProps } from "react"
import { getExploreArthouseHref, getPublicHomeHref } from "@/lib/kleio-demo-auth"

type SmartHomeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  fallbackHref?: string
}

/** Links to the public KLEIO homepage (`/`), never a private workspace. */
export function SmartHomeLink({ fallbackHref = getPublicHomeHref(), children, ...props }: SmartHomeLinkProps) {
  return (
    <Link href={fallbackHref} {...props}>
      {children}
    </Link>
  )
}

/**
 * Signed-in users go to their workspace; anonymous users stay on the public homepage.
 */
export function ExploreArthouseLink({ fallbackHref = getPublicHomeHref(), children, ...props }: SmartHomeLinkProps) {
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
