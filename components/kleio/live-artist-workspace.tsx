"use client"

/* eslint-disable @next/next/no-img-element -- private signed Supabase URLs are short-lived and cannot use the static image optimizer */

import { useEffect, useMemo, useState } from "react"
import { Bookmark, CheckCircle2, FileUp, Loader2, Send, Trash2 } from "lucide-react"
import {
  applicationCall,
  createPortfolioWork,
  deletePortfolioWork,
  getOrCreateApplicationDraft,
  loadApplicationMessages,
  loadArtistApplications,
  loadArtistPassport,
  loadPortfolioWorks,
  loadPublishedOpenCalls,
  loadSavedOpportunityIds,
  loadNotifications,
  markNotificationRead,
  markApplicationMessagesRead,
  saveApplicationDraft,
  saveArtistPassport,
  sendApplicationMessage,
  setOpportunitySaved,
  submitApplication,
  uploadArtistAsset,
  type ApplicationMessageRecord,
  type ApplicationRecord,
  type ArtistPassportRecord,
  type OpenCallRecord,
  type NotificationRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"

function LiveShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="h-full overflow-y-auto px-6 py-6"><div className="mx-auto max-w-[1180px] space-y-5"><WorkspacePageHeader eyebrow="Authenticated workspace" title={title} description={description} />{children}</div></main>
}

function StateNotice({ loading, error, empty }: { loading: boolean; error: string; empty?: string }) {
  if (loading) return <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading your saved records…</div>
  if (error) return <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>
  if (empty) return <div className={`${card} text-sm text-muted-foreground`}>{empty}</div>
  return null
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>{label}</span>{multiline ? <textarea className={textarea} rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={input} value={value} onChange={(event) => onChange(event.target.value)} />}</label>
}

const blankPassport: ArtistPassportRecord = { user_id: "", professional_name: "", location: "", bio: "", artist_statement: "", practice_description: "", website_url: "", instagram_url: "", disciplines: [], mediums: [], languages: [], education: "", exhibition_history: "", awards: "", cv_file_path: null, profile_completion: 0 }

export function LiveArtistPassport() {
  const [record, setRecord] = useState(blankPassport)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [cvName, setCvName] = useState("")

  useEffect(() => { void loadArtistPassport().then((data) => { if (data) setRecord(data) }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])
  const update = (key: keyof ArtistPassportRecord, value: string | string[] | null) => setRecord((current) => ({ ...current, [key]: value }))

  async function save() {
    setSaving(true); setError(""); setSaved("")
    try {
      const next = await saveArtistPassport({ ...record, disciplines_text: record.disciplines.join(", "), mediums_text: record.mediums.join(", "), languages_text: record.languages.join(", ") })
      setRecord(next); setSaved("Creative Passport saved to your account.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the passport.") } finally { setSaving(false) }
  }

  async function uploadCv(file: File | null) {
    if (!file) return
    setSaving(true); setError("")
    try { const path = await uploadArtistAsset(file, "cv"); update("cv_file_path", path); setCvName(file.name); setSaved("CV uploaded. Save the Passport to attach it.") }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to upload the CV.") } finally { setSaving(false) }
  }

  return <LiveShell title="Creative Passport" description="Edit the reusable artist record stored with your authenticated account.">
    <StateNotice loading={loading} error={error} />
    {!loading && <section className={card}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Passport completeness</p><p className="text-xs text-muted-foreground">{record.profile_completion}% saved profile completion</p></div><button className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void save()}>{saving && <Loader2 className="size-4 animate-spin" />}Save Passport</button></div>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Professional name" value={record.professional_name} onChange={(v) => update("professional_name", v)} /><Field label="Location" value={record.location} onChange={(v) => update("location", v)} /><Field label="Website" value={record.website_url} onChange={(v) => update("website_url", v)} /><Field label="Instagram" value={record.instagram_url} onChange={(v) => update("instagram_url", v)} /><Field label="Disciplines — comma separated" value={record.disciplines.join(", ")} onChange={(v) => update("disciplines", v.split(",").map((x) => x.trim()).filter(Boolean))} /><Field label="Mediums — comma separated" value={record.mediums.join(", ")} onChange={(v) => update("mediums", v.split(",").map((x) => x.trim()).filter(Boolean))} /><Field label="Languages — comma separated" value={record.languages.join(", ")} onChange={(v) => update("languages", v.split(",").map((x) => x.trim()).filter(Boolean))} /><Field label="Education" value={record.education} onChange={(v) => update("education", v)} /></div>
      <div className="mt-4 grid gap-4"><Field multiline label="Short biography" value={record.bio} onChange={(v) => update("bio", v)} /><Field multiline label="Artist statement" value={record.artist_statement} onChange={(v) => update("artist_statement", v)} /><Field multiline label="Practice description" value={record.practice_description} onChange={(v) => update("practice_description", v)} /><Field multiline label="Exhibition history" value={record.exhibition_history} onChange={(v) => update("exhibition_history", v)} /><Field multiline label="Awards" value={record.awards} onChange={(v) => update("awards", v)} /></div>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#D8D0F2] p-4 text-sm text-[#5B4B8A]"><FileUp className="size-4" /><span>{cvName || (record.cv_file_path ? "Replace saved CV" : "Upload CV as PDF")}</span><input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} /></label>
      {saved && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{saved}</p>}
    </section>}
  </LiveShell>
}

