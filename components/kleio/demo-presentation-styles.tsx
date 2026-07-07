export function DemoPresentationStyles() {
  return (
    <style>{`
      @keyframes kleioPageIn {
        from {
          opacity: 0;
          transform: translate3d(0, 10px, 0) scale(0.995);
          filter: blur(3px);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes kleioCardIn {
        from {
          opacity: 0;
          transform: translate3d(0, 8px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      main,
      .landing-card-grid,
      .kleio-demo-guide-panel,
      .kleio-artist-dashboard-main > div,
      .kleio-artist-dashboard-main section,
      .kleio-artist-dashboard-main aside {
        animation: kleioPageIn 540ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .kleio-artist-dashboard-main section > section,
      .kleio-artist-dashboard-main aside > section,
      .kleio-artist-dashboard-main aside > div {
        animation: kleioCardIn 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .kleio-demo-guide-panel,
      .kleio-demo-guide-panel *,
      .kleio-artist-dashboard-main,
      .kleio-artist-dashboard-main * {
        box-sizing: border-box;
        min-width: 0;
      }

      .kleio-demo-guide-panel {
        overflow-wrap: anywhere;
        word-break: normal;
      }

      .kleio-demo-guide-panel button {
        white-space: normal;
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul) {
        position: relative;
        cursor: pointer;
        border: 1px solid #E7E1F7;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.74);
        padding: 0.85rem 2.35rem 0.85rem 0.95rem;
        box-shadow: 0 10px 26px rgba(82, 64, 130, 0.06);
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul)::after {
        content: "›";
        position: absolute;
        right: 0.95rem;
        top: 0.82rem;
        color: #5B4B8A;
        font-size: 1.05rem;
        line-height: 1;
        transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul).is-open::after {
        transform: rotate(90deg);
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul) > p:first-child {
        font-weight: 700;
        color: #292631;
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul) > p:nth-child(2),
      .kleio-demo-guide-panel .space-y-3 > div:has(> ul) > ul {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        margin-top: 0 !important;
        transition: max-height 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, margin 260ms ease;
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul).is-open > p:nth-child(2) {
        max-height: 4rem;
        opacity: 1;
        margin-top: 0.45rem !important;
      }

      .kleio-demo-guide-panel .space-y-3 > div:has(> ul).is-open > ul {
        max-height: 18rem;
        opacity: 1;
        margin-top: 0.65rem !important;
      }

      .kleio-artist-dashboard-main *,
      .kleio-demo-guide-anchor,
      .kleio-demo-guide-panel {
        transition-property: width, max-width, grid-template-columns, gap, padding, margin, transform, opacity, box-shadow, border-color, background-color;
        transition-duration: 260ms;
        transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
      }

      @media (min-width: 1280px) {
        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main > div {
          grid-template-columns: minmax(0, 1fr) !important;
          max-width: 1040px !important;
          padding-right: 1rem !important;
        }

        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main > div > aside {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 1rem !important;
        }

        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main > div > aside > section,
        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main > div > aside > div {
          min-width: 0 !important;
          overflow: hidden !important;
        }
      }

      @media (min-width: 1280px) and (max-width: 1500px) {
        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main > div {
          max-width: 940px !important;
          gap: 1rem !important;
        }
      }

      @media (min-width: 1280px) {
        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main [class*="grid-cols-4"] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 0.75rem !important;
          border-left: 0 !important;
        }

        body:has(.kleio-demo-guide-panel) .kleio-artist-dashboard-main [class*="divide-x"] > * {
          border-left-width: 0 !important;
          padding: 0.75rem !important;
          border-radius: 1rem !important;
          background: #F7F4FF !important;
          overflow: hidden !important;
        }
      }

      @media (max-width: 1279px) {
        body:has(.kleio-demo-guide-panel) .kleio-demo-guide-anchor {
          width: min(100vw - 1.5rem, 23rem) !important;
        }
      }

      @media (max-width: 767px) {
        .kleio-demo-guide-anchor {
          left: 0.75rem !important;
          right: 0.75rem !important;
          bottom: 0.75rem !important;
          width: auto !important;
        }

        .kleio-demo-guide-panel {
          max-height: min(76dvh, 36rem) !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        main,
        .landing-card-grid,
        .kleio-demo-guide-panel,
        .kleio-artist-dashboard-main > div,
        .kleio-artist-dashboard-main section,
        .kleio-artist-dashboard-main aside,
        .kleio-artist-dashboard-main section > section,
        .kleio-artist-dashboard-main aside > section,
        .kleio-artist-dashboard-main aside > div {
          animation: none !important;
        }

        .kleio-artist-dashboard-main *,
        .kleio-demo-guide-anchor,
        .kleio-demo-guide-panel {
          transition-duration: 0ms !important;
        }
      }
    `}</style>
  )
}
