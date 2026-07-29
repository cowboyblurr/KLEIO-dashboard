alter table public.opportunity_research_sessions drop constraint if exists opportunity_research_sessions_status_check;
alter table public.opportunity_research_sessions add constraint opportunity_research_sessions_status_check check (status = any (array['queued','acquiring_source','parsing_source','ocr_pending','extracting_requirements','resolving_conflicts','matching_passport','building_package','artist_review_required','complete','succeeded','partial','retry_scheduled','blocked','failed','cancelled','stale','running']));
alter table public.opportunity_research_steps drop constraint if exists opportunity_research_steps_status_check;
alter table public.opportunity_research_steps add constraint opportunity_research_steps_status_check check (status = any (array['queued','running','completed','skipped','blocked','failed','retry_scheduled','cancelled']));
alter table public.opportunity_research_findings drop constraint if exists opportunity_research_findings_confidence_status_check;
alter table public.opportunity_research_findings add constraint opportunity_research_findings_confidence_status_check check (confidence_status = any (array['verified','corroborated','likely','unresolved','outdated','superseded','artist-confirmed','institution-confirmed']));

alter table public.opportunity_research_sources
  add column if not exists etag text not null default '',
  add column if not exists last_modified text not null default '',
  add column if not exists content_length bigint,
  add column if not exists checksum text not null default '',
  add column if not exists final_url text not null default '',
  add column if not exists redirect_chain jsonb not null default '[]'::jsonb,
  add column if not exists robots_status text not null default 'unknown',
  add column if not exists fetch_method text not null default 'direct',
  add column if not exists source_version_id uuid;

create table if not exists public.kleio_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rollout jsonb not null default '{}'::jsonb,
  description text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.kleio_feature_flags (key, enabled, description) values
  ('opportunity_research', true, 'Queue-backed public-source research and session-scoped evidence.'),
  ('opportunity_pdf_text_extraction', false, 'Text-based PDF extraction with page-level evidence.'),
  ('opportunity_ocr', false, 'OCR for image-only public guideline pages.'),
  ('opportunity_search_provider', false, 'Provider-neutral public search discovery.'),
  ('opportunity_source_monitoring', false, 'Conditional source checks and package staleness.'),
  ('gmail_connection', false, 'Google OAuth connection for artist-controlled Gmail actions.'),
  ('gmail_draft_creation', false, 'Creation of real Gmail drafts after artist approval.'),
  ('gmail_send', false, 'Explicit artist-controlled Gmail send.'),
  ('portal_assistance', false, 'Artist-controlled local browser assistance.'),
  ('provider_final_submission', false, 'Provider-specific verified final submission adapters.')
on conflict (key) do nothing;

