"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { loadInstitutionContext } from "@/lib/kleio-live-data"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"

const blank = {
  providerName: "",
  officialWebsite: "",
  contactName: "",
  contactEmail: "",
  title: "",
  opportunityType: "grant",
  summary: "",
  description: "",
  awardMin: "",
  awardMax: "",
  currency: "USD",
  applicationFee: "",
  applicantTypes: "individual_artist",
  eligibleCountries: "",
  eligibleRegions: "",
  disciplines: "",
  careerStages: "",
  ageMin: "",
  ageMax: "",
  requiredMaterials: "Artist biography, Artist statement, CV, Portfolio",
  openingDate: "",
  deadline: "",
  deadlineTimezone: "America/New_York",
  applicationUrl: "",
  guidelinesUrl: "",
  sourceUrl: "",
  participationFormat: "other",
  locations: "",
  languageRequirements: "",
  previousAwardRestrictions: "",
  travelSupported: false,
  accommodationSupported: false,
  remoteAllowed: false,
}

type FormState = typeof blank

type SubmissionRecord = {
  id: string
  title: string
  provider_name: string
  moderation_status: string
  submitted_at: string
  review_notes: string
}

function list(value: string) {
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
}

function numberOrNull(value: string) {
  const parsed = Number(value)
  return value.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>{label}{required ? " *" : ""}</span><input className={input} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function LiveOpportunitySubmission() {
  const [form, setForm] = useState<FormState>(blank)
  const [items, setItems] = useState<SubmissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function refresh() {
    const account = await loadKleioAccount()
    if (!account) throw new Error("Please sign in to continue.")
    const supabase = getSupabaseBrowserClient()
    const { data, error: loadError } = await supabase.from("institution_opportunity_submissions")
      .select("id, title, provider_name, moderation_status, submitted_at, review_notes")
      .eq("submitter_user_id", account.user.id)
      .order("submitted_at", { ascending: false })
    if (loadError) throw loadError
    setItems((data ?? []) as SubmissionRecord[])
  }

  useEffect(() => {
    void refresh().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const account = await loadKleioAccount()
      if (!account) throw new Error("Please sign in to continue.")
      const context = await loadInstitutionContext()
      const sourceUrl = form.sourceUrl.trim() || form.guidelinesUrl.trim() || form.applicationUrl.trim()
      if (!sourceUrl) throw new Error("An official source, guidelines, or application URL is required.")
      if (!form.title.trim() || !form.providerName.trim() || !form.applicationUrl.trim() || !form.deadline) {
        throw new Error("Provider, title, application URL, and deadline are required.")
      }

      const payload = {
        award_min: numberOrNull(form.awardMin),
        award_max: numberOrNull(form.awardMax),
        currency: form.currency.trim().toUpperCase(),
        application_fee: numberOrNull(form.applicationFee),
        eligible_applicant_types: list(form.applicantTypes),
        eligible_countries: list(form.eligibleCountries),
        eligible_regions: list(form.eligibleRegions),
        disciplines: list(form.disciplines),
        career_stages: list(form.careerStages),
        age_min: numberOrNull(form.ageMin),
        age_max: numberOrNull(form.ageMax),
        required_materials: list(form.requiredMaterials),
        opens_at: form.openingDate || null,
        participation_format: form.participationFormat,
        locations: list(form.locations),
        language_requirements: list(form.languageRequirements),
        previous_award_restrictions: form.previousAwardRestrictions.trim(),
        travel_supported: form.travelSupported,
        accommodation_supported: form.accommodationSupported,
        remote_allowed: form.remoteAllowed,
      }

      const supabase = getSupabaseBrowserClient()
      const { error: insertError } = await supabase.from("institution_opportunity_submissions").insert({
        submitter_user_id: account.user.id,
        institution_id: context.institution_id,
        provider_name: form.providerName.trim(),
        official_website: form.officialWebsite.trim(),
        contact_name: form.contactName.trim(),
        contact_email: form.contactEmail.trim().toLowerCase(),
        title: form.title.trim(),
        opportunity_type: form.opportunityType,
        summary: form.summary.trim(),
        description: form.description.trim(),
        application_url: form.applicationUrl.trim(),
        guidelines_url: form.guidelinesUrl.trim(),
        source_url: sourceUrl,
        deadline_at: new Date(`${form.deadline}T23:59:59`).toISOString(),
        deadline_timezone: form.deadlineTimezone.trim(),
        payload,
        moderation_status: "submitted",
        provider_verified: false,
      })
      if (insertError) throw insertError
      setForm(blank)
      setSuccess("Opportunity submitted for KLEIO review. It is not public and the provider is not marked verified.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit the opportunity.")
    } finally {
      setSaving(false)
    }
  }

  return <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1180px] space-y-5">
    <WorkspacePageHeader eyebrow="Institution workspace" title="Submit an opportunity" description="Submit an external grant, residency, fellowship, commission, prize, or open call for moderation. Submission does not create a verified or public record." />

    <section className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      KLEIO requires source attribution and reviews every provider submission before publication. Official-domain information may be checked, but entering an organization name does not verify the provider.
    </section>

    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">Provider and opportunity details</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Provider or organization name" required value={form.providerName} onChange={(value) => update("providerName", value)} />
        <Field label="Official website" type="url" value={form.officialWebsite} onChange={(value) => update("officialWebsite", value)} />
        <Field label="Contact name" value={form.contactName} onChange={(value) => update("contactName", value)} />
        <Field label="Contact email" type="email" value={form.contactEmail} onChange={(value) => update("contactEmail", value)} />
        <Field label="Opportunity title" required value={form.title} onChange={(value) => update("title", value)} />
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Opportunity type</span><select className={input} value={form.opportunityType} onChange={(event) => update("opportunityType", event.target.value)}><option value="grant">Grant</option><option value="residency">Residency</option><option value="fellowship">Fellowship</option><option value="commission">Commission</option><option value="prize_award">Prize or award</option><option value="open_call">Open call</option><option value="other">Other</option></select></label>
      </div>
      <div className="mt-4 grid gap-4"><label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Public summary</span><textarea className={textarea} rows={3} value={form.summary} onChange={(event) => update("summary", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Full description and restrictions</span><textarea className={textarea} rows={6} value={form.description} onChange={(event) => update("description", event.target.value)} /></label></div>
    </section>

    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">Eligibility and application facts</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Award minimum" type="number" value={form.awardMin} onChange={(value) => update("awardMin", value)} />
        <Field label="Award maximum" type="number" value={form.awardMax} onChange={(value) => update("awardMax", value)} />
        <Field label="Currency" value={form.currency} onChange={(value) => update("currency", value)} />
        <Field label="Application fee" type="number" value={form.applicationFee} onChange={(value) => update("applicationFee", value)} />
        <Field label="Applicant types — comma separated" value={form.applicantTypes} onChange={(value) => update("applicantTypes", value)} />
        <Field label="Disciplines — comma separated" value={form.disciplines} onChange={(value) => update("disciplines", value)} />
        <Field label="Eligible countries" value={form.eligibleCountries} onChange={(value) => update("eligibleCountries", value)} />
        <Field label="Eligible regions" value={form.eligibleRegions} onChange={(value) => update("eligibleRegions", value)} />
        <Field label="Career stages" value={form.careerStages} onChange={(value) => update("careerStages", value)} />
        <Field label="Minimum age" type="number" value={form.ageMin} onChange={(value) => update("ageMin", value)} />
        <Field label="Maximum age" type="number" value={form.ageMax} onChange={(value) => update("ageMax", value)} />
        <Field label="Language requirements" value={form.languageRequirements} onChange={(value) => update("languageRequirements", value)} />
        <Field label="Required materials" value={form.requiredMaterials} onChange={(value) => update("requiredMaterials", value)} />
        <Field label="Opening date" type="date" value={form.openingDate} onChange={(value) => update("openingDate", value)} />
        <Field label="Deadline" required type="date" value={form.deadline} onChange={(value) => update("deadline", value)} />
        <Field label="Deadline timezone" value={form.deadlineTimezone} onChange={(value) => update("deadlineTimezone", value)} />
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Participation format</span><select className={input} value={form.participationFormat} onChange={(event) => update("participationFormat", event.target.value)}><option value="other">Not specified</option><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option></select></label>
        <Field label="Locations" value={form.locations} onChange={(value) => update("locations", value)} />
        <Field label="Previous-award restrictions" value={form.previousAwardRestrictions} onChange={(value) => update("previousAwardRestrictions", value)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.travelSupported} onChange={(event) => update("travelSupported", event.target.checked)} />Travel supported</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.accommodationSupported} onChange={(event) => update("accommodationSupported", event.target.checked)} />Accommodation supported</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.remoteAllowed} onChange={(event) => update("remoteAllowed", event.target.checked)} />Remote participation allowed</label></div>
    </section>

    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">Official links</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Application URL" required type="url" value={form.applicationUrl} onChange={(value) => update("applicationUrl", value)} />
        <Field label="Official guidelines URL" type="url" value={form.guidelinesUrl} onChange={(value) => update("guidelinesUrl", value)} />
        <Field label="Canonical source URL" type="url" value={form.sourceUrl} onChange={(value) => update("sourceUrl", value)} />
      </div>
      <button className={`${primary} mt-5`} disabled={saving} onClick={() => void submit()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Submit for review</button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />{success}</p>}
    </section>

    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">Submission history</h2>
      {loading ? <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading submissions…</p> : items.length ? <div className="mt-4 space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-[#E7E1F7] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.provider_name} · Submitted {new Date(item.submitted_at).toLocaleString()}</p></div><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold capitalize text-[#5B4B8A]">{item.moderation_status.replaceAll("_", " ")}</span></div>{item.review_notes && <p className="mt-3 text-sm text-muted-foreground">KLEIO review note: {item.review_notes}</p>}</article>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No provider submissions have been sent from this account.</p>}
    </section>
  </div></main>
}
