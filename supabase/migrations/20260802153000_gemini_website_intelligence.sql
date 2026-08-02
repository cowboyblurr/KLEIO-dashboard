-- Gemini website evidence organization. Additive only; existing extraction and proposal behavior is preserved.

alter table public.artist_extraction_jobs
  add column if not exists action text not null default 'extract_material',
  add column if not exists provider text not null default '',
  add column if not exists model text not null default '',
  add column if not exists prompt_version text not null default '',
  add column if not exists schema_version text not null default '',
  add column if not exists input_hash text not null default '',
  add column if not exists website_import_session_id uuid references public.artist_website_import_sessions(id) on delete cascade,
  add column if not exists provider_request_id text not null default '',
  add column if not exists usage jsonb not null default '{}'::jsonb,
  add column if not exists latency_ms integer,
  add column if not exists cached_from_job_id uuid references public.artist_extraction_jobs(id) on delete set null;

alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_action_check,
  add constraint artist_extraction_jobs_action_check
    check (action in ('extract_material', 'organize_website_evidence')),
  drop constraint if exists artist_extraction_jobs_input_hash_check,
  add constraint artist_extraction_jobs_input_hash_check
    check (input_hash = '' or input_hash ~ '^[a-f0-9]{64}$'),
  drop constraint if exists artist_extraction_jobs_usage_object,
  add constraint artist_extraction_jobs_usage_object
    check (jsonb_typeof(usage) = 'object'),
  drop constraint if exists artist_extraction_jobs_latency_check,
  add constraint artist_extraction_jobs_latency_check
    check (latency_ms is null or latency_ms >= 0);

create index if not exists artist_extraction_jobs_website_ai_session_idx
  on public.artist_extraction_jobs (artist_user_id, website_import_session_id, created_at desc)
  where action = 'organize_website_evidence';

create index if not exists artist_extraction_jobs_website_ai_hash_idx
  on public.artist_extraction_jobs (artist_user_id, input_hash, created_at desc)
  where action = 'organize_website_evidence' and input_hash <> '';

alter table public.artist_ai_usage_events
  drop constraint if exists artist_ai_usage_events_action_check,
  add constraint artist_ai_usage_events_action_check
    check (action in ('analyze_practice', 'generate_draft', 'organize_website_evidence'));

comment on column public.artist_extraction_jobs.website_import_session_id is
  'Owner-scoped link to the deterministic website scan used for this extraction job.';
comment on column public.artist_extraction_jobs.input_hash is
  'Stable idempotency hash derived from artist, session, evidence, prompt, schema, model and action.';
comment on column public.artist_extraction_jobs.usage is
  'Provider usage metadata only; never stores prompts, API keys or full website evidence.';