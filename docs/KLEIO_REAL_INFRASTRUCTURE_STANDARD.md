# KLEIO Real Infrastructure Standard

KLEIO should not be presented or built as fake infrastructure.

The acceptable demo boundary is:

- Names may be synthetic.
- Institutions may be fictional until verified.
- Artist records may be seeded examples until real users exist.
- Opportunity records may be seeded examples until live ingestion is connected.

The unacceptable boundary is:

- Fake KPI numbers typed directly into the UI.
- Fake analytics that do not derive from records.
- Fake reviewer progress that cannot be traced back to reviews.
- Fake opportunity matching that cannot explain its score.
- Fake security language claiming production behavior that is not built.

## Current source standard

KLEIO should use structured source records first, then calculate UI state from those records.

Real computed layers include:

- submission counts
- status breakdowns
- reviewer progress
- completion rates
- missing-material flags
- deadline urgency
- review queue priority
- message badge counts
- shortlist groups
- activity history

These should derive from source records such as:

- artists
- institutions
- programs
- opportunities
- submissions
- reviews
- collaborators
- messages
- notes
- activity log entries

## Next infrastructure phase

The next phase is not more mock screens. It is migration from static seed data to live infrastructure.

Recommended live architecture:

1. Database-backed records
   - artists
   - institutions
   - users
   - roles
   - programs
   - opportunities
   - submissions
   - reviews
   - messages
   - notes
   - files
   - activity logs

2. Authentication and role access
   - artist account
   - institution admin
   - reviewer / collaborator seat
   - internal notes visibility
   - artist-controlled sharing / authorization

3. Opportunity ingestion
   - verified source feeds where available
   - approved manual/admin ingestion where no reliable API exists
   - normalized opportunity schema
   - source URL, fetched_at, deadline, eligibility, amount, location, discipline, required materials

4. Traceable analytics
   - every dashboard number should point back to records
   - no hard-coded KPI cards
   - no untraceable percentages
   - demo seed data can remain synthetic, but the calculation path should be real

5. Audit and trust layer
   - source label: seed, imported, verified, user-created, institution-created
   - created_at / updated_at
   - actor_id where relevant
   - activity log for important actions

## Outreach language

Use:

- real computed demo
- synthetic seed data
- structured source records
- traceable analytics
- intended live infrastructure
- prototype authentication

Avoid:

- fake dashboard
- fake users
- production authentication
- secure login
- verified institutions
- live integrations
- real submissions

Do not claim production infrastructure until the backend, auth, persistence, source ingestion, and permissions are actually connected and tested.
