import Link from "next/link"
import { ArrowLeft, ArrowUpRight, BadgeCheck, Mail } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import type { KleioSyntheticArtistProfile } from "@/lib/kleio-profile-data"

const ink = "#242129"
const muted = "#746F7C"
const line = "#DDD7E7"
const lavender = "#6A5896"

function WorkCaption({ work, index }: { work: KleioSyntheticArtistProfile["selectedWorks"][number]; index: number }) {
  return (
    <div className="mt-3 flex items-start justify-between gap-6 border-t border-[#DDD7E7] pt-3 text-xs text-[#746F7C]">
      <div>
        <p className="font-medium text-[#242129]">{work.title}</p>
        <p className="mt-1">{work.year} · {work.medium}</p>
      </div>
      <p className="shrink-0 tabular-nums">{String(index + 1).padStart(2, "0")}</p>
    </div>
  )
}

export function EditorialArtistProfileTest({ profile }: { profile: KleioSyntheticArtistProfile }) {
  const featuredWork = profile.selectedWorks[0]
  const remainingWorks = profile.selectedWorks.slice(1)

  return (
    <main className="h-full overflow-y-auto bg-[#FBFAFC] text-[#242129]">
      <div className="border-b border-[#DDD7E7] bg-white/95 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link href="/artist-dashboard/profile/" className="inline-flex items-center gap-1.5 font-medium text-[#6A5896] hover:opacity-70">
              <ArrowLeft className="size-3.5" />
              Current profile
            </Link>
            <span className="hidden h-3 w-px bg-[#DDD7E7] sm:block" />
            <span className="text-[#746F7C]">Editorial profile test · synthetic demo data</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/artist-dashboard/passport/" className="text-[#746F7C] hover:text-[#242129]">Edit passport</Link>
            <Link href="/artist-dashboard/portfolio/" className="text-[#746F7C] hover:text-[#242129]">Manage works</Link>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-[1440px] px-4 pb-20 pt-7 sm:px-6 sm:pt-9 lg:px-10">
        <header id="top" className="border-b border-[#DDD7E7] pb-5">
          <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#746F7C]">
            <span>KLEIO / Artist Profile</span>
            <div className="flex items-center gap-5">
              <a href="#contact" className="hover:text-[#242129]">Contact</a>
              <a href="#about" className="hover:text-[#242129]">About</a>
            </div>
          </div>

          <h1 className="mt-8 max-w-[1320px] font-serif text-[clamp(3.7rem,10vw,9rem)] font-medium leading-[0.82] tracking-[-0.065em] text-[#242129]">
            {profile.displayName}
          </h1>

          <div className="mt-8 grid gap-5 border-t border-[#DDD7E7] pt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-[#746F7C]">
              <span>{profile.role}</span>
              <span className="text-[#B0A9BA]">/</span>
              <span>{profile.location}</span>
              <span className="inline-flex items-center gap-1.5 text-[#6A5896]">
                <BadgeCheck className="size-3.5" />
                Creative Passport
              </span>
            </div>
            <nav className="flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-[0.12em]">
              <a href="#works" className="hover:text-[#6A5896]">Works</a>
              <a href="#about" className="hover:text-[#6A5896]">About</a>
              <a href="#record" className="hover:text-[#6A5896]">Record</a>
              <a href="#contact" className="hover:text-[#6A5896]">Contact</a>
            </nav>
          </div>
        </header>

        <section className="pt-5">
          <div className="overflow-hidden bg-[#F1EDF7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(profile.heroImage)}
              alt={`${profile.displayName} featured practice image`}
              className="h-[58vh] min-h-[430px] w-full object-cover object-center sm:h-[68vh]"
            />
          </div>
          <div className="grid gap-2 border-b border-[#DDD7E7] py-3 text-xs text-[#746F7C] sm:grid-cols-[1fr_auto]">
            <p className="font-medium text-[#242129]">Featured practice image</p>
            <p>{profile.visualTheme.replaceAll("-", " ")} · Artist-selected presentation</p>
          </div>
        </section>

        <section id="works" className="scroll-mt-8 py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(220px,0.34fr)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Selected works</p>
              <h2 className="mt-4 max-w-sm font-serif text-4xl leading-[0.95] tracking-[-0.04em] sm:text-5xl">A clear view of the work, without the dashboard noise.</h2>
              <ol className="mt-9 border-t border-[#DDD7E7] text-sm">
                {profile.selectedWorks.map((work, index) => (
                  <li key={work.title} className="grid grid-cols-[2.5rem_1fr_auto] gap-3 border-b border-[#DDD7E7] py-3">
                    <span className="text-[#A098AA]">{String(index + 1).padStart(2, "0")}</span>
                    <span>{work.title}</span>
                    <span className="text-xs text-[#746F7C]">{work.year}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-16 sm:space-y-24">
              {featuredWork && (
                <figure>
                  <div className="overflow-hidden bg-[#F1EDF7]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetPath(featuredWork.image)} alt={featuredWork.title} className="aspect-[4/3] w-full object-cover" />
                  </div>
                  <WorkCaption work={featuredWork} index={0} />
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#746F7C]">{featuredWork.details}</p>
                </figure>
              )}

              {remainingWorks.length > 0 && (
                <div className="grid gap-10 md:grid-cols-2 md:items-start">
                  {remainingWorks.map((work, index) => (
                    <figure key={work.title} className={index % 2 === 1 ? "md:mt-24" : ""}>
                      <div className="overflow-hidden bg-[#F1EDF7]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetPath(work.image)} alt={work.title} className="aspect-[4/5] w-full object-cover" />
                      </div>
                      <WorkCaption work={work} index={index + 1} />
                      <p className="mt-4 text-sm leading-7 text-[#746F7C]">{work.details}</p>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-8 border-t border-[#DDD7E7] py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr]">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">About the practice</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.practiceTags.map((tag) => (
                  <span key={tag} className="border border-[#DDD7E7] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.1em] text-[#746F7C]">{tag}</span>
                ))}
              </div>
            </div>
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="font-serif text-3xl tracking-[-0.035em]">Biography</h2>
                <p className="mt-5 text-sm leading-7 text-[#4F4957]">{profile.shortBio}</p>
              </div>
              <div>
                <h2 className="font-serif text-3xl tracking-[-0.035em]">Artist statement</h2>
                <p className="mt-5 text-sm leading-7 text-[#746F7C]">{profile.artistStatement}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="record" className="scroll-mt-8 border-t border-[#DDD7E7] py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr]">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Professional record</p>
              <h2 className="mt-4 max-w-xs font-serif text-4xl leading-none tracking-[-0.04em]">Structured enough for institutional review.</h2>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <h3 className="border-b border-[#DDD7E7] pb-3 text-xs font-semibold uppercase tracking-[0.16em]">Exhibitions & residencies</h3>
                <div className="divide-y divide-[#DDD7E7]">
                  {profile.history.map((entry, index) => (
                    <div key={entry} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4 text-sm leading-6">
                      <span className="text-xs text-[#A098AA]">{String(index + 1).padStart(2, "0")}</span>
                      <span>{entry}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="border-b border-[#DDD7E7] pb-3 text-xs font-semibold uppercase tracking-[0.16em]">Availability</h3>
                <dl className="divide-y divide-[#DDD7E7]">
                  {Object.entries(profile.availability).map(([label, status]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-4 text-sm">
                      <dt className="capitalize">{label}</dt>
                      <dd className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6A5896]">{status}</dd>
                    </div>
                  ))}
                </dl>

                <h3 className="mt-10 border-b border-[#DDD7E7] pb-3 text-xs font-semibold uppercase tracking-[0.16em]">Passport materials</h3>
                <dl className="divide-y divide-[#DDD7E7]">
                  {Object.entries(profile.materialsReady).map(([label, ready]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-4 text-sm">
                      <dt className="capitalize">{label.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className={ready ? "text-xs font-semibold uppercase tracking-[0.1em] text-[#6A5896]" : "text-xs uppercase tracking-[0.1em] text-[#9A6C55]"}>{ready ? "Ready" : "Review"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <footer id="contact" className="scroll-mt-8 border-t border-[#DDD7E7] pb-8 pt-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Contact</p>
              <h2 className="mt-4 max-w-4xl font-serif text-[clamp(3rem,8vw,7rem)] leading-[0.88] tracking-[-0.06em]">Connect with {profile.displayName.split(" ")[0]}.</h2>
            </div>
            <div className="min-w-[260px] border-t border-[#DDD7E7] text-sm">
              <a href={`https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 border-b border-[#DDD7E7] py-4 hover:text-[#6A5896]">
                {profile.website}
                <ArrowUpRight className="size-4" />
              </a>
              <a href={`mailto:${profile.email}`} className="flex items-center justify-between gap-4 border-b border-[#DDD7E7] py-4 hover:text-[#6A5896]">
                {profile.email}
                <Mail className="size-4" />
              </a>
              <div className="flex items-center justify-between gap-4 border-b border-[#DDD7E7] py-4 text-[#746F7C]">
                <span>{profile.instagram}</span>
                <span>{profile.location}</span>
              </div>
            </div>
          </div>

          <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDD7E7] pt-4 text-[0.65rem] uppercase tracking-[0.14em] text-[#746F7C]">
            <span>Creative Passport maintained through KLEIO</span>
            <a href="#top" className="hover:text-[#242129]">Back to top</a>
          </div>
        </footer>
      </article>
    </main>
  )
}
