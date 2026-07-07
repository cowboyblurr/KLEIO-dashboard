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
