"use client"

/* eslint-disable @next/next/no-img-element -- discovery media uses short-lived signed Supabase URLs */

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ImageIcon, Loader2, MailPlus, MapPin, Search, ShieldCheck, X } from "lucide-react"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  inviteArtistToOpportunity,
  loadActiveInstitutionListings,
  loadDiscoverableArtists,
  type ActiveInstitutionListing,
  type ArtistDiscoveryRecord,
} from "@/lib/kleio-artist-discovery"

const line = "#E7E1F7"
const card = "overflow-hidden border border-[#E7E1F7] bg-white shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] disabled:opacity-50"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"

function matches(record: ArtistDiscoveryRecord, query: string, discipline: string, location: string) {
  const text = [record.professional_name, record.location, record.bio, record.practice_description, record.career_stage, ...record.disciplines, ...record.mediums, ...record.languages, ...record.themes, ...record.availability, ...record.selected_works.flatMap((work) => [work.title, work.medium, work.series, ...work.tags])].filter(Boolean).join(" ").toLowerCase()
  return (!query || text.includes(query.toLowerCase()))
    && (!discipline || record.disciplines.includes(discipline))
    && (!location || record.location === location)
}

function ArtistCard({ artist, onOpen, onInvite }: { artist: ArtistDiscoveryRecord; onOpen: () => void; onInvite: () => void }) {
  const feature = artist.selected_works.find((work) => work.image_url) || artist.selected_works[0]
  return (
    <article className={`${card} group flex min-h-[460px] flex-col`}>
      <button type="button" onClick={onOpen} className="relative block min-h-[245px] overflow-hidden bg-[#F3EFF8] text-left">
        {feature?.image_url ? <img src={feature.image_url} alt={feature.title} className="h-[270px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" /> : <div className="grid h-[270px] place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(169,151,232,0.3),transparent_35%),#F8F5FD]"><ImageIcon className="size-8 text-[#7867AA]" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
        {artist.profile_image_url ? <img src={artist.profile_image_url} alt={`${artist.professional_name} portrait`} className="absolute bottom-4 right-4 aspect-[4/5] w-20 border-4 border-white object-cover shadow-xl" /> : <InitialAvatar name={artist.professional_name} className="absolute bottom-4 right-4 size-16 border-4 border-white text-base shadow-xl" />}
        <div className="absolute bottom-4 left-4 max-w-[65%] text-white"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/75">Selected work</p><p className="mt-1 truncate font-serif text-xl">{feature?.title || "Portfolio forthcoming"}</p></div>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-serif text-2xl tracking-[-0.03em] text-[#292631]">{artist.professional_name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-[#7F7890]"><MapPin className="size-3.5" />{artist.location || "Location not shared"}</p></div><ShieldCheck className="mt-1 size-4 shrink-0 text-[#6A5896]" aria-label="Artist opted into institution discovery" /></div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#625C70]">{artist.practice_description || artist.bio || "Practice description not yet added."}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{[...artist.disciplines, ...artist.mediums].slice(0, 5).map((tag) => <span key={tag} className="border border-[#E2DCEE] bg-[#FDFBFF] px-2 py-1 text-[0.64rem] font-medium uppercase tracking-[0.07em] text-[#625676]">{tag}</span>)}</div>
        {artist.availability.length > 0 && <p className="mt-4 text-xs text-[#7F7890]">Available for {artist.availability.slice(0, 3).join(", ")}</p>}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5"><button type="button" onClick={onOpen} className={secondary}>View profile <ArrowRight className="size-4" /></button><button type="button" onClick={onInvite} disabled={artist.contact_mode !== "opportunity_invites"} className={primary}><MailPlus className="size-4" />Invite</button></div>
      </div>
    </article>
  )
}

function ProfileOverlay({ artist, onClose, onInvite }: { artist: ArtistDiscoveryRecord; onClose: () => void; onInvite: () => void }) {
  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#201B2B]/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`${artist.professional_name} discovery profile`}>
    <div className="mx-auto max-w-[1180px] bg-[#FCFBFD] shadow-2xl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E7E1F7] bg-white/95 px-4 py-3 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Institution discovery profile</p><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-[#E7E1F7]" aria-label="Close profile"><X className="size-4" /></button></div>
      <div className="grid gap-8 p-4 sm:p-7 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <div><div className="relative overflow-hidden bg-[#F3EFF8]">{artist.selected_works[0]?.image_url ? <img src={artist.selected_works[0].image_url || ""} alt={artist.selected_works[0].title} className="max-h-[620px] w-full object-contain" /> : <div className="grid min-h-[420px] place-items-center"><ImageIcon className="size-10 text-[#7867AA]" /></div>}{artist.profile_image_url && <img src={artist.profile_image_url} alt={`${artist.professional_name} portrait`} className="absolute bottom-5 right-5 aspect-[4/5] w-28 border-[5px] border-white object-cover shadow-2xl sm:w-36" />}</div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">{artist.selected_works.slice(1).map((work) => <figure key={work.id}><div className="grid min-h-52 place-items-center overflow-hidden bg-[#F3EFF8]">{work.image_url ? <img src={work.image_url} alt={work.title} className="max-h-[420px] w-full object-contain" /> : <ImageIcon className="size-6 text-[#7867AA]" />}</div><figcaption className="mt-2 border-t border-[#DDD7E7] pt-2 text-xs text-[#746F7C]"><strong className="text-[#292631]">{work.title}</strong>{[work.year, work.medium].filter(Boolean).length > 0 && <span> · {[work.year, work.medium].filter(Boolean).join(" · ")}</span>}</figcaption></figure>)}</div>
        </div>
        <aside className="kleio-context-panel lg:self-start"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#6A5896]">Artist-approved presentation</p><h1 className="mt-3 font-serif text-4xl tracking-[-0.05em] text-[#292631]">{artist.professional_name}</h1><p className="mt-2 text-sm text-[#746F7C]">{[artist.disciplines.join(" · "), artist.location].filter(Boolean).join(" / ")}</p><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-[#4F4957]">{artist.bio || "Biography not yet added."}</p>{artist.artist_statement && <details className="mt-5 border-y border-[#DDD7E7] py-4"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-[#4E426F]">Artist statement</summary><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#625C70]">{artist.artist_statement}</p></details>}<div className="mt-5 flex flex-wrap gap-2">{[...artist.themes, ...artist.mediums].slice(0, 8).map((tag) => <span key={tag} className="border border-[#D8D0F2] px-2 py-1 text-[0.65rem] uppercase tracking-[0.08em] text-[#625676]">{tag}</span>)}</div><div className="mt-6 rounded-2xl border border-[#E7E1F7] bg-[#F8F5FD] p-4 text-xs leading-5 text-[#625C70]"><strong className="text-[#292631]">Consent boundary:</strong> this view contains only the artist&rsquo;s opt-in discovery publication. Application drafts, CV files, private email, reviewer notes, and unrelated submission history are not included.</div><button type="button" onClick={onInvite} disabled={artist.contact_mode !== "opportunity_invites"} className={`${primary} mt-5 w-full`}><MailPlus className="size-4" />Invite through an active listing</button></aside>
      </div>
    </div>
  </div>
}

function InviteOverlay({ artist, listings, onClose, onSent }: { artist: ArtistDiscoveryRecord; listings: ActiveInstitutionListing[]; onClose: () => void; onSent: (message: string) => void }) {
  const [listingId, setListingId] = useState(listings[0]?.id || "")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function send() { setBusy(true); setError(""); try { await inviteArtistToOpportunity({ artistUserId: artist.artist_user_id, opportunityId: listingId, message }); onSent(`Invitation sent to ${artist.professional_name}.`) } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send the invitation.") } finally { setBusy(false) } }
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#201B2B]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite artist"><div className="w-full max-w-xl rounded-3xl border border-[#E7E1F7] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Opportunity-linked outreach</p><h2 className="mt-2 font-serif text-2xl">Invite {artist.professional_name}</h2></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-[#E7E1F7]"><X className="size-4" /></button></div>{listings.length === 0 ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Your institution needs an active, published, unexpired KLEIO listing before it can contact a discoverable artist. General unsolicited messaging is not enabled.</div> : <><label className="mt-5 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Active listing</span><select value={listingId} onChange={(event) => setListingId(event.target.value)} className="h-11 rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm">{listings.map((listing) => <option key={listing.id} value={listing.id}>{listing.title}{listing.deadline_at ? ` · ${new Date(listing.deadline_at).toLocaleDateString()}` : ""}</option>)}</select></label><label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Invitation message</span><textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain why this artist may be relevant to the listing. The artist remains free to review, decline, reply, or apply." className="rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm leading-6" /></label><p className="mt-3 text-xs leading-5 text-[#7F7890]">This creates one conversation tied to the selected listing. It does not create an application or imply the artist has accepted.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || !listingId || message.trim().length < 10} onClick={() => void send()} className={`${primary} mt-5 w-full`}>{busy && <Loader2 className="size-4 animate-spin" />}Send opportunity invitation</button></>}</div></div>
}

export function LiveArtistDiscovery() {
  const [artists, setArtists] = useState<ArtistDiscoveryRecord[]>([])
  const [listings, setListings] = useState<ActiveInstitutionListing[]>([])
  const [query, setQuery] = useState("")
  const [discipline, setDiscipline] = useState("")
  const [location, setLocation] = useState("")
  const [activeArtist, setActiveArtist] = useState<ArtistDiscoveryRecord | null>(null)
  const [inviteArtist, setInviteArtist] = useState<ArtistDiscoveryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => { let active = true; void Promise.all([loadDiscoverableArtists(), loadActiveInstitutionListings()]).then(([artistRows, listingRows]) => { if (active) { setArtists(artistRows); setListings(listingRows) } }).catch((reason: Error) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const disciplines = useMemo(() => Array.from(new Set(artists.flatMap((artist) => artist.disciplines))).sort(), [artists])
  const locations = useMemo(() => Array.from(new Set(artists.map((artist) => artist.location).filter(Boolean))).sort(), [artists])
  const filtered = useMemo(() => artists.filter((artist) => matches(artist, query.trim(), discipline, location)), [artists, query, discipline, location])
  return <main className="h-full overflow-y-auto bg-[#FCFBFD] px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1320px] space-y-5"><WorkspacePageHeader eyebrow="Institution workspace" title="Artist Discovery" description="Browse artwork-led profiles that artists have explicitly chosen to share with authenticated institutions. Discovery is not an applicant ranking or a public social directory." secondaryCta={{ label: "Applicant records", href: "/artists/applicants/" }} />{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<section className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_14px_40px_rgba(82,64,130,0.05)]"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7F7890]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search practice, medium, location, language, or work…" className="h-11 w-full rounded-xl border border-[#E7E1F7] pl-10 pr-3 text-sm outline-none focus:border-[#A997E8]" /></label><select value={discipline} onChange={(event) => setDiscipline(event.target.value)} className="h-11 rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm"><option value="">All disciplines</option>{disciplines.map((value) => <option key={value}>{value}</option>)}</select><select value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm"><option value="">All locations</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#7F7890]"><span>{filtered.length} opted-in {filtered.length === 1 ? "artist" : "artists"}</span><span>{listings.length > 0 ? `${listings.length} active ${listings.length === 1 ? "listing" : "listings"} available for invitations` : "No active listing: browsing remains available, outreach is locked"}</span></div></section>{loading ? <div className="flex items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-6 text-sm text-[#7F7890]"><Loader2 className="size-4 animate-spin" />Loading artist discovery…</div> : filtered.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((artist) => <ArtistCard key={artist.artist_user_id} artist={artist} onOpen={() => setActiveArtist(artist)} onInvite={() => setInviteArtist(artist)} />)}</div> : <section className="rounded-2xl border border-[#E7E1F7] bg-white p-10 text-center"><ShieldCheck className="mx-auto size-7 text-[#6A5896]" /><h2 className="mt-3 font-serif text-2xl">No discoverable artists match this view</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7F7890]">Connected mode does not substitute synthetic profiles. Artists appear here only after explicitly enabling institution discovery.</p></section>}{activeArtist && <ProfileOverlay artist={activeArtist} onClose={() => setActiveArtist(null)} onInvite={() => { setActiveArtist(null); setInviteArtist(activeArtist) }} />}{inviteArtist && <InviteOverlay artist={inviteArtist} listings={listings} onClose={() => setInviteArtist(null)} onSent={(status) => { setInviteArtist(null); setMessage(status) }} />}</div></main>
}
