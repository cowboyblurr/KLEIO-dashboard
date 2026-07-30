create table if not exists public.artist_passport_drafts (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  draft_kind text not null default 'creative_passport' check (draft_kind in ('creative_passport','import_review','voice_transcript','opportunity_questions')),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  client_updated_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artist_passport_drafts enable row level security;
create policy artist_passport_drafts_manage_own on public.artist_passport_drafts
  for all to authenticated using ((select auth.uid()) = artist_user_id) with check ((select auth.uid()) = artist_user_id);
grant select, insert, update, delete on public.artist_passport_drafts to authenticated;
create index if not exists artist_passport_drafts_expiry_idx on public.artist_passport_drafts(expires_at);

create table if not exists public.artist_import_sources (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('pdf','pasted_text','website','voice_transcript')),
  label text not null default '',
  storage_path text not null default '',
  external_url text not null default '' check (external_url = '' or external_url ~ '^https://'),
  mime_type text not null default '',
  byte_size bigint check (byte_size is null or byte_size between 0 and 15728640),
  checksum text not null default '',
  extraction_status text not null default 'pending' check (extraction_status in ('pending','processing','completed','partial','source_unavailable','failed')),
  extraction_method text not null default 'deterministic_v1',
  extracted_at timestamptz,
  retention_until timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_user_id, checksum)
);

alter table public.artist_import_sources enable row level security;
create policy artist_import_sources_manage_own on public.artist_import_sources
  for all to authenticated using ((select auth.uid()) = artist_user_id) with check ((select auth.uid()) = artist_user_id);
grant select, insert, update, delete on public.artist_import_sources to authenticated;
create index if not exists artist_import_sources_owner_updated_idx on public.artist_import_sources(artist_user_id, updated_at desc);
create index if not exists artist_import_sources_retention_idx on public.artist_import_sources(retention_until);

