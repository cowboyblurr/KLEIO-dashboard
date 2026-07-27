# KLEIO custom-domain migration

Production domain: `https://www.kleioarthouse.com`

Repository changes in this migration:

- Export the Next.js application at the domain root instead of `/KLEIO-dashboard`.
- Generate production authentication and recovery URLs from `https://www.kleioarthouse.com`.
- Include `public/CNAME` for GitHub Pages.
- Build and verify the production export without the former GitHub Pages base path.
- Resolve live verification against the deployed GitHub Pages URL rather than a hard-coded account URL.

Account-level completion requirements:

1. GitHub Pages custom domain must be set to `www.kleioarthouse.com`.
2. DNS for `www` must point to `cowboyblurr.github.io`.
3. Apex DNS must point to GitHub Pages or redirect to `www`.
4. Supabase Authentication Site URL and allowed redirects must include the new domain.
5. HTTPS must be enabled after GitHub validates DNS.

Do not declare the migration complete until artist signup, institution signup, email confirmation, password recovery, and direct route refreshes pass on the custom domain.
