# KLEIO Auth and Role Model Plan

This plan defines the minimum credible access model before KLEIO accepts real users, files, or submissions.

## Account types

### Artist

Can:

- create and edit own Creative Passport
- upload and manage own materials
- save reusable answers
- view own opportunity readiness
- authorize submission of selected materials
- view own application status
- read and respond to artist-facing messages

Cannot:

- see other artists' private materials
- see internal reviewer notes
- see institution committee discussion
- edit institution program settings

### Institution admin

Can:

- manage institution workspace
- create and edit programs/open calls
- invite reviewers/collaborators
- view submissions to their institution
- assign reviewers
- send applicant messages
- view reports and activity history
- export review-cycle records

Cannot:

- edit artist-owned source materials without artist authorization
- see unrelated institution workspaces

### Reviewer

Can:

- access assigned submissions only
- view program rubric/guidelines
- submit scores, recommendations, and review notes
- see deadlines for assigned reviews

Cannot:

- manage programs
- invite other reviewers
- see unrelated submissions
- access private artist materials outside assignment scope
- view institution admin settings

### Collaborator / viewer

Can:

- view limited workspace context granted by invitation
- participate in committee review if permissioned

Cannot:

- perform admin actions unless upgraded by institution admin

### System actor

Used for:

- ingestion jobs
- status automation
- audit log entries
- generated reminders

System actions must be labeled clearly as system-generated.

## Route protection requirements

- `/artist-dashboard/*` requires artist role.
- `/dashboard/*` and institution routes require institution admin or approved institution member.
- `/collaborator-dashboard/*` requires reviewer/collaborator invitation.
- `/signup/*` remains public.
- `/demo/*` may remain public for demo/preview pages.

## Permission checks

Every data read should eventually check:

- authenticated user id
- role
- institution id
- artist id
- assignment id where relevant
- invitation status
- object owner

## Minimum production-auth checklist

Before calling KLEIO production-ready, implement:

- persistent user accounts
- secure session handling
- role lookup
- route protection
- database-backed permissions
- logout
- environment-separated secrets
- audit log for role-sensitive actions

## Demo language

Until this is built, use:

- prototype authentication
- simulated demo login
- intended role model
- reviewer-seat preview

Do not use:

- secure login
- production authentication
- verified account system