create table if not exists public.artist_import_proposals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.artist_import_sources(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  target_field text not null check (target_field in ('professional_name','location','bio','artist_statement','practice_description','website_url','disciplines','mediums','languages','education','exhibition_history','awards','reusable_answer')),
  proposed_value text not null check (char_length(proposed_value) between 1 and 20000),
  evidence_excerpt text not null default '' check (char_length(evidence_excerpt) <= 1200),
  page_number integer check (page_number is null or page_number > 0),
  extraction_method text not null default 'deterministic_v1',
  confidence numeric check (confidence is null or confidence between 0 and 1),
  status text not null default 'proposed' check (status in ('proposed','approved','edited_approved','rejected','deferred','conflicting','needs_clarification','source_unavailable','extraction_failed')),
  artist_edited_value text not null default '' check (char_length(artist_edited_value) <= 20000),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artist_import_proposals enable row level security;
create policy artist_import_proposals_manage_own on public.artist_import_proposals
  for all to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check (
    (select auth.uid()) = artist_user_id
    and exists (
      select 1 from public.artist_import_sources source_row
      where source_row.id = source_id and source_row.artist_user_id = (select auth.uid())
    )
  );
grant select, insert, update, delete on public.artist_import_proposals to authenticated;
create index if not exists artist_import_proposals_review_idx on public.artist_import_proposals(artist_user_id, status, created_at desc);

create or replace function public.sanitize_product_event_metadata(input jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(input, '{}'::jsonb)
    - array['biography','bio','artist_statement','cv','cv_contents','transcript','voice_transcript','portfolio_description','query','search_query','text','content','body','email','name'];
$$;

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  anonymous_session_id uuid,
  event_name text not null check (event_name in (
    'landing_viewed','carousel_viewed','carousel_manual_advanced','carousel_card_selected','explore_opportunities_selected','creative_passport_selected','institution_section_viewed','institution_signup_selected','login_selected',
    'public_directory_viewed','search_performed','filter_applied','opportunity_opened','official_source_opened','check_fit_selected','save_selected','prepare_selected','signup_prompted',
    'signup_started','signup_submitted','signup_validation_failed','account_created','confirmation_required','confirmation_completed','opportunity_restoration_completed','opportunity_restoration_failed',
    'passport_mode_selected','guided_step_completed','guided_step_skipped','import_started','import_completed','proposal_approved','proposal_rejected','voice_capability_detected','voice_started','voice_completed','autosave_succeeded','autosave_failed','draft_restored','conflict_detected'
  )),
  surface text not null default '' check (char_length(surface) <= 80),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint product_events_metadata_sanitized check (metadata = public.sanitize_product_event_metadata(metadata)),
  constraint product_events_actor_scope check (actor_user_id is null or actor_user_id = auth.uid())
);

alter table public.product_events enable row level security;
create policy product_events_insert_anon on public.product_events for insert to anon with check (actor_user_id is null);
create policy product_events_insert_authenticated on public.product_events for insert to authenticated with check (actor_user_id is null or actor_user_id = (select auth.uid()));
create policy product_events_admin_read on public.product_events for select to authenticated using (private.is_kleio_admin());
grant insert on public.product_events to anon, authenticated;
grant select on public.product_events to authenticated;
grant usage, select on sequence public.product_events_id_seq to anon, authenticated;
create index if not exists product_events_name_created_idx on public.product_events(event_name, created_at desc);
create index if not exists product_events_opportunity_created_idx on public.product_events(opportunity_id, created_at desc) where opportunity_id is not null;

create or replace function public.get_public_opportunity_carousel(limit_count integer default 8)
returns table (
  id uuid, title text, provider_name text, opportunity_type text, summary text, deadline_at timestamptz,
  participation_format text, locations text[], remote_allowed boolean, award_min numeric, award_max numeric,
  currency text, funding_display_text text, application_fee numeric, application_fee_currency text,
  disciplines text[], verification_status text, last_verified_at timestamptz, created_at timestamptz,
  preview_image_url text, preview_image_path text, preview_image_alt_text text, source_name text
)
language sql stable security invoker set search_path = '' as $$
  with eligible as (
    select opportunity_row.*, source_row.name as source_name,
      row_number() over (
        partition by opportunity_row.opportunity_type
        order by coalesce(opportunity_row.last_verified_at, opportunity_row.updated_at, opportunity_row.created_at) desc,
                 opportunity_row.deadline_at asc nulls last, opportunity_row.id
      ) as type_rank
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id and source_row.active
    where opportunity_row.status in ('open','upcoming','forecasted')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
      and opportunity_row.verification_status in ('official_source','provider_verified','kleio_reviewed','source_attributed')
      and opportunity_row.lifecycle_status in ('published','updated','closing_soon','verified')
      and nullif(btrim(opportunity_row.title), '') is not null
      and nullif(btrim(opportunity_row.provider_name), '') is not null
      and (nullif(btrim(opportunity_row.canonical_url), '') is not null or nullif(btrim(opportunity_row.guidelines_url), '') is not null)
  ), diversified as (
    select * from eligible where type_rank <= 2
    order by case when nullif(btrim(preview_image_url), '') is not null or nullif(btrim(preview_image_path), '') is not null then 0 else 1 end,
      coalesce(last_verified_at, updated_at, created_at) desc, deadline_at asc nulls last, id
  )
  select diversified.id, diversified.title, diversified.provider_name, diversified.opportunity_type,
    diversified.summary, diversified.deadline_at, diversified.participation_format, diversified.locations,
    diversified.remote_allowed, diversified.award_min, diversified.award_max, diversified.currency,
    diversified.funding_display_text, diversified.application_fee, diversified.application_fee_currency,
    diversified.disciplines, diversified.verification_status, diversified.last_verified_at,
    diversified.created_at, diversified.preview_image_url, diversified.preview_image_path,
    diversified.preview_image_alt_text, diversified.source_name
  from diversified limit greatest(1, least(coalesce(limit_count, 8), 12));
$$;

grant execute on function public.get_public_opportunity_carousel(integer) to anon, authenticated;
comment on table public.artist_passport_drafts is 'Owner-scoped, expiring remote drafts used for Creative Passport autosave and conflict recovery.';
comment on table public.artist_import_proposals is 'Reviewable field proposals extracted from untrusted artist-provided sources; no proposal is applied without artist approval.';
comment on table public.product_events is 'First-party product funnel events. Creative text, transcripts, CV contents, portfolio descriptions, email, names, and raw search text are forbidden by constraint.';
comment on function public.get_public_opportunity_carousel(integer) is 'Returns a small, verified, diverse public opportunity preview for the landing page without exposing internal research records.';
