"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArtistImportStudioPage } from "@/components/kleio/artist-import-studio-page"

type GalleryView = "large" | "standard" | "compact"

const GALLERY_VIEW_PREFERENCE_KEY = "kleio.instagram.gallery-density.v1"
const buttonBase = "min-h-11 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function isGalleryView(value: string | null): value is GalleryView {
  return value === "large" || value === "standard" || value === "compact"
}

export function ArtistImportStudioWithGalleryView() {
  const [galleryView, setGalleryView] = useState<GalleryView>("standard")
  const [controlsTarget, setControlsTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(GALLERY_VIEW_PREFERENCE_KEY)
    const initialView: GalleryView = isGalleryView(saved) ? saved : "standard"
    setGalleryView(initialView)

    const updateTarget = () => {
      setControlsTarget(
        document.querySelector<HTMLElement>(
          'section[aria-labelledby="instagram-gallery-title"] > div:first-child',
        ),
      )
    }

    updateTarget()
    const observer = new MutationObserver(updateTarget)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      delete document.documentElement.dataset.instagramGalleryView
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.instagramGalleryView = galleryView
    window.localStorage.setItem(GALLERY_VIEW_PREFERENCE_KEY, galleryView)
  }, [galleryView])

  function chooseView(next: GalleryView) {
    setGalleryView(next)
  }

  const controls = (
    <div className="order-3 flex w-full justify-end pt-2" aria-label="Instagram gallery display options">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
  )

  return (
    <>
      <style>{`
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
      {controlsTarget ? createPortal(controls, controlsTarget) : null}
    </>
  )
}
