# KLEIO Notion → Discord relay

Canonical production path:

`Notion — KLEIO Latest Updates` → `Supabase Edge Function: kleio-notion-discord-relay` → `Discord`

## Verified behavior — 2026-08-07

- Creating a new record in **KLEIO — Latest Updates** successfully triggers the relay and Discord delivery.
- The Supabase Edge Function returned HTTP `200`, which occurs only after Discord accepts the webhook message.
- Editing an existing Latest Updates record did not produce a second relay call during the controlled verification, so the currently verified trigger scope is **new update records**, not arbitrary edits throughout the Notion workspace.

This is intentional operationally: Discord should receive meaningful project updates rather than every typing or formatting change in Notion.

## Runtime secrets

Stored in Supabase Edge Function secrets; never commit values:

- `DISCORD_WEBHOOK_URL`
- `NOTION_RELAY_SECRET`

## Security

The function:

- requires the `x-kleio-relay-secret` header;
- compares the relay secret in constant time;
- restricts Discord webhook destinations to approved Discord hosts;
- disables Discord mentions;
- enforces a 64 KB request-body limit;
- never returns secret values in its health response.

## Source of truth

The deployed function source is tracked at `supabase/functions/kleio-notion-discord-relay/index.ts`.

Do not reintroduce a parallel Cloudflare/Vercel relay unless the product requirement changes. If KLEIO later needs notifications for arbitrary Notion page edits, implement that as a deliberate second-stage event-ingestion layer rather than turning every Notion keystroke into a Discord notification.
