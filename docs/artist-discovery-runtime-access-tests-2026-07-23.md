# Artist Discovery Runtime Access Tests

Date: July 23, 2026

These tests used the connected Supabase database with `authenticated` role execution and controlled `auth.uid()` claim simulation. A temporary discovery publication was created from the existing internal audit artist profile and deleted after the tests. Final cleanup confirmed that the discovery table returned to zero rows.

## Results

| Test | Result |
| --- | --- |
| Artist creates own private discovery projection | Passed |
| Authenticated institution reads private artist projection | Denied; zero rows returned |
| Artist changes own projection to institution discovery | Passed |
| Authenticated institution reads opted-in projection | Passed; one row returned |
| Unrelated artist updates another artist's discovery projection | Denied; zero rows updated |
| Collaborator/reviewer account enumerates discovery directory | Denied; zero rows returned |
| Institution owner checks outreach permission for owned institution | Allowed |
| Same institution owner checks outreach permission for unrelated institution | Denied |
| Artist without an invitation or submitted application starts an institution conversation | Denied with SQLSTATE `42501` |
| Institution attempts discovery outreach using an archived, unpublished listing | Denied with SQLSTATE `22023` |
| Test discovery publication cleanup | Passed; final discovery row count returned to zero |

## Interpretation

The direct database tests confirmed the intended RLS and RPC boundaries for the tested roles and records. They do not replace a multi-browser session walkthrough with controlled login credentials, rendered pages, uploads, session expiry, and account switching.

No synthetic discovery record or permanent test invitation was left in the connected database.
