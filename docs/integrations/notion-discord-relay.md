# KLEIO Notion → Discord update relay

This integration relays approved entries from the Notion database **KLEIO — Latest Updates** to a KLEIO Discord channel through a Supabase Edge Function.

## Architecture

`KLEIO — Latest Updates` → Notion database automation → Supabase Edge Function → Discord webhook

The relay intentionally listens to the dedicated update log instead of every edit in the KLEIO workspace. This keeps Discord concise and prevents unrelated or sensitive Notion activity from being broadcast.

## Production endpoint

```text
https://trekynurdgxgtaaqqtyq.supabase.co/functions/v1/kleio-notion-discord-relay
```

## Required Supabase secrets

Set these in **Supabase → Edge Functions → Secrets**:

- `DISCORD_WEBHOOK_URL`: the Discord channel webhook URL.
- `NOTION_RELAY_SECRET`: a long random shared secret used only by this relay.

Never commit either value to GitHub or expose them in browser code.

## Notion automation

Open **KLEIO — Latest Updates** and create a database automation.

### Trigger

Use **Page added**.

This prevents every later property correction from creating another Discord message. Create a new update-log entry when a new meaningful update should be announced.

### Action

Choose **Send webhook**.

- Method: `POST` (Notion webhook actions use POST)
- URL: the production endpoint above
- Custom header key: `x-kleio-relay-secret`
- Custom header value: the exact value stored as `NOTION_RELAY_SECRET`

Include these database properties in the webhook body:

- `Update`
- `Summary`
- `Category`
- `Link`
- `Updated`
- `Updated By`

## Discord output

The relay sends one embed containing:

- update title
- concise summary
- category
- update date
- editor, when available
- a direct link, when valid

Category colors are mapped for Meeting, Product, Strategy, Operations, Outreach, and Governance.

## Security controls

- The Discord webhook is read only from Supabase secrets.
- Requests require the `x-kleio-relay-secret` header.
- The function accepts only POST requests.
- Request bodies are limited to 64 KB.
- Discord mentions are disabled.
- Only official HTTPS `discord.com` webhook URLs are accepted.
- Failed Discord requests return a non-success response so Notion can flag and pause a broken automation.

## Test procedure

1. Add both Supabase secrets.
2. Configure the Notion automation.
3. Add a test row to **KLEIO — Latest Updates**:
   - Update: `Notion relay connected`
   - Summary: `KLEIO project updates can now be relayed from the controlled Notion update log into Discord.`
   - Category: `Operations`
   - Link: the KLEIO Operating HQ page
   - Updated: today's date
4. Confirm one Discord embed appears.
5. Delete or unpin the test row if it should not remain in the official history.

## Troubleshooting

- `relay_not_configured`: one or both Supabase secrets are missing.
- `unauthorized`: the Notion custom header does not match `NOTION_RELAY_SECRET`.
- `discord_delivery_failed`: the Discord webhook was rejected, deleted, or rate limited.
- Notion pauses the automation: inspect the warning on the webhook action, correct the configuration, and resume the automation.
