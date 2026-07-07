import Link from "next/link"

const links = [
  { href: "/demo/reports-export-archive/", label: "Reports" },
  { href: "/demo/roles/", label: "Roles" },
  { href: "/demo/pilot-readiness/", label: "Pilot" },
]

export function DemoProofLinks() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1.5 rounded-full border border-[#E7E1F7] bg-white/90 px-2.5 py-2 shadow-[0_12px_34px_rgba(82,64,130,0.12)] backdrop-blur-sm max-md:hidden">
      <span className="px-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">Institution proof</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-full px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
          {link.label}
        </Link>
      ))}
    </div>
  )
}
