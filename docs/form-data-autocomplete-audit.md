# KLEIO form data and autocomplete audit

**Audit date:** July 16, 2026  
**Implementation branch:** `agent/kleio-form-autocomplete`  
**Provider:** Mapbox Search Box API, optional browser-safe public token  
**Fallback:** Normalized manual entry remains available at all times

## Product and data decisions

- KLEIO searches its own public institution search index before external provider results.
- Selecting an existing KLEIO institution never creates ownership, membership, employment, or official representation.
- External provider IDs are stored separately from KLEIO UUIDs.
- Provider results are normalized into purpose-specific location and organization fields.
- Existing `location` text columns remain as compatibility/display fields; normalized data is stored in `location_data` JSONB.
- Institution duplicate candidates are flagged through `possible_duplicate_ids` and `duplicate_review_status`; records are never silently merged.
- Public identity and narrative fields remain editable text.
- Categories, roles, program types, participation formats, review states, and statuses use stable internal values.
- The autocomplete layer is optional. Forms remain usable when Mapbox is not configured or temporarily unavailable.

## Field inventory and changes

| Route | Form | Field | Previous input | New input | Data source | Stored values | Visibility | Reason | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/signup/artist/connected/` | Artist signup | Email | Email text | Email text | User | Auth email | Private | Unique account credential | Implemented |
| `/signup/artist/connected/` | Artist signup | Password | Password text | Password text | User | Supabase Auth only | Private | Credential must never be normalized as profile data | Implemented |
| `/signup/artist/connected/` | Artist signup | Professional name | Text | Text | User | `professional_name` | Public | Public-facing identity must remain editable | Implemented |
| `/signup/artist/connected/` | Artist signup | Public location | Text | Geographic autocomplete + manual entry | Mapbox place/city/locality | Display text + `location_data` | Public | Real locality suggestions without allowing organizations as cities | Implemented |
| `/signup/artist/connected/` | Artist signup | Disciplines | Comma-separated text | Searchable controlled multi-select + Other | KLEIO constants | Stable string array | Application/public | Consistent matching and filtering | Implemented |
| `/signup/artist/connected/` | Artist signup | Mediums | Comma-separated text | Searchable controlled multi-select + Other | KLEIO constants | Stable string array | Application/public | Consistent portfolio and opportunity matching | Implemented |
| `/signup/artist/connected/` | Artist signup | Languages | Comma-separated text | Searchable controlled multi-select + Other | KLEIO constants | Stable string array | Application/public | Consistent filtering | Implemented |
| `/signup/artist/connected/` | Artist signup | Biography/statement/practice | Textareas | Textareas | User | Text | Application/public | Personal narrative cannot be accurately standardized | Retained |
| `/signup/artist/connected/` | Artist signup | Featured works | Textarea | Progressive work-title intake | User | Portfolio work records | Application/public | Maintains low-friction activation requirement | Implemented |
| `/artist-dashboard/passport/connected/` | Creative Passport | Location | Text | Geographic autocomplete + manual entry | Mapbox place/city/locality | Display text + `location_data` | Public | Structured geography and user correction | Implemented |
| `/artist-dashboard/passport/connected/` | Creative Passport | Disciplines/mediums/languages | Comma-separated text | Searchable multi-selects | KLEIO constants | Stable arrays | Application/public | Shared option source across signup and editing | Implemented |
| `/signup/institution/connected/` | Institution signup | Institution name | Text | KLEIO-first institution autocomplete + external results + manual entry | KLEIO search index, Mapbox POI | Name, provider metadata, source mode | Public | Existing records first; real-world suggestions second | Implemented |
| `/signup/institution/connected/` | Institution signup | Organization type | Text | Controlled select | KLEIO constants | Stable value | Public/internal | Prevents category drift | Implemented |
| `/signup/institution/connected/` | Institution signup | Headquarters | Text | Venue/address autocomplete + manual entry | Mapbox POI/address | Display text + `location_data` | Public | Preserves distinction between organization and geography | Implemented |
| `/signup/institution/connected/` | Institution signup | Program types | Comma-separated text | Searchable controlled multi-select | KLEIO constants | Stable values in onboarding state | Internal | Prevents duplicate category wording | Implemented; persistence remains a later profile field |
| `/institution/connected/` | Institution profile | Institution name | Text | KLEIO-first institution autocomplete + manual entry | KLEIO search index, Mapbox POI | Normalized entity fields | Public | Supports correction and duplicate review | Implemented |
| `/institution/connected/` | Institution profile | Organization type | Text | Controlled select | KLEIO constants | Stable value | Public | Consistent reporting | Implemented |
| `/institution/connected/` | Institution profile | Headquarters | Text | Venue/address autocomplete + manual entry | Mapbox POI/address | Display text + `location_data` | Public | Real-world context with user control | Implemented |
| `/programs/new/connected/` | Open-call creation | Opportunity type | Text | Controlled select | KLEIO constants | Stable value | Public/internal | Program type must not be unrestricted text | Implemented |
| `/programs/new/connected/` | Open-call creation | Participation format | Text | Controlled select | KLEIO constants | Stable value | Public | Drives conditional physical-location fields | Implemented |
| `/programs/new/connected/` | Open-call creation | Location/venue | Text | Conditional venue autocomplete + manual entry | Mapbox POI/address | Display text + `location_data` | Public | Hidden for online-only programs | Implemented |
| `/programs/new/connected/` | Open-call creation | Geographic eligibility | Text | Controlled select | KLEIO constants | Stable value in JSONB | Public | Eligibility is a rule, not a generic address | Implemented |
| `/programs/new/connected/` | Open-call creation | Career stage | Text | Controlled select | KLEIO constants | Stable value in JSONB | Public | Consistent eligibility matching | Implemented |
| `/programs/new/connected/` | Open-call creation | Required materials | Freeform lines | Controlled multi-select + Other | KLEIO constants | Stable string array | Public/internal | Enables readiness checks | Implemented |
| `/programs/new/connected/` | Open-call creation | Review stages | Freeform lines | Controlled multi-select | KLEIO constants | Stable array in JSONB | Internal | Consistent institutional workflows | Implemented |
| `/programs/new/connected/` | Open-call creation | Review criteria | Freeform lines | Editable textarea | Institution | Text array in JSONB | Internal | Criteria are institution/program specific | Retained |
| Application forms | Artist application | Institution/location display | Read-only call data | Read-only normalized display | Saved call/institution records | Snapshot + references | Application | Applicants should not re-enter authoritative call data | Reviewed; no new input required |
| Reviewer flow | Review | Recommendation/status | Text-backed values | Database-constrained stable values | KLEIO | Stable values | Institution internal | Prevents reviewer status/category drift | Database implemented |
| Team setup | Institution membership | Role/status | Text-backed values | Database-constrained stable values | KLEIO | Stable values | Institution internal | Role is distinct from permissions/public title | Database implemented; dedicated setup UI remains outside this connected test-run surface |

## Autocomplete behavior

- Minimum query: 2 characters.
- Debounce: 320 milliseconds.
- Results: maximum 8.
- Cancellation: each new query aborts the prior request.
- Cache: in-memory session cache by purpose, country, and normalized query.
- Keyboard: Arrow Up/Down, Enter, Escape.
- Accessibility: combobox/listbox/option semantics, active-descendant state, visible focus, loading status via `aria-live`.
- Empty and unavailable states: explicit no-match/provider-unavailable messages.
- Manual fallback: always shown for non-empty queries.
- Result restrictions:
  - Country: `country` only.
  - Region: `region` only.
  - City: `place,city,locality` only.
  - Institution: `poi` only, with KLEIO records first.
  - Venue/address: `poi,address`.

## Supabase changes

Migration: `supabase/migrations/202607160005_form_data_normalization.sql`

Key changes:

- Added JSONB normalized location storage to artists, institutions, and open calls.
- Added provider/source/duplicate metadata to institutions.
- Added `institution_search_index`, a deliberately limited public search projection rather than exposing full institution records.
- Added trigram duplicate-candidate matching.
- Added constraints for institution type, opportunity type, participation format, team role/status, review recommendation, and review completion status.
- Kept KLEIO UUIDs as primary keys.
- Kept membership and ownership workflows separate from autocomplete selection.

## Environment and deployment

Required for connected Supabase persistence:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Optional for live real-world autocomplete:

```text
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
```

The Mapbox token must be a browser-safe public token restricted to KLEIO’s authorized GitHub Pages and preview origins and only the Search APIs KLEIO uses. It must be supplied through the deployment environment/GitHub Actions secret and never committed as a real token.

When the Mapbox token is absent, KLEIO shows no fabricated provider results and preserves normalized manual entry.

## Known limitations and next verification

- The connected Supabase project currently contains no production institution or artist records; duplicate behavior should be browser-tested with controlled test accounts and clearly synthetic records.
- Mapbox organization coverage varies, especially for independent or new artist-run spaces. Manual entry is therefore a permanent product requirement.
- A dedicated institution claim/membership request interface is not part of this pass. Existing-record selections only produce a warning and duplicate candidate; they do not connect accounts.
- The current connected test-run does not expose every future education, exhibition, partner-organization, and reviewer-management editor. The shared autocomplete and controlled-field components are ready to be reused when those editors are added.
- Final production verification requires a domain-restricted Mapbox token and a four-account test matrix: institution owner, reviewer/member, artist applicant, and unrelated outsider.
