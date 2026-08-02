# Instagram artist-centered workflow — implementation report

Date: 2026-08-02

## Verified current state before the change

- Instagram uses the existing read-only `instagram_business_basic` connection boundary.
- Selected Instagram images are copied into private `artist_import_sources` records.
- `artist_instagram_import_drafts` stores editable review fields for those sources.
- Portfolio records reference the same source through `portfolio_works.import_source_id`; the image file is not copied into a second portfolio-only storage record.
- The existing frontend required artists to prepare works, review every field, and approve each artwork individually.
- The Import Studio ended with three competing destination actions: Media Library, Creative Passport, and Portfolio.
- The Media Library hero presented Import work, Quick upload, and a separate Passport-review action with equal prominence.
- The current Instagram implementation does not provide verified computer-vision analysis of the selected images. Captions, dates, tags, and editable artwork fields are available for source-grounded suggestions.

## Product problems found

### High friction

1. The artist completed several administrative stages before the benefit was clear.
2. Private storage and portfolio inclusion looked like separate approval systems even though they use the same source record.
3. Each pending artwork had its own primary approval button, producing repetitive work for larger selections.
4. Essential and advanced metadata were presented together as a long form.
5. The workflow described internal preparation mechanics instead of explaining how the work becomes reusable.

### Navigation and action duplication

| Surface | Before | Problem | After |
| --- | --- | --- | --- |
| Selection tray | `Review selected works` | Did not explain the value or next state | `Continue with selected works` |
| Artwork card | `Approve artwork` on every work | Repeated the same final decision per item | `Include in portfolio` toggle plus one batch save |
| Final action | Multiple item approvals | No clear group completion | `Save works to KLEIO` |
| Import Studio footer | Media Library, Creative Passport, Portfolio | Three competing destinations after every import source | Footer removed; context-specific completion actions remain inside the workflow |
| Media Library hero | Import work, Quick upload, Review Passport updates | Three equally prominent actions with overlapping continuation logic | Import work and Quick upload only |
| Media Library state | `Approved work` | Sounded like a generic approval system | `In portfolio` |

## Data model decision

`artist_import_sources` remains the reusable private source of truth.

- **Media Library:** displays the private source record.
- **Portfolio:** creates one `portfolio_works` record that references `import_source_id` and the existing image path.
- **Creative Passport:** receives only artist-selected, confirmed practice information.
- **Applications:** continue to reuse approved portfolio works and private media through existing source/usage relationships.
- **Opportunity matching:** may use confirmed Passport and artwork metadata in later matching work; this change does not claim or introduce a new verified matching model.

No parallel Instagram artwork table, duplicate file copy, or alternative portfolio store was added.

## Implemented workflow

### 1. Select works

- Keeps preview, carousel-child selection, refresh, load more, and selection-limit behavior.
- Keeps Large, Standard, and Compact gallery density controls.
- Preserves selections during refresh and pagination.
- Adds selected-work thumbnails to the persistent tray.
- Retains explicit rights confirmation.
- Uses the primary action `Continue with selected works`.

### 2. Prepare privately

- The selected images are copied once into private KLEIO source records.
- The interface states that KLEIO is preparing artwork records and identifying patterns from available captions and details.
- Partial failures preserve successful records and leave only failed media selected for retry.
- Focus moves to the review section after preparation.

### 3. Practice insights

A private, editable suggestion panel is generated from available:

- Instagram captions
- post dates
- extracted or edited artwork titles
- mediums
- series
- descriptions
- tags

Possible suggestions include themes, visual-language terms, mood terms, mediums, disciplines, profile tags, and evidence-supported opportunity categories.

Limitations are explicit:

- Suggestions are not presented as verified visual judgments.
- No image-content interpretation is claimed.
- Every suggestion can be edited, selected, dismissed, or restored.
- Creative Passport updates require an explicit checkbox.
- Confirmed disciplines and mediums are merged with existing values.
- Confirmed practice language is appended without replacing existing artist-authored text.

### 4. Simplified artwork confirmation

Immediately visible:

