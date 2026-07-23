import Link from "next/link"
import { ArrowLeft, ArrowUpRight, BadgeCheck, FileText, Mail } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import type { KleioSyntheticArtistProfile } from "@/lib/kleio-profile-data"

function WorkCaption({
  work,
  index,
}: {
  work: KleioSyntheticArtistProfile["selectedWorks"][number]
  index: number
}) {
  return (
    <figcaption className="mt-3 flex items-start justify-between gap-4 border-t border-[#DDD7E7] pt-3 text-xs text-[#746F7C]">
      <div>
        <p className="font-medium text-[#242129]">{work.title}</p>
        <p className="mt-1">
          {work.year} · {work.medium}
        </p>
      </div>
      <span className="tabular-nums text-[#9B94A4]">{String(index + 1).padStart(2, "0")}</span>
    </figcaption>
  )
}

export function EditorialArtistProfileTest({ profile }: { profile: KleioSyntheticArtistProfile }) {
  const [primaryWork, ...secondaryWorks] = profile.selectedWorks
  const quickHistory = profile.history.slice(0, 3)

  return (
    <main className="h-full overflow-y-auto bg-[#FBFAFC] text-[#242129]">
      <div className="border-b border-[#DDD7E7] bg-white/95 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/artist-dashboard/profile/"
              className="inline-flex items-center gap-1.5 font-medium text-[#6A5896] hover:opacity-70"
            >
              <ArrowLeft className="size-3.5" />
              Current profile
            </Link>
            <span className="hidden h-3 w-px bg-[#DDD7E7] sm:block" />
            <span className="text-[#746F7C]">Compact editorial test · synthetic demo data</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/artist-dashboard/passport/" className="text-[#746F7C] hover:text-[#242129]">
              Edit passport
            </Link>
            <Link href="/artist-dashboard/portfolio/" className="text-[#746F7C] hover:text-[#242129]">
              Manage works
            </Link>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <header className="border-b border-[#DDD7E7] pb-5">
          <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#746F7C]">
            <span>KLEIO / Artist Profile</span>
            <nav className="flex gap-5">
              <a href="#works" className="hover:text-[#242129]">
                Works
              </a>
              <a href="#profile" className="hover:text-[#242129]">
                Profile
              </a>
              <a href="#contact" className="hover:text-[#242129]">
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="font-serif text-[clamp(3.4rem,8vw,7.4rem)] font-medium leading-[0.84] tracking-[-0.06em]">
                {profile.displayName}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-[#746F7C]">
                <span>{profile.role}</span>
                <span className="text-[#B0A9BA]">/</span>
                <span>{profile.location}</span>
                <span className="inline-flex items-center gap-1.5 text-[#6A5896]">
                  <BadgeCheck className="size-3.5" />
                  Creative Passport
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#746F7C] lg:text-right">
              A portfolio-first profile designed to keep the artwork prominent while giving reviewers the essential context immediately.
            </p>
          </div>
        </header>

        <section className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.62fr)] lg:gap-10">
          <div>
            <div className="relative">
              <div className="relative overflow-hidden bg-[#EEE9F4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetPath(profile.heroImage)}
                  alt={`${profile.displayName} featured practice image`}
                  className="aspect-[16/10] w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#201C25]/35 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 max-w-[70%] text-white sm:bottom-5 sm:left-5">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/75">Featured practice</p>
                  <p className="mt-1 font-serif text-2xl tracking-[-0.03em] sm:text-3xl">{profile.visualTheme.replaceAll("-", " ")}</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 z-10 w-24 overflow-hidden border-[5px] border-[#FBFAFC] bg-[#EEE9F4] shadow-[0_18px_50px_rgba(40,32,52,0.22)] sm:w-32 lg:-right-16 lg:bottom-8 lg:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetPath(profile.portrait)}
                  alt={`${profile.displayName} portrait`}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>

            <div id="works" className="scroll-mt-8 pt-10">
              <div className="mb-5 flex items-end justify-between gap-5 border-b border-[#DDD7E7] pb-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Selected works</p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] sm:text-4xl">A tighter editorial sequence.</h2>
                </div>
                <span className="hidden text-xs uppercase tracking-[0.14em] text-[#746F7C] sm:block">
                  {profile.selectedWorks.length} works
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-12">
                {primaryWork && (
                  <figure className="md:col-span-7">
                    <div className="overflow-hidden bg-[#EEE9F4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetPath(primaryWork.image)}
                        alt={primaryWork.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <WorkCaption work={primaryWork} index={0} />
                  </figure>
                )}

                <div className="grid gap-6 md:col-span-5">
                  {secondaryWorks.map((work, index) => (
                    <figure key={work.title}>
                      <div className="overflow-hidden bg-[#EEE9F4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetPath(work.image)}
                          alt={work.title}
                          className="aspect-[16/10] w-full object-cover"
                        />
                      </div>
                      <WorkCaption work={work} index={index + 1} />
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside id="profile" className="scroll-mt-8 lg:sticky lg:top-5 lg:self-start lg:pl-7">
            <div className="border-t border-[#DDD7E7] pt-5 lg:pt-8">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#6A5896]">Profile snapshot</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em]">About the artist</h2>
              <p className="mt-4 text-sm leading-7 text-[#4F4957]">{profile.shortBio}</p>

              <div className="mt-6 border-y border-[#DDD7E7] py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#746F7C]">Practice</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.practiceTags.slice(0, 5).map((tag) => (
                    <span key={tag} className="border border-[#DDD7E7] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.09em] text-[#746F7C]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#746F7C]">Selected record</p>
                <div className="mt-2 divide-y divide-[#DDD7E7] border-b border-[#DDD7E7]">
                  {quickHistory.map((entry) => (
                    <p key={entry} className="py-3 text-sm leading-6 text-[#4F4957]">
                      {entry}
                    </p>
                  ))}
                </div>
              </div>

              <details className="group mt-5 border-b border-[#DDD7E7] pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em]">
                  Artist statement
                  <span className="text-[#6A5896] group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#746F7C]">{profile.artistStatement}</p>
              </details>

              <details className="group border-b border-[#DDD7E7] py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em]">
                  Availability & materials
                  <span className="text-[#6A5896] group-open:rotate-45">+</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <dl className="space-y-2 text-sm">
                    {Object.entries(profile.availability).map(([label, status]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="capitalize text-[#746F7C]">{label}</dt>
                        <dd className="font-medium text-[#6A5896]">{status}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center gap-2 text-xs text-[#746F7C]">
                    <FileText className="size-3.5 text-[#6A5896]" />
                    Passport materials available for structured review
                  </div>
                </div>
              </details>

              <div className="mt-5 grid gap-3 text-sm">
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between border-b border-[#DDD7E7] pb-3 hover:text-[#6A5896]"
                >
                  {profile.website}
                  <ArrowUpRight className="size-4" />
                </a>
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center justify-between border-b border-[#DDD7E7] pb-3 hover:text-[#6A5896]"
                >
                  {profile.email}
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </aside>
        </section>

        <footer id="contact" className="mt-14 scroll-mt-8 border-t border-[#DDD7E7] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-[0.65rem] uppercase tracking-[0.14em] text-[#746F7C]">
            <span>Creative Passport maintained through KLEIO</span>
            <a href="#top" className="hover:text-[#242129]">
              Back to top
            </a>
          </div>
        </footer>
      </article>
    </main>
  )
}
