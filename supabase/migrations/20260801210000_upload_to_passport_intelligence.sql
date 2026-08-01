alter table public.artist_import_sources
  add column if not exists classification text not null default 'needs_artist_classification',
  add column if not exists classification_confidence numeric,
  add column if not exists classification_reason text not null default '',
  add column if not exists extraction_version text not null default '',
  add column if not exists privacy_level text not null default 'private',
  add column if not exists sensitivity text not null default 'standard',
  add column if not exists document_version integer not null default 1,
  add column if not exists is_current_version boolean not null default true,
  add column if not exists content_language text not null default '',
  add column if not exists last_error_category text not null default '',
  add column if not exists review_summary jsonb not null default '{}'::jsonb;

alter table public.artist_import_sources drop constraint if exists artist_import_sources_extraction_status_check;
alter table public.artist_import_sources add constraint artist_import_sources_extraction_status_check
  check (extraction_status = any (array[
    'pending','queued','processing','completed','partial','partially_extracted','source_unavailable','failed',
    'review_ready','ready_for_review','approved','artist_review_completed','needs_artist_classification'
  ]));
alter table public.artist_import_sources drop constraint if exists artist_import_sources_classification_check;
alter table public.artist_import_sources add constraint artist_import_sources_classification_check
  check (classification = any (array[
    'artwork_image','artwork_detail_image','artist_cv','artist_biography','artist_statement','project_proposal',
    'project_budget','work_sample_list','proof_of_residency','identification_document','reference_letter',
    'press_publication','exhibition_documentation','award_grant_documentation','application_requirement_file',
    'unknown_document','other_artist_material','needs_artist_classification'
  ]));
alter table public.artist_import_sources drop constraint if exists artist_import_sources_classification_confidence_check;
alter table public.artist_import_sources add constraint artist_import_sources_classification_confidence_check
  check (classification_confidence is null or (classification_confidence >= 0 and classification_confidence <= 1));
alter table public.artist_import_sources drop constraint if exists artist_import_sources_privacy_level_check;
alter table public.artist_import_sources add constraint artist_import_sources_privacy_level_check check (privacy_level = any (array['private','application_only','restricted']));
alter table public.artist_import_sources drop constraint if exists artist_import_sources_sensitivity_check;
alter table public.artist_import_sources add constraint artist_import_sources_sensitivity_check check (sensitivity = any (array['standard','sensitive','highly_sensitive']));
alter table public.artist_import_sources drop constraint if exists artist_import_sources_document_version_check;
alter table public.artist_import_sources add constraint artist_import_sources_document_version_check check (document_version > 0);
alter table public.artist_import_sources drop constraint if exists artist_import_sources_review_summary_object;
alter table public.artist_import_sources add constraint artist_import_sources_review_summary_object check (jsonb_typeof(review_summary) = 'object');

create table if not exists public.artist_extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.artist_import_sources(id) on delete cascade,
  classification text not null,
  status text not null default 'queued',
  extractor_version text not null,
  attempt integer not null default 1,
  extracted_text text not null default '',
  extracted_text_checksum text not null default '',
  total_pages integer,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  error_category text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_extraction_jobs_status_check check (status = any (array['queued','processing','ready_for_review','partially_extracted','failed','confirmed','dismissed','needs_artist_classification'])),
  constraint artist_extraction_jobs_classification_check check (classification = any (array[
    'artwork_image','artwork_detail_image','artist_cv','artist_biography','artist_statement','project_proposal',
    'project_budget','work_sample_list','proof_of_residency','identification_document','reference_letter',
    'press_publication','exhibition_documentation','award_grant_documentation','application_requirement_file',
    'unknown_document','other_artist_material','needs_artist_classification'
  ])),
  constraint artist_extraction_jobs_attempt_check check (attempt > 0),
  constraint artist_extraction_jobs_text_check check (char_length(extracted_text) <= 120000),
  constraint artist_extraction_jobs_total_pages_check check (total_pages is null or total_pages > 0),
  constraint artist_extraction_jobs_summary_object check (jsonb_typeof(summary) = 'object'),
  unique (source_id, extractor_version)
);
alter table public.artist_extraction_jobs enable row level security;
grant select, insert, update, delete on public.artist_extraction_jobs to authenticated;
drop policy if exists artist_extraction_jobs_manage_own on public.artist_extraction_jobs;
create policy artist_extraction_jobs_manage_own on public.artist_extraction_jobs for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check ((select auth.uid()) = artist_user_id and exists (
    select 1 from public.artist_import_sources source_row
    where source_row.id = source_id and source_row.artist_user_id = (select auth.uid())
  ));

