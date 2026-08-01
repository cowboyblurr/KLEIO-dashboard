alter table public.artist_ai_drafts
  add column if not exists artist_review jsonb not null default '{}'::jsonb,
  add column if not exists provider_request_id text not null default '',
  add column if not exists usage jsonb not null default '{}'::jsonb,
  add column if not exists last_error_code text not null default '';

alter table public.artist_ai_drafts
  drop constraint if exists artist_ai_drafts_type_check;

alter table public.artist_ai_drafts
  add constraint artist_ai_drafts_type_check check (
    draft_type = any (array[
      'practice_analysis',
      'short_bio',
      'professional_bio',
      'artist_statement',
      'practice_description',
      'artwork_description',
      'series_description',
      'project_description',
      'submission_letter',
      'letter_of_interest',
      'application_answer',
      'exhibition_proposal_summary',
      'grant_residency_response'
    ])
  );

alter table public.artist_ai_drafts
  drop constraint if exists artist_ai_drafts_review_object,
  add constraint artist_ai_drafts_review_object check (jsonb_typeof(artist_review) = 'object'),
  drop constraint if exists artist_ai_drafts_usage_object,
  add constraint artist_ai_drafts_usage_object check (jsonb_typeof(usage) = 'object');

create table if not exists public.artist_ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  status text not null,
  provider text not null default '',
  model text not null default '',
  provider_request_id text not null default '',
  input_units bigint not null default 0,
  output_units bigint not null default 0,
  total_units bigint not null default 0,
  latency_ms integer,
  error_code text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint artist_ai_usage_events_action_check check (
    action = any (array['analyze_practice','generate_draft'])
  ),
  constraint artist_ai_usage_events_status_check check (
    status = any (array['succeeded','failed','cached','rejected'])
  ),
  constraint artist_ai_usage_events_nonnegative_units check (
    input_units >= 0 and output_units >= 0 and total_units >= 0
  ),
  constraint artist_ai_usage_events_latency_check check (
    latency_ms is null or latency_ms >= 0
  ),
  constraint artist_ai_usage_events_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

alter table public.artist_ai_usage_events enable row level security;

revoke all on table public.artist_ai_usage_events from anon;
revoke all on table public.artist_ai_usage_events from authenticated;
grant select on table public.artist_ai_usage_events to authenticated;

drop policy if exists "Artists can read their KLEIO Assist usage" on public.artist_ai_usage_events;
create policy "Artists can read their KLEIO Assist usage"
on public.artist_ai_usage_events
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

create index if not exists artist_ai_usage_events_owner_day_idx
  on public.artist_ai_usage_events (artist_user_id, action, created_at desc);

create index if not exists artist_ai_usage_events_provider_idx
  on public.artist_ai_usage_events (provider, model, created_at desc);