create table if not exists public.opportunity_research_jobs (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  job_type text not null default 'full_research', current_stage text not null default 'queued',
  status text not null default 'queued' check (status = any (array['queued','processing','retry_scheduled','artist_review_required','complete','partial','blocked','failed','cancel_requested','cancelled','stale'])),
  attempt_count integer not null default 0 check (attempt_count >= 0), max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  queue_message_id bigint, lease_expires_at timestamptz, idempotency_key text not null unique,
  priority smallint not null default 50 check (priority between 0 and 100), scheduled_at timestamptz not null default now(),
  started_at timestamptz, completed_at timestamptz, failure_category text not null default '', error_message text not null default '',
  worker_version text not null default 'opportunity-research-worker-v1', extraction_version text not null default 'deterministic-v2',
  source_version_id uuid, cost_metadata jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists opportunity_research_jobs_one_active_idx on public.opportunity_research_jobs (artist_user_id, opportunity_id) where status in ('queued','processing','retry_scheduled','cancel_requested');
create index if not exists opportunity_research_jobs_session_idx on public.opportunity_research_jobs (session_id);
create index if not exists opportunity_research_jobs_status_schedule_idx on public.opportunity_research_jobs (status, scheduled_at, priority desc);

alter table public.opportunity_research_sessions
  add column if not exists latest_job_id uuid references public.opportunity_research_jobs(id) on delete set null,
  add column if not exists source_version_id uuid,
  add column if not exists worker_version text not null default '',
  add column if not exists extraction_version text not null default '',
  add column if not exists stale_reason text not null default '';

create table if not exists public.opportunity_source_versions (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid references public.opportunity_research_sessions(id) on delete cascade,
  research_source_id uuid references public.opportunity_research_sources(id) on delete set null,
  source_url text not null, final_url text not null default '', source_role text not null default 'supporting',
  authority_status text not null default 'other', content_type text not null default '', checksum text not null,
  etag text not null default '', last_modified text not null default '', content_length bigint,
  redirect_chain jsonb not null default '[]'::jsonb, robots_status text not null default 'unknown',
  source_date timestamptz, fetched_at timestamptz not null default now(), fetch_status text not null default 'fetched',
  parser_version text not null default '', is_current boolean not null default true,
  supersedes_id uuid references public.opportunity_source_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique (opportunity_id, source_url, checksum)
);
create index if not exists opportunity_source_versions_current_idx on public.opportunity_source_versions (opportunity_id, source_url, is_current);
create index if not exists opportunity_source_versions_session_idx on public.opportunity_source_versions (session_id);
alter table public.opportunity_research_sources add constraint opportunity_research_sources_source_version_id_fkey foreign key (source_version_id) references public.opportunity_source_versions(id) on delete set null;
alter table public.opportunity_research_jobs add constraint opportunity_research_jobs_source_version_id_fkey foreign key (source_version_id) references public.opportunity_source_versions(id) on delete set null;
alter table public.opportunity_research_sessions add constraint opportunity_research_sessions_source_version_id_fkey foreign key (source_version_id) references public.opportunity_source_versions(id) on delete set null;

create table if not exists public.opportunity_research_documents (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  source_version_id uuid not null references public.opportunity_source_versions(id) on delete cascade,
  document_kind text not null default 'pdf', source_url text not null, checksum text not null,
  content_type text not null default '', byte_size bigint, page_count integer check (page_count is null or page_count >= 0),
  storage_path text not null default '', extraction_status text not null default 'pending' check (extraction_status = any (array['pending','extracting','text_extracted','ocr_required','partial','blocked','failed'])),
  encrypted boolean not null default false, parser_version text not null default '', retention_until timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (session_id, source_version_id, checksum)
);
create index if not exists opportunity_research_documents_session_idx on public.opportunity_research_documents (session_id);
create index if not exists opportunity_research_documents_source_version_idx on public.opportunity_research_documents (source_version_id);

create table if not exists public.opportunity_research_document_pages (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.opportunity_research_documents(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  page_number integer not null check (page_number > 0), printed_page_label text not null default '',
  text_content text not null default '', text_items jsonb not null default '[]'::jsonb, bounding_boxes jsonb not null default '[]'::jsonb,
  extraction_method text not null default 'pdf_text' check (extraction_method = any (array['pdf_text','ocr','manual_review','unavailable'])),
  ocr_confidence numeric check (ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 1)),
  page_checksum text not null default '', parser_version text not null default '', requires_review boolean not null default false,
  created_at timestamptz not null default now(), unique (document_id, page_number)
);
create index if not exists opportunity_research_document_pages_session_idx on public.opportunity_research_document_pages (session_id);

alter table public.opportunity_research_findings
  add column if not exists source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  add column if not exists document_id uuid references public.opportunity_research_documents(id) on delete set null,
  add column if not exists page_id uuid references public.opportunity_research_document_pages(id) on delete set null,
  add column if not exists evidence_location text not null default '',
  add column if not exists extraction_method text not null default 'deterministic',
  add column if not exists parser_version text not null default '',
  add column if not exists conflict_status text not null default 'none',
  add column if not exists finding_scope text not null default 'session' check (finding_scope in ('session','canonical_candidate')),
  add column if not exists human_approved boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.opportunity_candidate_requirements (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  finding_id uuid references public.opportunity_research_findings(id) on delete set null,
  source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  document_id uuid references public.opportunity_research_documents(id) on delete set null,
  page_id uuid references public.opportunity_research_document_pages(id) on delete set null,
  normalized_key text not null, label text not null, required boolean not null default true,
  category text not null default 'supporting_document', description text not null default '', passport_field text not null default '',
  input_type text not null default 'document', source_text text not null default '', source_url text not null default '',
  source_title text not null default '', evidence_location text not null default '', normalized_interpretation text not null default '',
  minimum_word_count integer, maximum_word_count integer, minimum_item_count integer, maximum_item_count integer,
  accepted_file_types text[] not null default '{}', maximum_file_size_bytes bigint, maximum_total_size_bytes bigint,
  filename_pattern text not null default '', requires_artist_confirmation boolean not null default false,
  legal_declaration boolean not null default false, payment_required boolean not null default false,
  human_verification_required boolean not null default false,
  confidence_status text not null default 'unresolved' check (confidence_status = any (array['verified','corroborated','likely','unresolved','outdated','superseded','artist-confirmed','institution-confirmed'])),
  confidence_score numeric check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  confidence_reason text not null default '', conflict_status text not null default 'none' check (conflict_status in ('none','possible','confirmed','resolved')),
  extraction_method text not null default 'deterministic', parser_version text not null default '', constraints jsonb not null default '{}'::jsonb,
  artist_review_status text not null default 'unreviewed' check (artist_review_status in ('unreviewed','accepted_for_package','rejected','needs_clarification')),
  promoted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (session_id, normalized_key, source_version_id, page_id)
);
create index if not exists opportunity_candidate_requirements_session_idx on public.opportunity_candidate_requirements (session_id, normalized_key);
create index if not exists opportunity_candidate_requirements_opportunity_idx on public.opportunity_candidate_requirements (opportunity_id);

create table if not exists public.opportunity_candidate_eligibility_rules (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  finding_id uuid references public.opportunity_research_findings(id) on delete set null,
  source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  document_id uuid references public.opportunity_research_documents(id) on delete set null,
  page_id uuid references public.opportunity_research_document_pages(id) on delete set null,
  rule_type text not null, operator text not null default 'stated', value jsonb not null default 'null'::jsonb,
  requirement_level text not null default 'required', source_text text not null default '', source_url text not null default '',
  source_title text not null default '', evidence_location text not null default '',
  confidence_status text not null default 'unresolved' check (confidence_status = any (array['verified','corroborated','likely','unresolved','outdated','superseded','artist-confirmed','institution-confirmed'])),
  confidence_score numeric check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  conflict_status text not null default 'none' check (conflict_status in ('none','possible','confirmed','resolved')),
  extraction_method text not null default 'deterministic', parser_version text not null default '',
  artist_review_status text not null default 'unreviewed' check (artist_review_status in ('unreviewed','accepted_for_package','rejected','needs_clarification')),
  promoted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists opportunity_candidate_eligibility_session_idx on public.opportunity_candidate_eligibility_rules (session_id, rule_type);

create table if not exists public.opportunity_research_conflicts (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  normalized_key text not null, conflict_type text not null default 'value_conflict', severity text not null default 'blocking' check (severity in ('informational','review','blocking')),
  values jsonb not null default '[]'::jsonb, evidence_ids uuid[] not null default '{}', status text not null default 'open' check (status in ('open','resolved','superseded')),
  resolution text not null default '', resolved_by uuid references auth.users(id) on delete set null, resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (session_id, normalized_key, conflict_type)
);
create index if not exists opportunity_research_conflicts_session_idx on public.opportunity_research_conflicts (session_id, status);

create table if not exists public.opportunity_source_change_events (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  previous_source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  current_source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  change_type text not null, impact_level text not null default 'review' check (impact_level in ('cosmetic','non_blocking','review','blocking')),
  changed_fields text[] not null default '{}', previous_values jsonb not null default '{}'::jsonb, current_values jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(), processed_at timestamptz, metadata jsonb not null default '{}'::jsonb
);
create index if not exists opportunity_source_change_events_opportunity_idx on public.opportunity_source_change_events (opportunity_id, detected_at desc);

create table if not exists public.opportunity_canonical_promotions (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  candidate_requirement_id uuid references public.opportunity_candidate_requirements(id) on delete set null,
  candidate_eligibility_rule_id uuid references public.opportunity_candidate_eligibility_rules(id) on delete set null,
  canonical_record_type text not null check (canonical_record_type in ('requirement','eligibility_rule','opportunity_fact')),
  canonical_record_id uuid, previous_value jsonb not null default '{}'::jsonb, promoted_value jsonb not null default '{}'::jsonb,
  promotion_reason text not null, idempotency_key text not null unique, promoted_by uuid not null references auth.users(id) on delete restrict,
  promoted_at timestamptz not null default now(), rolled_back_at timestamptz, rolled_back_by uuid references auth.users(id) on delete set null,
  rollback_reason text not null default ''
);

alter table public.application_packages
  add column if not exists package_version integer not null default 1,
  add column if not exists source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  add column if not exists requirement_version text not null default '', add column if not exists stale boolean not null default false,
  add column if not exists stale_reason text not null default '', add column if not exists stale_at timestamptz,
  add column if not exists prepared_at timestamptz, add column if not exists attachment_checksums jsonb not null default '{}'::jsonb;

create table if not exists public.application_package_versions (
  id uuid primary key default gen_random_uuid(), package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade, version integer not null check (version > 0),
  source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  requirement_snapshot jsonb not null default '[]'::jsonb, passport_snapshot jsonb not null default '{}'::jsonb,
  portfolio_snapshot jsonb not null default '[]'::jsonb, written_content jsonb not null default '{}'::jsonb,
  attachment_checksums jsonb not null default '{}'::jsonb, approval_confirmations jsonb not null default '{}'::jsonb,
  state text not null, stale boolean not null default false, created_at timestamptz not null default now(), unique (package_id, version)
);
create index if not exists application_package_versions_artist_idx on public.application_package_versions (artist_user_id, created_at desc);

create table if not exists public.external_connections (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, status text not null default 'disconnected' check (status in ('disconnected','pending','connected','expired','revoked','error')),
  scopes text[] not null default '{}', token_ciphertext bytea, refresh_token_ciphertext bytea, encryption_key_version text not null default '',
  token_expires_at timestamptz, provider_account_id text not null default '', provider_account_email text not null default '',
  connected_at timestamptz, disconnected_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (artist_user_id, provider)
);
create table if not exists public.gmail_drafts (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  provider_draft_id text not null default '', provider_message_id text not null default '', recipient text not null, subject text not null,
  body_hash text not null, attachment_checksums jsonb not null default '{}'::jsonb, content_snapshot jsonb not null default '{}'::jsonb,
  state text not null default 'creating' check (state in ('creating','draft','changed_externally','deleted_externally','ready_to_send','sent','failed')),
  idempotency_key text not null unique, created_at timestamptz not null default now(), synchronized_at timestamptz, sent_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists gmail_drafts_artist_idx on public.gmail_drafts (artist_user_id, created_at desc);
create table if not exists public.gmail_send_attempts (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  gmail_draft_id uuid not null references public.gmail_drafts(id) on delete cascade, idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','sent','failed','blocked','duplicate_prevented')),
  provider_message_id text not null default '', error_code text not null default '', error_message text not null default '',
  request_hash text not null default '', created_at timestamptz not null default now(), completed_at timestamptz
);

create table if not exists public.portal_provider_adapters (
  id uuid primary key default gen_random_uuid(), provider_key text not null unique, version text not null, enabled boolean not null default false,
  allowed_hosts text[] not null default '{}', capabilities jsonb not null default '{}'::jsonb, restricted_fields text[] not null default '{}',
  kill_switch boolean not null default true, configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.portal_assistance_sessions (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  adapter_id uuid references public.portal_provider_adapters(id) on delete set null, target_origin text not null,
  state text not null default 'created' check (state in ('created','mapping','artist_review','assisting','stopped_before_submit','completed','cancelled','failed')),
  field_mappings jsonb not null default '[]'::jsonb, restricted_fields_detected text[] not null default '{}',
  final_submission_performed boolean not null default false, provider_confirmation text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.kleio_audit_events (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
  artist_user_id uuid references auth.users(id) on delete set null, opportunity_id uuid references public.opportunities(id) on delete set null,
  research_session_id uuid references public.opportunity_research_sessions(id) on delete set null,
  package_id uuid references public.application_packages(id) on delete set null,
  event_name text not null, event_status text not null default 'recorded', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists kleio_audit_events_artist_idx on public.kleio_audit_events (artist_user_id, created_at desc);
create index if not exists kleio_audit_events_session_idx on public.kleio_audit_events (research_session_id, created_at);

create or replace function public.prevent_session_research_from_writing_canonical_requirements() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.research_session_id is not null or new.extraction_method = 'public_source_research' then
    raise exception 'Artist research findings must remain session-scoped and cannot be written directly to canonical requirements.';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_session_research_canonical_requirement_write on public.opportunity_requirements;
create trigger prevent_session_research_canonical_requirement_write before insert or update on public.opportunity_requirements for each row execute function public.prevent_session_research_from_writing_canonical_requirements();

create or replace function public.mark_application_packages_stale_on_requirement_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare target_opportunity_id uuid := coalesce(new.opportunity_id, old.opportunity_id);
begin
  update public.application_packages set stale = true, stale_reason = 'Canonical opportunity requirements changed after this package was prepared.', stale_at = now(),
    state = case when state in ('submitted','confirmed','artist_reported_submitted','withdrawn') then state else 'artist_review_required' end,
    updated_at = now()
  where opportunity_id = target_opportunity_id and created_at < now() and stale = false;
  return coalesce(new, old);
end;
$$;
drop trigger if exists mark_packages_stale_on_requirement_change on public.opportunity_requirements;
create trigger mark_packages_stale_on_requirement_change after insert or update or delete on public.opportunity_requirements for each row execute function public.mark_application_packages_stale_on_requirement_change();

create trigger set_opportunity_research_jobs_updated_at before update on public.opportunity_research_jobs for each row execute function public.set_updated_at();
create trigger set_opportunity_research_documents_updated_at before update on public.opportunity_research_documents for each row execute function public.set_updated_at();
create trigger set_opportunity_research_findings_updated_at before update on public.opportunity_research_findings for each row execute function public.set_updated_at();
create trigger set_opportunity_candidate_requirements_updated_at before update on public.opportunity_candidate_requirements for each row execute function public.set_updated_at();
create trigger set_opportunity_candidate_eligibility_updated_at before update on public.opportunity_candidate_eligibility_rules for each row execute function public.set_updated_at();
create trigger set_opportunity_research_conflicts_updated_at before update on public.opportunity_research_conflicts for each row execute function public.set_updated_at();
create trigger set_kleio_feature_flags_updated_at before update on public.kleio_feature_flags for each row execute function public.set_updated_at();
create trigger set_external_connections_updated_at before update on public.external_connections for each row execute function public.set_updated_at();
create trigger set_gmail_drafts_updated_at before update on public.gmail_drafts for each row execute function public.set_updated_at();
create trigger set_portal_provider_adapters_updated_at before update on public.portal_provider_adapters for each row execute function public.set_updated_at();
create trigger set_portal_assistance_sessions_updated_at before update on public.portal_assistance_sessions for each row execute function public.set_updated_at();

alter table public.kleio_feature_flags enable row level security;
alter table public.opportunity_research_jobs enable row level security;
alter table public.opportunity_source_versions enable row level security;
alter table public.opportunity_research_documents enable row level security;
alter table public.opportunity_research_document_pages enable row level security;
alter table public.opportunity_candidate_requirements enable row level security;
alter table public.opportunity_candidate_eligibility_rules enable row level security;
alter table public.opportunity_research_conflicts enable row level security;
alter table public.opportunity_source_change_events enable row level security;
alter table public.opportunity_canonical_promotions enable row level security;
alter table public.application_package_versions enable row level security;
alter table public.external_connections enable row level security;
alter table public.gmail_drafts enable row level security;
alter table public.gmail_send_attempts enable row level security;
alter table public.portal_provider_adapters enable row level security;
alter table public.portal_assistance_sessions enable row level security;
alter table public.kleio_audit_events enable row level security;

create policy "Authenticated users read feature flags" on public.kleio_feature_flags for select to authenticated using (true);
create policy "Admins manage feature flags" on public.kleio_feature_flags for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy "Artists read own research jobs" on public.opportunity_research_jobs for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Artists read own source versions" on public.opportunity_source_versions for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_source_versions.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read own research documents" on public.opportunity_research_documents for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_research_documents.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read own research document pages" on public.opportunity_research_document_pages for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_research_document_pages.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read own candidate requirements" on public.opportunity_candidate_requirements for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_candidate_requirements.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read own candidate eligibility" on public.opportunity_candidate_eligibility_rules for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_candidate_eligibility_rules.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read own research conflicts" on public.opportunity_research_conflicts for select to authenticated using (exists (select 1 from public.opportunity_research_sessions s where s.id = opportunity_research_conflicts.session_id and s.artist_user_id = (select auth.uid())));
create policy "Artists read relevant source changes" on public.opportunity_source_change_events for select to authenticated using (exists (select 1 from public.application_packages p where p.opportunity_id = opportunity_source_change_events.opportunity_id and p.artist_user_id = (select auth.uid())));
create policy "Admins read canonical promotions" on public.opportunity_canonical_promotions for select to authenticated using (public.is_kleio_admin());
create policy "Artists read own package versions" on public.application_package_versions for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Artists read own external connections" on public.external_connections for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Artists read own Gmail drafts" on public.gmail_drafts for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Artists read own Gmail send attempts" on public.gmail_send_attempts for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Authenticated users read enabled portal adapters" on public.portal_provider_adapters for select to authenticated using (enabled and not kill_switch);
create policy "Admins manage portal adapters" on public.portal_provider_adapters for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy "Artists read own portal assistance" on public.portal_assistance_sessions for select to authenticated using ((select auth.uid()) = artist_user_id);
create policy "Artists read own audit events" on public.kleio_audit_events for select to authenticated using ((select auth.uid()) = artist_user_id);

revoke all on public.opportunity_research_jobs, public.opportunity_source_versions, public.opportunity_research_documents, public.opportunity_research_document_pages, public.opportunity_candidate_requirements, public.opportunity_candidate_eligibility_rules, public.opportunity_research_conflicts, public.opportunity_source_change_events, public.opportunity_canonical_promotions, public.application_package_versions, public.external_connections, public.gmail_drafts, public.gmail_send_attempts, public.portal_provider_adapters, public.portal_assistance_sessions, public.kleio_audit_events from anon;
grant select on public.kleio_feature_flags to authenticated;
grant select on public.opportunity_research_jobs, public.opportunity_source_versions, public.opportunity_research_documents, public.opportunity_research_document_pages, public.opportunity_candidate_requirements, public.opportunity_candidate_eligibility_rules, public.opportunity_research_conflicts, public.opportunity_source_change_events, public.application_package_versions, public.external_connections, public.gmail_drafts, public.gmail_send_attempts, public.portal_provider_adapters, public.portal_assistance_sessions, public.kleio_audit_events to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
revoke insert, update, delete on public.opportunity_research_sessions from authenticated;
drop policy if exists "Artists create own opportunity research sessions" on public.opportunity_research_sessions;
revoke all on schema pgmq from public, anon, authenticated;
grant usage on schema pgmq to service_role;
grant execute on all functions in schema pgmq to service_role;