alter table public.artist_import_proposals
  add column if not exists extraction_job_id uuid references public.artist_extraction_jobs(id) on delete set null,
  add column if not exists claim_type text not null default 'profile_field',
  add column if not exists target_section text not null default 'creative_passport',
  add column if not exists normalized_value jsonb not null default '{}'::jsonb,
  add column if not exists evidence_location jsonb not null default '{}'::jsonb,
  add column if not exists sensitivity text not null default 'standard',
  add column if not exists fingerprint text not null default '',
  add column if not exists relationship_status text not null default 'new',
  add column if not exists decision_reason text not null default '',
  add column if not exists claim_version integer not null default 1;
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_target_field_check;
alter table public.artist_import_proposals add constraint artist_import_proposals_target_field_check check (target_field ~ '^[a-z][a-z0-9_]{1,79}$');
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_status_check;
alter table public.artist_import_proposals add constraint artist_import_proposals_status_check check (status = any (array[
  'proposed','approved','edited_approved','rejected','deferred','conflicting','needs_clarification',
  'source_unavailable','extraction_failed','merged','superseded','outdated'
]));
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_sensitivity_check;
alter table public.artist_import_proposals add constraint artist_import_proposals_sensitivity_check check (sensitivity = any (array['standard','sensitive','highly_sensitive']));
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_relationship_status_check;
alter table public.artist_import_proposals add constraint artist_import_proposals_relationship_status_check check (relationship_status = any (array['new','duplicate','conflict','superseded','unresolved']));
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_normalized_value_object;
alter table public.artist_import_proposals add constraint artist_import_proposals_normalized_value_object check (jsonb_typeof(normalized_value) = 'object');
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_evidence_location_object;
alter table public.artist_import_proposals add constraint artist_import_proposals_evidence_location_object check (jsonb_typeof(evidence_location) = 'object');
alter table public.artist_import_proposals drop constraint if exists artist_import_proposals_claim_version_check;
alter table public.artist_import_proposals add constraint artist_import_proposals_claim_version_check check (claim_version > 0);

