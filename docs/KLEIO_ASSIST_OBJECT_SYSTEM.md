# KLEIO Assist Animated Object System

## Purpose

The KLEIO Assist object is a reusable visual presence for moments of preparation, review, translation, loading, and completion across the product. It is **not** a mascot, chatbot avatar, generic spinner, or loud loading animation.

It communicates that KLEIO is quietly preparing the workspace — organizing materials, checking readiness, aligning bilingual context, or preparing a report for review — while the user retains approval authority.

Tone: premium, calm, white/lavender, institutional, artist-friendly, subtle, precise, non-distracting.

## Asset Used

- **Video:** `/landing/kleio-transparent-center-video.mp4`
- **Path resolution:** `assetPath()` from `@/lib/asset-path` (required for GitHub Pages base-path compatibility)
- **Fallback:** Layered lavender gradient oval when video fails or reduced motion is preferred

## Component API

**File:** `components/kleio/kleio-assist-object.tsx`

```tsx
<KleioAssistObject
  mode="preparing"           // optional, default "idle"
  title="Readable title"     // required
  description="Optional copy"
  progress={72}              // optional, 0–100, clamped
  size="md"                  // "sm" | "md" | "lg", default "md"
  compact={false}            // horizontal card layout when true
  className=""               // optional wrapper classes
/>
```

### Types

- `KleioAssistObjectMode`: `idle` | `preparing` | `reviewing` | `attention` | `complete` | `translating`
- `KleioAssistObjectSize`: `sm` | `md` | `lg`

## Modes

| Mode | Visual treatment | Typical use |
|------|------------------|-------------|
| `idle` | Calm lavender ring, minimal glow | Passive availability, assist widgets |
| `preparing` | Soft pulse + ring shimmer | Passport build, workspace setup, reports |
| `reviewing` | Subtle active border | Fit/readiness scanning, opportunity matching |
| `attention` | Warmer lavender/amber ring | Missing materials, deadline pressure |
| `complete` | Soft green-lavender confirmation | Workspace ready, report prepared |
| `translating` | Dual-tone lavender/blue-violet ring | Bilingual alignment |

Meaning is conveyed through **readable text**, not animation alone.

## Sizes

| Size | Object dimensions | Layout context |
|------|-------------------|----------------|
| `sm` | ~52px | Compact cards, side rails, inline status |
| `md` | ~84px | Default preparation panels (signup transitions) |
| `lg` | ~140px | Major loading/preparation states only |

## Accessibility

- Video element is `aria-hidden`; title and description are real DOM text
- Progress bar uses `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Component does not rely on animation to communicate meaning
- Video failure shows a static premium gradient fallback (no broken-media icon)

## Reduced Motion

`window.matchMedia("(prefers-reduced-motion: reduce)")` is checked in `useEffect`. When active:

- Video is replaced with the static gradient fallback
- CSS animations on `.kleio-assist-*` classes are disabled via `@media (prefers-reduced-motion: reduce)`

## Current Implementation Locations

| Location | Mode | Notes |
|----------|------|-------|
| Artist signup final submit | `preparing` | ~1s delay before dashboard route |
| Institution signup final submit | `preparing` | Preserves `saveReviewTeamDemoState` |
| Artist opportunities right rail | `reviewing` | Progress from `fundingReadiness.completeness` |
| Reports export/preview CTA | `preparing` → `complete` | Demo-safe; no real file export |
| Auth gate session check | `reviewing` | Replaces generic loading text |

## Language Rules

**Use:** preparing, organizing, checking, suggesting, prepared for review, you approve what becomes official

**Avoid:** deciding, selecting winners, automatically applying, guaranteeing funding, approving applicants, making final decisions

All user-facing copy is localized via `lib/kleio-i18n.ts` under `assist.object.*` keys (English and Spanish parity required).

## Future Recommended Uses

Demo-safe extension points (not yet implemented):

- Submission drawer completeness check
- KLEIO Assist import preparation
- Bilingual translation alignment (`translating` mode)
- Collaborator review submission confirmation
- Report preview preparation
- Dashboard data refresh preview

Do not document or imply production export, real invitations, or automated decisions.

## CSS

Component-specific styles live in `app/globals.css` under namespaced classes:

- `.kleio-assist-motion`, `.kleio-assist-ring`, `.kleio-assist-pulse`, `.kleio-assist-reviewing`, `.kleio-assist-attention`, `.kleio-assist-complete`, `.kleio-assist-translating`
- Keyframes: `kleio-assist-pulse`, `kleio-assist-ring`, `kleio-assist-shimmer`, `kleio-assist-complete`

Landing page `.kleio-transparent-center-video` styles are unchanged.
