# Opportunity media enrichment

This server-side worker checks active, source-attributed opportunity pages for call-specific preview images.

Trust boundaries:

- Only the `mexico-cultura` and `ibermusicas` source registries are currently enabled.
- Canonical pages and image URLs must use HTTPS and match the registered official base domain.
- Generic directory pages, logos, icons, loading assets, placeholders, and unrelated images are rejected.
- Image MIME type is verified before metadata is saved.
- Institution and provider uploads are never overwritten.
- When no valid call-specific image is published, the opportunity remains on the KLEIO category fallback.

The production cron invokes this function weekly using the existing opportunity-sync token stored in Supabase Vault.
