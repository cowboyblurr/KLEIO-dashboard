"use client"

import { useEffect, useState } from "react"
import { ArtistImportStudioPage } from "@/components/kleio/artist-import-studio-page"

type GalleryView = "large" | "standard" | "compact"

const GALLERY_VIEW_PREFERENCE_KEY = "kleio.instagram.gallery-density.v1"
const buttonBase = "min-h-11 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function isGalleryView(value: string | null): value is GalleryView {
  return value === "large" || value === "standard" || value === "compact"
}

export function ArtistImportStudioWithGalleryView() {
  const [galleryView, setGalleryView] = useState<GalleryView>("standard")
  const [galleryAvailable, setGalleryAvailable] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(GALLERY_VIEW_PREFERENCE_KEY)
    const initialView: GalleryView = isGalleryView(saved) ? saved : "standard"
    setGalleryView(initialView)
    document.documentElement.dataset.instagramGalleryView = initialView

    const updateAvailability = () => {
      setGalleryAvailable(Boolean(document.querySelector('[aria-labelledby="instagram-gallery-title"]')))
    }

    updateAvailability()
    const observer = new MutationObserver(updateAvailability)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      delete document.documentElement.dataset.instagramGalleryView
    }
  }, [])

  function chooseView(next: GalleryView) {
    setGalleryView(next)
    document.documentElement.dataset.instagramGalleryView = next
    window.localStorage.setItem(GALLERY_VIEW_PREFERENCE_KEY, next)
  }

  return (
    <>
      {galleryAvailable ? (
        <section className="mb-4 rounded-2xl border border-[#E2DCF1] bg-white p-3 shadow-[0_12px_36px_rgba(82,64,130,0.05)] sm:p-4" aria-label="Instagram import workflow and gallery display">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ol className="grid flex-1 gap-2 text-xs font-semibold text-[#625C70] sm:grid-cols-3" aria-label="Instagram import stages">
              <li className="flex min-h-11 items-center gap-2 rounded-xl bg-[#F7F4FC] px-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#5B4B8A] text-[0.68rem] text-white">1</span>
                Select works
              </li>
              <li className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EEE9F7] text-[0.68rem] text-[#5B4B8A]">2</span>
                Review details
              </li>
              <li className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EEE9F7] text-[0.68rem] text-[#5B4B8A]">3</span>
                Approve for portfolio
              </li>
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end" aria-label="Instagram gallery display options">
              <span className="text-xs font-semibold text-[#746E80]">Gallery size</span>
              <div className="inline-flex items-center gap-1 rounded-xl border border-[#DED7EF] bg-[#FAF9FD] p-1" role="group" aria-label="Instagram gallery density">
                {(["large", "standard", "compact"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`${buttonBase} ${galleryView === view ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}
                    aria-pressed={galleryView === view}
                    onClick={() => chooseView(view)}
                  >
                    {view === "large" ? "Large" : view === "standard" ? "Standard" : "Compact"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <style>{`
        section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid > article {
          content-visibility: auto;
          contain-intrinsic-size: 320px;
        }

        section[aria-labelledby="instagram-gallery-title"] > div.sticky {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }

        html[data-instagram-gallery-view="large"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }

        html[data-instagram-gallery-view="standard"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        @media (max-width: 340px) {
          html[data-instagram-gallery-view="standard"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }

          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 768px) {
          html[data-instagram-gallery-view="large"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          html[data-instagram-gallery-view="standard"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 1280px) {
          html[data-instagram-gallery-view="large"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          html[data-instagram-gallery-view="standard"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }

          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      <ArtistImportStudioPage />
    </>
  )
}
