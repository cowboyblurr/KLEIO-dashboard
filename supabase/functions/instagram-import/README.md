# Instagram Import Edge Function

This function implements KLEIO's read-only Instagram professional-account import flow.

## Deployment

Deploy with JWT verification disabled because the Instagram OAuth callback is a browser GET request without a KLEIO bearer token. Every browser POST action manually validates the Supabase JWT, verifies the artist role, and enforces allowed origins.

## Required secrets

- `META_INSTAGRAM_APP_ID`
- `META_INSTAGRAM_APP_SECRET`

Optional hardening/configuration:

- `META_INSTAGRAM_TOKEN_ENCRYPTION_KEY`
- `META_INSTAGRAM_API_VERSION`
- `META_INSTAGRAM_REDIRECT_URI`
- `KLEIO_PUBLIC_ORIGIN`
- `KLEIO_ALLOWED_ORIGINS`

## OAuth redirect URI

`https://trekynurdgxgtaaqqtyq.supabase.co/functions/v1/instagram-import`

Only `instagram_business_basic` is requested. The import flow does not request publishing, messaging, comment-management, or advertising permissions.
