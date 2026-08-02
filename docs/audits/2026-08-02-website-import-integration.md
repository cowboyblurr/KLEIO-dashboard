# Website Import integration release

## Release scope

This integration combines the current Website Import Assist, unified source selection, and Gemini-backed evidence organization without replacing the newer deployed website analyzer functions.

## Included

- Premium Import Studio source-selection hub
- Device and Google Drive entry points
- Artist-owned website scan entry point
- Honest Pinterest configuration state
- Existing Instagram read-only import
- Source-backed Gemini organization panel
- Artist review controls before any Passport update
- Additive database migration and isolated JWT-protected Edge Function

## Preserved

- Current deployed `analyze-artist-website` gateway and collector behavior
- Existing Cloudflare-backed `kleio-assist` actions
- Existing Instagram OAuth and media selection
- Artist approval, provenance, and private staging boundaries

## Production steps

1. Apply `gemini_website_intelligence` migration.
2. Deploy `organize-website-evidence` with JWT verification.
3. Configure `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.6-flash` as private Edge Function secrets.
4. Merge this branch to `main`.
5. Run an authenticated artist smoke test using a completed website scan.
