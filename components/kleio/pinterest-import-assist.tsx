import { ArrowDown, Images, ShieldCheck } from "lucide-react"

const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

export function PinterestImportAssist() {
  return (
    <section id="pinterest-import" data-integration-status="configuration-required" className="scroll-mt-6 rounded-[28px] border border-[#E2DCF1] bg-white p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="pinterest-import-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Pinterest import · setup required</p>
          <h2 id="pinterest-import-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em]">Connect only after the official read-only flow is approved</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">Pinterest import is intentionally disabled in this build. KLEIO will not represent it as live until the Pinterest app, redirect URI, privacy surfaces, token exchange, revocation flow, and production access are verified.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"><ShieldCheck className="size-4" />No scraping or password collection</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-5">
          <h3 className="font-serif text-xl font-semibold">Production connection requirements</h3>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#746E80]">
            <li><strong className="text-[#292631]">Minimum permissions:</strong> request only <code>boards:read</code> and <code>pins:read</code>.</li>
            <li><strong className="text-[#292631]">Artist selection:</strong> show boards and Pins in a selectable review grid; never import an entire account automatically.</li>
            <li><strong className="text-[#292631]">Preview labeling:</strong> preserve the Pin URL and board source, and mark uncertain image quality as an external preview.</li>
            <li><strong className="text-[#292631]">Original replacement:</strong> ask the artist to replace a Pin preview with an original application-quality file.</li>
            <li><strong className="text-[#292631]">Account control:</strong> provide disconnect, token revocation, expiration recovery, and deletion of unfinished source data.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Images className="size-5" /></span>
          <h3 className="mt-4 font-serif text-xl font-semibold">Current beta path</h3>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Use an original file from the artist’s device or Google Drive. Pinterest links can remain in the artist’s external-link fields, but their contents are not analyzed by Website Import Assist.</p>
          <div className="mt-5 grid gap-2">
            <button type="button" disabled aria-disabled="true" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#E9E5EF] px-4 text-sm font-semibold text-[#81788E]">Connect Pinterest</button>
            <a href="#device-drive-import" className={secondary}>Use device or Drive now <ArrowDown className="size-4" /></a>
          </div>
        </div>
      </div>
    </section>
  )
}