- image
- title
- year
- medium
- `Include in portfolio` toggle

Progressively disclosed:

- dimensions
- series
- description
- tags
- accessibility description
- original caption
- original Instagram link

Private Media Library records can remain incomplete. A title is required only when the artist chooses portfolio inclusion.

### 5. One batch save

The sticky summary shows:

- private records in the group
- works selected for portfolio
- works remaining private
- selected practice insights
- portfolio works missing titles

`Save works to KLEIO`:

1. persists all private edits,
2. creates portfolio references only for selected titled works,
3. applies only explicitly confirmed Passport insights,
4. preserves private records when a portfolio action fails,
5. returns one completion state.

The completion state provides only:

- `View portfolio`
- `Done` (Media Library)

## Route and action map

| Route | Distinct purpose | Primary action |
| --- | --- | --- |
| `/artist-dashboard/import/` | Bring external or device-held work into KLEIO and organize it | Source-specific import action |
| `/artist-dashboard/media/` | Manage the private reusable source library | Import work |
| `/artist-dashboard/portfolio/` | Curate presentation-ready works that reference Media Library sources | Portfolio management action on that page |
| `/artist-dashboard/passport/` | Maintain the reusable artist identity and confirmed practice information | Passport save/edit action on that page |
| `/artist-dashboard/opportunities/` | Discover and evaluate opportunities using confirmed artist information | Opportunity-specific action |
| `/artist-dashboard/applications/` | Manage application drafts and submitted records | Application-specific action |

Funding remains an Opportunities state rather than a separate primary navigation destination.

## Privacy and security

Unchanged:

- `instagram_business_basic` only
- artist authentication requirement
- encrypted server-only tokens
- one-time OAuth state protections
- trusted-host media restrictions
- media signature validation
- rights-confirmation recording
- private draft storage
- artist control before portfolio display
- existing database RLS and service boundaries

No authentication, gateway, Edge Function, migration, secret, permission, or token-handling file was changed.

## Accessibility retained or improved

- 44-pixel selection and dialog controls
- keyboard-operable checkboxes, toggles, details, and actions
- visible focus rings
- screen-reader selection announcements
- error/status live regions
- accessible dialog semantics
- Escape-to-close
- arrow-key gallery navigation
- focus trapping and focus return
- reduced-motion-aware scrolling
- mobile safe-area padding on sticky controls
- public/private state conveyed in text, not color alone

## Repository validation

Completed:

- Source inspection of the current `main` data lifecycle and relevant routes.
- Branch comparison against current `main`; branch is ahead without being behind.
- Strict TypeScript source check for:
  - `instagram-import-assist.tsx`
  - `instagram-import-gallery-ui.tsx`
  - `instagram-practice-insights.ts`
- The TypeScript check used the repository's actual `saveArtistPassport` input contract.
- Updated `audit:instagram-import` assertions for the batch workflow, security boundaries, insight limitations, and accessible preview behavior.
- Source review confirmed no protected backend or database file changed.

Not claimed as completed:

- full repository `pnpm typecheck`
- full repository lint
- production build
- rendered browser interaction testing
- physical Safari, Firefox, iOS, Android, keyboard, or screen-reader testing

Those checks require a runnable repository/browser environment and must not be represented as passed until executed.

## Remaining risks and deferred work

1. Practice insights are source-text suggestions, not image-content analysis. A future verified image-analysis service should remain opt-in, explain its evidence, and require artist confirmation.
2. Portfolio creation is batched in the interface but uses the existing per-item backend action sequentially. This preserves compatibility and partial-failure safety; a future atomic batch endpoint may improve performance.
3. The wider artist-side navigation still contains multiple major destinations by design. Additional consolidation should be based on rendered user testing rather than removing distinct workflows blindly.
4. Mobile and assistive-technology behavior still requires physical testing.
5. Opportunity matching was not rewritten in this focused change; it continues to depend on existing confirmed profile and artwork data.

## Rollback

Revert the focused workflow merge commit. No migration or backend rollback is required because the implementation changes only frontend workflow, helper logic, audit assertions, and copy.
