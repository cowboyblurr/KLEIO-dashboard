"use client"

import { useEffect, useState } from "react"
import { ArtistImportStudioPage } from "@/components/kleio/artist-import-studio-page"

type GalleryView = "large" | "compact"

const buttonBase = "min-h-10 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

export function ArtistImportStudioWithGalleryView() {
  const [galleryView, setGalleryView] = useState<GalleryView>("large")
  const [galleryAvailable, setGalleryAvailable] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem("kleio-instagram-gallery-view")
    const initialView: GalleryView = saved === "compact" ? "compact" : "large"
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
    window.localStorage.setItem("kleio-instagram-gallery-view", next)
  }

  return (
    <>
      {galleryAvailable ? (
        <div className="mb-4 flex justify-end" aria-label="Instagram gallery display options">
          <div className="inline-flex items-center gap-1 rounded-xl border border-[#DED7EF] bg-[#FAF9FD] p-1" role="group" aria-label="Instagram gallery view">
            <button
              type="button"
              className={`${buttonBase} ${galleryView === "large" ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}
              aria-pressed={galleryView === "large"}
              onClick={() => chooseView("large")}
            >
              Large grid
            </button>
            <button
              type="button"
              className={`${buttonBase} ${galleryView === "compact" ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}
              aria-pressed={galleryView === "compact"}
              onClick={() => chooseView("compact")}
            >
              Compact grid
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        @media (max-width: 340px) {
          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 768px) {
          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1280px) {
          html[data-instagram-gallery-view="compact"] section[aria-labelledby="instagram-gallery-title"] > div.mt-4.grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      <ArtistImportStudioPage />
    </>
  )
}
