# KLEIO Database Schema Draft

This schema defines the next infrastructure target for KLEIO: real records first, synthetic seed data only where real users do not yet exist.

## Core principles

- Every dashboard metric must derive from records.
- Every review action should be traceable to an actor, object, and timestamp.
- Artists control what materials are shared.
- Institutions manage programs, submissions, reviewers, messages, reports, and review history.
- Reviewers see only assigned work and relevant context.
- Opportunity records must carry source metadata.

## Tables

### users

- id
- email
- display_name
- role_scope: artist, institution_admin, reviewer, collaborator, system
- created_at
- updated_at

### artists

- id
- user_id
- name
- location
- discipline
- medium
- bio
- statement
- tags
- website
- instagram
- contact_email
- passport_completeness
- created_at
- updated_at
- source_kind
- source_url
- verified_at

### institutions

- id
- name
- type
- location
- description
- current_cycle
- previous_cycle_application_count
- created_at
- updated_at
- verified_at

### institution_members

- id
- institution_id
- user_id
- role
- permissions
- invite_status
- created_at
- updated_at

### programs

- id
- institution_id
- title
- category
- status
- cycle
- deadline
- review_start
- decision_date
- description
- required_materials
- rubric
- created_by
- created_at
- updated_at

### program_committee_members

- id
- program_id
- member_id
- role
- access_scope
- created_at

### opportunities

- id
- source_kind: seed, ingested, verified, institution_created, user_created
- source_name
- source_url
- fetched_at
- verified_at
- title
- organizer
- type
- amount
- currency
- location
- deadline
- eligibility
- disciplines
- required_materials
- effort_level
- created_at
- updated_at

### submissions

- id
- artist_id
- program_id
- status
- priority
- completeness
- project_title
- statement
- missing_materials
- decision_stage
- score
- submitted_at
- created_at
- updated_at

### reviews

- id
- submission_id
- reviewer_id
- status
- score
- recommendation
- note
- completed_at
- updated_at

### notes

- id
- submission_id
- author_id
- note
- visibility: internal, reviewer, artist-visible
- created_at

### messages

- id
- submission_id
- sender_id
- recipient_type
- recipient_id
- type
- status
- created_at
- sent_at

### message_threads

- id
- submission_id
- subject
- counterpart_id
- channel
- unread
- updated_at

### message_entries

- id
- thread_id
- author_id
- body
- created_at

### files

- id
- owner_type: artist, institution, program, submission
- owner_id
- uploaded_by
- file_name
- file_type
- storage_path
- file_size
- created_at

### activity_log

- id
- actor_id
- institution_id
- submission_id
- program_id
- target_type
- target_id
- action
- created_at

### analytics_snapshots

- id
- institution_id
- program_id
- metric_key
- metric_value
- source_query
- generated_at

## Row-level access intent

### Artist

Artists can:

- read and edit their own profile
- manage their own materials
- authorize sharing to a program
- read status for their own submissions
- read messages addressed to them

Artists should not:

- see internal institution notes
- see committee discussions
- see other artists' private applications

### Institution admin

Institution admins can:

- manage programs owned by their institution
- view submissions to their programs
- invite reviewers
- manage reviewer assignments
- view internal notes and reports
- export review history

### Reviewer / collaborator

Reviewers can:

- see assigned submissions
- submit reviews
- see relevant rubric/guidelines
- see limited context approved by institution permissions

Reviewers should not:

- manage institution settings
- see unrelated submissions
- see private artist materials outside assigned review

## Migration path

1. Keep current synthetic seed records.
2. Map seed records into this schema.
3. Add a database client behind the existing source adapter.
4. Replace direct seed imports in analytics with the source adapter.
5. Add production auth only after role access rules are defined.
6. Add opportunity ingestion with source metadata.
7. Add tests proving analytics derive from records.