create table if not exists public.artist_passport_records (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  record_type text not null,
  section text not null default 'creative_passport',
  display_value text not null,
  normalized_value jsonb not null default '{}'::jsonb,
  normalized_key text not null default '',
  source_claim_id uuid references public.artist_import_proposals(id) on delete set null,
  source_id uuid references public.artist_import_sources(id) on delete set null,
  source_page integer,
  evidence_excerpt text not null default '',
  provenance_status text not null default 'confirmed',
  visibility text not null default 'private',
  status text not null default 'active',
  version integer not null default 1,
  supersedes_record_id uuid references public.artist_passport_records(id) on delete set null,
  is_sensitive boolean not null default false,
  confirmed_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_passport_records_type_check check (record_type ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint artist_passport_records_display_check check (char_length(display_value) between 1 and 20000),
  constraint artist_passport_records_normalized_object check (jsonb_typeof(normalized_value) = 'object'),
  constraint artist_passport_records_page_check check (source_page is null or source_page > 0),
  constraint artist_passport_records_evidence_check check (char_length(evidence_excerpt) <= 1200),
  constraint artist_passport_records_provenance_check check (provenance_status = any (array['extracted','suggested','edited','confirmed'])),
  constraint artist_passport_records_visibility_check check (visibility = any (array['private','application_only','public'])),
  constraint artist_passport_records_status_check check (status = any (array['active','superseded','outdated','removed'])),
  constraint artist_passport_records_version_check check (version > 0)
);
alter table public.artist_passport_records enable row level security;
grant select, insert, update, delete on public.artist_passport_records to authenticated;
drop policy if exists artist_passport_records_manage_own on public.artist_passport_records;
create policy artist_passport_records_manage_own on public.artist_passport_records for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check (
    (select auth.uid()) = artist_user_id
    and (source_id is null or exists (select 1 from public.artist_import_sources s where s.id = source_id and s.artist_user_id = (select auth.uid())))
    and (source_claim_id is null or exists (select 1 from public.artist_import_proposals c where c.id = source_claim_id and c.artist_user_id = (select auth.uid())))
  );

alter table public.artist_import_proposals
  add column if not exists existing_record_id uuid references public.artist_passport_records(id) on delete set null,
  add column if not exists duplicate_of_claim_id uuid references public.artist_import_proposals(id) on delete set null;

create table if not exists public.artist_document_versions (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null unique references public.artist_import_sources(id) on delete cascade,
  document_family text not null,
  version_number integer not null,
  previous_source_id uuid references public.artist_import_sources(id) on delete set null,
  is_current boolean not null default true,
  status text not null default 'current',
  comparison_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_document_versions_family_check check (document_family = any (array[
    'artist_cv','artist_biography','artist_statement','project_proposal','project_budget','work_sample_list',
    'proof_of_residency','identification_document','reference_letter','application_requirement_file','other_artist_material'
  ])),
  constraint artist_document_versions_number_check check (version_number > 0),
  constraint artist_document_versions_status_check check (status = any (array['current','superseded','archived','application_selected'])),
  constraint artist_document_versions_summary_object check (jsonb_typeof(comparison_summary) = 'object'),
  unique (artist_user_id, document_family, version_number)
);
alter table public.artist_document_versions enable row level security;
grant select, insert, update, delete on public.artist_document_versions to authenticated;
drop policy if exists artist_document_versions_manage_own on public.artist_document_versions;
create policy artist_document_versions_manage_own on public.artist_document_versions for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check ((select auth.uid()) = artist_user_id and exists (
    select 1 from public.artist_import_sources source_row where source_row.id = source_id and source_row.artist_user_id = (select auth.uid())
  ));

create table if not exists public.artist_requirement_assessments (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  requirement_id uuid not null references public.opportunity_requirements(id) on delete cascade,
  status text not null default 'cannot_determine',
  explanation text not null default '',
  evidence jsonb not null default '[]'::jsonb,
  validation_results jsonb not null default '[]'::jsonb,
  assessor_version text not null default 'passport_rules_v1',
  requirement_updated_at timestamptz,
  passport_updated_at timestamptz,
  assessed_at timestamptz not null default now(),
  artist_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_requirement_assessments_status_check check (status = any (array[
    'satisfied','likely_satisfied','needs_artist_review','partially_satisfied','missing','conflict_detected','requirement_changed','cannot_determine'
  ])),
  constraint artist_requirement_assessments_evidence_array check (jsonb_typeof(evidence) = 'array'),
  constraint artist_requirement_assessments_results_array check (jsonb_typeof(validation_results) = 'array'),
  unique (artist_user_id, requirement_id)
);
alter table public.artist_requirement_assessments enable row level security;
grant select, insert, update, delete on public.artist_requirement_assessments to authenticated;
drop policy if exists artist_requirement_assessments_manage_own on public.artist_requirement_assessments;
create policy artist_requirement_assessments_manage_own on public.artist_requirement_assessments for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check ((select auth.uid()) = artist_user_id and exists (
    select 1 from public.opportunity_requirements r where r.id = requirement_id and r.opportunity_id = opportunity_id
  ));

create table if not exists public.application_requirement_attachments (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  requirement_id uuid not null references public.opportunity_requirements(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  package_id uuid references public.application_packages(id) on delete cascade,
  source_id uuid not null references public.artist_import_sources(id) on delete cascade,
  source_version_id uuid references public.artist_document_versions(id) on delete set null,
  validation_status text not null default 'needs_artist_review',
  validation_results jsonb not null default '[]'::jsonb,
  included_in_package boolean not null default false,
  artist_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_requirement_attachments_status_check check (validation_status = any (array[
    'satisfied','likely_satisfied','needs_artist_review','partially_satisfied','missing','conflict_detected','requirement_changed','cannot_determine','invalid'
  ])),
  constraint application_requirement_attachments_results_array check (jsonb_typeof(validation_results) = 'array'),
  unique (artist_user_id, opportunity_id, requirement_id, source_id)
);
alter table public.application_requirement_attachments enable row level security;
grant select, insert, update, delete on public.application_requirement_attachments to authenticated;
drop policy if exists application_requirement_attachments_manage_own on public.application_requirement_attachments;
create policy application_requirement_attachments_manage_own on public.application_requirement_attachments for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check (
    (select auth.uid()) = artist_user_id
    and exists (select 1 from public.artist_import_sources s where s.id = source_id and s.artist_user_id = (select auth.uid()))
    and exists (select 1 from public.opportunity_requirements r where r.id = requirement_id and r.opportunity_id = opportunity_id)
    and (package_id is null or exists (select 1 from public.application_packages p where p.id = package_id and p.artist_user_id = (select auth.uid()) and p.opportunity_id = opportunity_id))
    and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.artist_user_id = (select auth.uid())))
  );