const blankWork = { title: "", year: "", medium: "", dimensions: "", description: "", series: "", tags: "", file: null as File | null }

export function LiveArtistPortfolio() {
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [form, setForm] = useState(blankWork)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const refresh = () => loadPortfolioWorks().then(setWorks)
  useEffect(() => { void refresh().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])

  async function add() { setSaving(true); setError(""); try { await createPortfolioWork(form); setForm(blankWork); await refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add the work.") } finally { setSaving(false) } }
  async function remove(work: PortfolioWorkRecord) { setError(""); try { await deletePortfolioWork(work); setWorks((current) => current.filter((item) => item.id !== work.id)) } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove the work.") } }

  return <LiveShell title="Portfolio" description="Upload and manage works stored privately in your artist account.">
    <StateNotice loading={loading} error={error} />
    {!loading && <><section className={card}><h2 className="font-serif text-xl font-semibold">Add portfolio work</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} /><Field label="Year" value={form.year} onChange={(v) => setForm((f) => ({ ...f, year: v }))} /><Field label="Medium" value={form.medium} onChange={(v) => setForm((f) => ({ ...f, medium: v }))} /><Field label="Dimensions" value={form.dimensions} onChange={(v) => setForm((f) => ({ ...f, dimensions: v }))} /><Field label="Series" value={form.series} onChange={(v) => setForm((f) => ({ ...f, series: v }))} /><Field label="Tags — comma separated" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} /></div><div className="mt-4"><Field multiline label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} /></div><input className="mt-4 block text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm((f) => ({ ...f, file: event.target.files?.[0] ?? null }))} /><button className={`${primary} mt-4`} disabled={saving || !form.title.trim()} onClick={() => void add()}>{saving && <Loader2 className="size-4 animate-spin" />}Add work</button></section>
      {works.length === 0 ? <StateNotice loading={false} error="" empty="No portfolio works yet. Add the first work above." /> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{works.map((work) => <article className={`${card} overflow-hidden p-0`} key={work.id}>{work.image_url ? <img src={work.image_url} alt={work.title} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[#F7F4FF] text-sm text-muted-foreground">No image uploaded</div>}<div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{work.title}</h3><p className="text-xs text-muted-foreground">{[work.year, work.medium].filter(Boolean).join(" · ")}</p></div><button aria-label={`Delete ${work.title}`} onClick={() => void remove(work)} className="text-muted-foreground hover:text-red-600"><Trash2 className="size-4" /></button></div><p className="mt-2 text-sm text-muted-foreground">{work.description || "No description yet."}</p></div></article>)}</section>}</>}
  </LiveShell>
}

function ApplicationEditor({ call, onComplete }: { call: OpenCallRecord; onComplete: () => void }) {
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [answer, setAnswer] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  useEffect(() => { void Promise.all([getOrCreateApplicationDraft(call), loadPortfolioWorks()]).then(([app, portfolio]) => { setApplication(app); setWorks(portfolio) }).catch((reason: Error) => setError(reason.message)) }, [call])
  async function persist(submit: boolean) { if (!application) return; setSaving(true); setError(""); try { await saveApplicationDraft(application.id, answer, selected); if (submit) await submitApplication(application.id); setMessage(submit ? "Application submitted and status history recorded." : "Draft saved to your account."); if (submit) onComplete() } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the application.") } finally { setSaving(false) } }
  if (error) return <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
  if (!application) return <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing your draft…</p>
  if (application.status !== "draft") return <p className="mt-4 text-sm font-medium text-emerald-700">This application is already {application.status.replaceAll("_", " ")}.</p>
  return <div className="mt-4 border-t border-[#E7E1F7] pt-4"><Field multiline label="Project proposal / application note" value={answer} onChange={setAnswer} /><p className="mt-4 text-xs font-semibold text-muted-foreground">Select portfolio works</p><div className="mt-2 flex flex-wrap gap-2">{works.map((work) => <label key={work.id} className="flex items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(work.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, work.id] : current.filter((id) => id !== work.id))} />{work.title}</label>)}</div><div className="mt-4 flex flex-wrap gap-2"><button className={secondary} disabled={saving} onClick={() => void persist(false)}>Save draft</button><button className={primary} disabled={saving || !answer.trim()} onClick={() => void persist(true)}>{saving && <Loader2 className="size-4 animate-spin" />}Submit application</button></div>{message && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}</div>
}

export function LiveArtistOpportunities() {
  const [calls, setCalls] = useState<OpenCallRecord[]>([]); const [saved, setSaved] = useState<string[]>([]); const [active, setActive] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("")
  const refresh = () => Promise.all([loadPublishedOpenCalls(), loadSavedOpportunityIds()]).then(([nextCalls, ids]) => { setCalls(nextCalls); setSaved(ids) })
  useEffect(() => { void refresh().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])
  async function toggle(callId: string) { const next = !saved.includes(callId); try { await setOpportunitySaved(callId, next); setSaved((current) => next ? [...current, callId] : current.filter((id) => id !== callId)) } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update saved opportunities.") } }
  return <LiveShell title="Opportunities" description="Published institutional calls retrieved from Supabase, with account-level saves and application drafts."><StateNotice loading={loading} error={error} empty={!loading && !calls.length ? "No institutions have published an open call yet." : undefined} />{calls.map((call) => <article key={call.id} className={card}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#A997E8]">{call.opportunity_type} · {call.institution_name}</p><h2 className="mt-1 font-serif text-xl font-semibold">{call.title}</h2><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{call.summary || call.description || "No description provided."}</p><p className="mt-2 text-xs text-muted-foreground">Deadline: {call.deadline_at || "Not specified"} · {call.location || call.participation_format}</p></div><div className="flex gap-2"><button className={secondary} onClick={() => void toggle(call.id)}><Bookmark className={`size-4 ${saved.includes(call.id) ? "fill-current" : ""}`} />{saved.includes(call.id) ? "Saved" : "Save"}</button><button className={primary} onClick={() => setActive((current) => current === call.id ? null : call.id)}>{active === call.id ? "Close" : "Apply"}</button></div></div>{active === call.id && <ApplicationEditor call={call} onComplete={() => { setActive(null); void refresh() }} />}</article>)}</LiveShell>
}

export function LiveArtistApplications() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]); const [notifications, setNotifications] = useState<NotificationRecord[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("")
  const refreshNotifications = () => loadNotifications().then(setNotifications)
  useEffect(() => { void Promise.all([loadArtistApplications().then(setApplications), refreshNotifications()]).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])
  async function readNotification(id: string) { try { await markNotificationRead(id); await refreshNotifications() } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update notification.") } }
  return <LiveShell title="Applications" description="Drafts, submitted applications, and institution status history saved to your account."><StateNotice loading={loading} error={error} empty={!loading && !applications.length ? "No applications yet. Start one from Opportunities." : undefined} />{notifications.length > 0 && <section className={card}><h2 className="font-serif text-xl font-semibold">Notifications</h2><div className="mt-3 space-y-2">{notifications.map((item) => <button key={item.id} onClick={() => void readNotification(item.id)} className={`block w-full rounded-xl border border-[#E7E1F7] p-3 text-left ${item.read_at ? "opacity-60" : "bg-[#F7F4FF]"}`}><span className="text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.body} · {new Date(item.created_at).toLocaleString()}</span></button>)}</div></section>}{applications.map((application) => { const call = applicationCall(application); return <article className={card} key={application.id}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-serif text-xl font-semibold">{call?.title || "Application"}</h2><p className="text-sm text-muted-foreground">{call?.institution_name || "Institution"} · Updated {new Date(application.updated_at).toLocaleString()}</p></div><span className="h-fit rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold capitalize text-[#5B4B8A]">{application.status.replaceAll("_", " ")}</span></div><div className="mt-4 border-t border-[#E7E1F7] pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status history</p><ul className="mt-2 space-y-2">{(application.application_status_history || []).length ? application.application_status_history?.sort((a,b) => a.created_at.localeCompare(b.created_at)).map((entry) => <li key={entry.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-600" />{entry.new_status.replaceAll("_", " ")} · {new Date(entry.created_at).toLocaleString()}</li>) : <li className="text-sm text-muted-foreground">Draft created {new Date(application.created_at).toLocaleString()}</li>}</ul></div></article> })}</LiveShell>
}

export function LiveArtistMessages() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]); const [activeId, setActiveId] = useState(""); const [messages, setMessages] = useState<ApplicationMessageRecord[]>([]); const [draft, setDraft] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("")
  const active = useMemo(() => applications.find((app) => app.id === activeId) ?? applications[0], [applications, activeId])
  useEffect(() => { void loadArtistApplications().then((items) => { const submitted = items.filter((item) => item.status !== "draft"); setApplications(submitted); setActiveId(submitted[0]?.id || "") }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])
  useEffect(() => { if (!active) return; void Promise.all([loadApplicationMessages(active.id), markApplicationMessagesRead(active.id)]).then(([items]) => setMessages(items)).catch((reason: Error) => setError(reason.message)) }, [active])
  async function send() { if (!active || !draft.trim()) return; try { const row = await sendApplicationMessage(active, draft); setMessages((current) => [...current, row]); setDraft("") } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send the message.") } }
  return <LiveShell title="Application messages" description="Persistent communication attached to submitted applications."><StateNotice loading={loading} error={error} empty={!loading && !applications.length ? "Messages become available after an application is submitted." : undefined} />{active && <div className="grid gap-4 lg:grid-cols-[320px_1fr]"><aside className={card}>{applications.map((application) => <button key={application.id} onClick={() => setActiveId(application.id)} className={`mb-2 w-full rounded-xl p-3 text-left text-sm ${active.id === application.id ? "bg-[#F7F4FF] text-[#5B4B8A]" : "hover:bg-muted"}`}><span className="block font-semibold">{applicationCall(application)?.title || "Application"}</span><span className="text-xs text-muted-foreground">{application.status.replaceAll("_", " ")}</span></button>)}</aside><section className={card}><div className="min-h-64 space-y-3">{messages.length ? messages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${message.sender_role === "artist" ? "ml-auto bg-primary text-primary-foreground" : "bg-[#F7F4FF] text-foreground"}`}><p>{message.body}</p><p className="mt-1 text-[0.65rem] opacity-70">{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">No messages in this application yet.</p>}</div><div className="mt-4 flex gap-2 border-t border-[#E7E1F7] pt-4"><textarea className={`${textarea} flex-1`} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message to the institution…" /><button className={primary} disabled={!draft.trim()} onClick={() => void send()}><Send className="size-4" />Send</button></div></section></div>}</LiveShell>
}
