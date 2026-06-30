"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import {
  DEMO_LOGIN_HINT,
  getDashboardForRole,
  loginDemoUser,
  validateDemoCredentials,
} from "@/lib/kleio-demo-auth"

export function LandingLoginCard() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function routeForRole(role: "artist" | "institution") {
    router.push(getDashboardForRole(role))
  }

  function handleLogin() {
    setError("")
    const session = validateDemoCredentials(email, password)
    if (!session) {
      setError("Use the demo credentials or choose a demo role to continue.")
      return
    }
    routeForRole(session.role)
  }

  function handleInstitutionDemo() {
    setError("")
    loginDemoUser("institution")
    routeForRole("institution")
  }

  function handleArtistDemo() {
    setError("")
    loginDemoUser("artist")
    routeForRole("artist")
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[1.1rem] p-3.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E7E1F7",
        boxShadow: "0 18px 48px rgba(82, 64, 130, 0.08)",
      }}
    >
      <h2 className="font-serif text-[0.95rem] font-semibold" style={{ color: "#292631" }}>
        Welcome back
      </h2>
      <p className="mt-0.5 text-[0.68rem]" style={{ color: "#7F7890" }}>
        Log in to your account
      </p>

      <div className="mt-2.5 space-y-1.5">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
          style={{ borderColor: "#DCD5F3", color: "#292631" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="h-7 w-full rounded-full border bg-white px-3.5 text-[0.72rem] outline-none transition placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
          style={{ borderColor: "#DCD5F3", color: "#292631" }}
        />
      </div>

      <p className="mt-1.5 truncate text-[0.58rem] leading-tight" style={{ color: "#7F7890" }} title={DEMO_LOGIN_HINT}>
        {DEMO_LOGIN_HINT}
      </p>

      {error && (
        <p className="mt-1 truncate text-[0.58rem] leading-tight" style={{ color: "oklch(0.45 0.14 55)" }}>
          {error}
        </p>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="text-[0.64rem]" style={{ color: "#7F7890" }}>
          Demo login
        </span>
        <button
          type="button"
          onClick={handleLogin}
          className="flex h-7 items-center justify-center gap-1 rounded-full border px-3.5 text-[0.72rem] transition-colors hover:bg-[#1F1B29]"
          style={{ backgroundColor: "#292631", borderColor: "#292631", color: "#FFFFFF" }}
        >
          Log in
          <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleInstitutionDemo}
          className="h-7 rounded-full border px-2 text-[0.66rem] transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#D8D0F2", color: "#5B4B8A" }}
        >
          Enter Institution Demo
        </button>
        <button
          type="button"
          onClick={handleArtistDemo}
          className="h-7 rounded-full border px-2 text-[0.66rem] transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#D8D0F2", color: "#5B4B8A" }}
        >
          Enter Artist Demo
        </button>
      </div>
    </div>
  )
}
