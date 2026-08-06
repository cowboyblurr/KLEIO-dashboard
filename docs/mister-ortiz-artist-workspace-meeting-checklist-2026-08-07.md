# Mister Ortiz artist-workspace review

Meeting date: August 7, 2026
Production repair: PR #113
Regression pass: `fix/iker-regression-pass-2`

## What changed

1. Profile-photo uploads are allowed through the active artist image path.
2. Safe CV facts use the extracted value when the artist has not edited the suggestion.
3. Spanish workspaces use a focused Spanish CV upload and analysis screen.
4. The suggestion-review screen and common document errors remain in Spanish.
5. The complete artist-profile renderer now follows the workspace language, including navigation, portfolio labels, profile sections, professional record, contact, controls, empty states, and accessibility labels.
6. Confidence is explained as evidence strength, not as automatic truth.
7. Artist-written profile content remains in its original language unless the artist explicitly requests a translated version.
8. The detected source language is now persisted from document analysis; Iker’s existing CV is recorded as English.
9. Repeated discipline and medium labels are shown once in the artist-profile preview without deleting either underlying field.

## Regression verification completed

The following tests were executed against Iker’s real artist account permissions and rolled back without changing his profile:

- create an artist-owned profile-image source;
- save the profile-image path and crop position;
- create the profile media-usage record;
- attach the source to the profile;
- create and approve a CV suggestion;
- create its Passport record;
- confirm that an empty edit marker is normalized to `NULL`.

Current data audit:

- 24 CV suggestions approved;
- 0 pending suggestions;
- 0 blank edit markers;
- 0 duplicate active Passport records;
- 0 exact or normalized duplicate lines in education, exhibitions, or awards;
- 2 overlapping display terms across Disciplines and Mediums, deduplicated in the rendered profile;
- document language persisted as `en`.

## Five-minute walkthrough

1. Set the artist workspace to Spanish.
2. Open the Creative Passport import area.
3. Confirm that the CV flow and deferred-source labels are in Spanish.
4. Open Review updates and explain clearly supported, needs review, and matching/duplicate.
5. Open the artist-profile preview and confirm that all interface labels are Spanish while the artist-authored English text remains unchanged.
6. Confirm that overlapping discipline/medium labels appear once.
7. Upload a profile photo, save it, refresh the page, and reopen the profile preview.

## Pass criteria

- No mixed English/Spanish interface copy in the Spanish CV, suggestion-review, or artist-profile flow.
- Profile photo remains saved after refresh.
- Approving a fact does not show “Confirmed information cannot be empty.”
- Existing profile information is not visibly repeated after CV analysis.
- The artist understands why a suggestion was made and remains in control of approval.

## Language rule

The workspace interface follows the selected language. Artist-authored content remains in its original language. Translation must be an explicit artist action, must preserve the original, and must never silently overwrite artist writing.

## Honest status language for the meeting

- “Database- and permission-verified” for profile-image saving and safe-fact approval.
- “Data-audited” for duplicate records and duplicate profile lines.
- “Implemented in GitHub” for complete Spanish profile rendering.
- “Browser-verified” only after the final authenticated upload, refresh, and visual walkthrough.
