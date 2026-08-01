import { NextResponse } from "next/server"

const PREFIX_PATTERN = /^[A-F0-9]{5}$/
const HIBP_RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range"

export async function POST(request: Request) {
  let prefix = ""

  try {
    const body = (await request.json()) as { prefix?: unknown }
    prefix = typeof body.prefix === "string" ? body.prefix.trim().toUpperCase() : ""
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!PREFIX_PATTERN.test(prefix)) {
    return NextResponse.json({ error: "Invalid password hash prefix." }, { status: 400 })
  }

  try {
    const response = await fetch(`${HIBP_RANGE_ENDPOINT}/${prefix}`, {
      headers: {
        Accept: "text/plain",
        "Add-Padding": "true",
        "User-Agent": "KLEIO-password-security-beta",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Password safety service unavailable." },
        { status: 503 },
      )
    }

    const range = await response.text()
    return new NextResponse(range, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Password safety service unavailable." },
      { status: 503 },
    )
  }
}
