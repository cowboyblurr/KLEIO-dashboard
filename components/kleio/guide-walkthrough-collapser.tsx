"use client"

import { useEffect } from "react"

export function GuideWalkthroughCollapser() {
  useEffect(() => {
    function sync() {
      const panels = document.querySelectorAll(".kleio-demo-guide-panel")
      panels.forEach((panel) => {
        panel.querySelectorAll("div").forEach((section) => {
          const label = section.querySelector(":scope > p")?.textContent?.trim()
          if (label !== "Guided walkthroughs" && label !== "Recorridos guiados") return
          section.classList.add("kleio-guide-walkthroughs")
          section.setAttribute("role", "button")
          section.setAttribute("tabindex", "0")
          section.setAttribute("aria-expanded", section.classList.contains("is-open") ? "true" : "false")
        })
      })
    }

    function toggle(section: Element) {
      section.classList.toggle("is-open")
      section.setAttribute("aria-expanded", section.classList.contains("is-open") ? "true" : "false")
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null
      const section = target?.closest(".kleio-guide-walkthroughs")
      if (!section) return
      if (target?.closest("button")) return
      toggle(section)
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as Element | null
      const section = target?.closest(".kleio-guide-walkthroughs")
      if (!section) return
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
      toggle(section)
    }

    sync()
    const interval = window.setInterval(sync, 500)
    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (
    <style>{`
      .kleio-guide-walkthroughs {
        position: relative;
        cursor: pointer;
        border: 1px solid #E7E1F7;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.74);
        padding: 0.85rem 2.35rem 0.85rem 0.95rem;
        box-shadow: 0 10px 26px rgba(82, 64, 130, 0.06);
      }

      .kleio-guide-walkthroughs::after {
        content: "›";
        position: absolute;
        right: 0.95rem;
        top: 0.82rem;
        color: #5B4B8A;
        font-size: 1.05rem;
        line-height: 1;
        transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .kleio-guide-walkthroughs.is-open::after {
        transform: rotate(90deg);
      }

      .kleio-guide-walkthroughs > p:first-child {
        font-weight: 700;
        color: #292631;
      }

      .kleio-guide-walkthroughs > p:nth-child(2),
      .kleio-guide-walkthroughs > ul {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        margin-top: 0 !important;
        transition: max-height 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, margin 260ms ease;
      }

      .kleio-guide-walkthroughs.is-open > p:nth-child(2) {
        max-height: 4rem;
        opacity: 1;
        margin-top: 0.45rem !important;
      }

      .kleio-guide-walkthroughs.is-open > ul {
        max-height: 18rem;
        opacity: 1;
        margin-top: 0.65rem !important;
      }
    `}</style>
  )
}