alter table public.application_package_items
  add column if not exists source_id uuid references public.artist_import_sources(id) on delete set null,
  add column if not exists source_version_id uuid references public.artist_document_versions(id) on delete set null,
  add column if not exists validation_result jsonb not null default '{}'::jsonb,
  add column if not exists included_in_package boolean not null default false,
  add column if not exists artist_confirmed_at timestamptz;
alter table public.application_package_items drop constraint if exists application_package_items_validation_object;
alter table public.application_package_items add constraint application_package_items_validation_object check (jsonb_typeof(validation_result) = 'object');

create index if not exists artist_import_sources_owner_classification_idx on public.artist_import_sources (artist_user_id, classification, created_at desc) where deleted_at is null;
create index if not exists artist_import_sources_owner_review_idx on public.artist_import_sources (artist_user_id, extraction_status, updated_at desc) where deleted_at is null;
create index if not exists artist_extraction_jobs_owner_status_idx on public.artist_extraction_jobs (artist_user_id, status, updated_at desc);
create index if not exists artist_extraction_jobs_source_idx on public.artist_extraction_jobs (source_id);
create index if not exists artist_import_proposals_job_status_idx on public.artist_import_proposals (extraction_job_id, status, created_at);
create index if not exists artist_import_proposals_owner_review_idx on public.artist_import_proposals (artist_user_id, status, target_section, created_at desc);
create index if not exists artist_import_proposals_fingerprint_idx on public.artist_import_proposals (artist_user_id, fingerprint) where fingerprint <> '';
create index if not exists artist_passport_records_owner_section_idx on public.artist_passport_records (artist_user_id, section, status, updated_at desc);
create index if not exists artist_passport_records_match_idx on public.artist_passport_records (artist_user_id, record_type, normalized_key) where status = 'active';
create index if not exists artist_passport_records_source_idx on public.artist_passport_records (source_id);
create unique index if not exists artist_document_versions_current_family_idx on public.artist_document_versions (artist_user_id, document_family) where is_current;
create index if not exists artist_requirement_assessments_opportunity_idx on public.artist_requirement_assessments (artist_user_id, opportunity_id, status);
create index if not exists application_requirement_attachments_requirement_idx on public.application_requirement_attachments (artist_user_id, opportunity_id, requirement_id);
create index if not exists application_requirement_attachments_package_idx on public.application_requirement_attachments (package_id) where package_id is not null;
create index if not exists application_package_items_source_idx on public.application_package_items (source_id) where source_id is not null;

comment on table public.artist_extraction_jobs is 'Owner-scoped, idempotent extraction jobs. Raw extracted text is private and omitted for sensitive classifications.';
comment on table public.artist_passport_records is 'Artist-confirmed structured Creative Passport records with source provenance, visibility and version state.';
comment on table public.artist_document_versions is 'Explicit source-version relationships for CVs, statements, biographies and other reusable documents.';
comment on table public.artist_requirement_assessments is 'Deterministic Passport-to-opportunity requirement assessments; external opportunities remain subject to portal confirmation.';
comment on table public.application_requirement_attachments is 'Artist-confirmed links between exact opportunity requirements and canonical private source versions.';
