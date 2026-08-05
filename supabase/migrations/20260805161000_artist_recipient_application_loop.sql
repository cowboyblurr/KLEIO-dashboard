begin;

alter table public.opportunities
  add column if not exists data_scope text not null default 'real';

alter table public.opportunities
  drop constraint if exists opportunities_data_scope_check;
alter table public.opportunities
  add constraint opportunities_data_scope_check
  check (data_scope in ('real', 'guided_demo', 'synthetic_test'));

alter table public.application_packages
  add column if not exists data_scope text not null default 'real';

alter table public.application_packages
  drop constraint if exists application_packages_data_scope_check;
alter table public.application_packages
  add constraint application_packages_data_scope_check
  check (data_scope in ('real', 'guided_demo', 'synthetic_test'));

create table if not exists public.application_recipient_access (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_hint text not null default '',
  approved_snapshot jsonb not null default '{}'::jsonb,
  visible_sections jsonb not null default '{}'::jsonb,
  activity_disclosure_version text not null default 'recipient_activity_v1',
  data_scope text not null default 'real',
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_recipient_access_token_hash_check check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint application_recipient_access_data_scope_check check (data_scope in ('real', 'guided_demo', 'synthetic_test')),
  constraint application_recipient_access_expiry_check check (expires_at > created_at)
);

create unique index if not exists application_recipient_access_active_package_idx
  on public.application_recipient_access(package_id)
  where revoked_at is null;
create index if not exists application_recipient_access_artist_idx
  on public.application_recipient_access(artist_user_id, created_at desc);
create index if not exists application_recipient_access_expiry_idx
  on public.application_recipient_access(expires_at)
  where revoked_at is null;

create table if not exists public.application_recipient_events (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.application_recipient_access(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  actor_kind text not null default 'guest',
  evidence_level text not null default 'system_observed',
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint application_recipient_events_event_type_check check (event_type in (
    'secure_link_opened',
    'application_page_viewed',
    'artwork_detail_opened',
    'cv_viewed',
    'individual_file_downloaded',
    'full_package_downloaded',
    'receipt_confirmed',
    'question_drafted',
    'recipient_email_verified',
    'conversation_started',
    'extended_profile_requested',
    'institution_signup_started',
    'institution_workspace_created',
    'access_expired',
    'access_revoked',
    'access_denied'
  )),
  constraint application_recipient_events_actor_kind_check check (actor_kind in ('guest', 'recipient', 'artist', 'system')),
  constraint application_recipient_events_evidence_level_check check (evidence_level in ('self_reported', 'system_observed', 'recipient_confirmed', 'provider_confirmed')),
  constraint application_recipient_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists application_recipient_events_package_idx
  on public.application_recipient_events(package_id, created_at desc);
create index if not exists application_recipient_events_access_idx
  on public.application_recipient_events(access_id, created_at desc);
create index if not exists application_recipient_events_artist_idx
  on public.application_recipient_events(artist_user_id, created_at desc);

create table if not exists public.application_recipient_identities (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.application_recipient_access(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  display_name text not null default '',
  organization_name text not null default '',
  identity_state text not null default 'email_unverified',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_recipient_identities_email_check check (email = lower(btrim(email)) and position('@' in email) > 1),
  constraint application_recipient_identities_state_check check (identity_state in (
    'email_unverified',
    'email_verified',
    'organization_provided',
    'institution_account_created',
    'institution_verified'
  ))
);

create unique index if not exists application_recipient_identities_access_email_idx
  on public.application_recipient_identities(access_id, email);
create unique index if not exists application_recipient_identities_access_auth_idx
  on public.application_recipient_identities(access_id, auth_user_id)
  where auth_user_id is not null;

create table if not exists public.application_recipient_message_drafts (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.application_recipient_access(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  recipient_email text not null,
  body text not null,
  draft_token_hash text not null unique,
  status text not null default 'prepared',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_recipient_message_drafts_email_check check (recipient_email = lower(btrim(recipient_email)) and position('@' in recipient_email) > 1),
  constraint application_recipient_message_drafts_body_check check (char_length(btrim(body)) between 1 and 4000),
  constraint application_recipient_message_drafts_token_hash_check check (draft_token_hash ~ '^[a-f0-9]{64}$'),
  constraint application_recipient_message_drafts_status_check check (status in ('prepared', 'verification_requested', 'sent', 'expired', 'cancelled'))
);

create index if not exists application_recipient_message_drafts_access_idx
  on public.application_recipient_message_drafts(access_id, created_at desc);

create table if not exists public.application_recipient_conversations (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_identity_id uuid not null references public.application_recipient_identities(id) on delete cascade,
  status text not null default 'active',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_recipient_conversations_status_check check (status in ('active', 'archived', 'blocked', 'reported')),
  unique (package_id, recipient_identity_id)
);

create index if not exists application_recipient_conversations_artist_idx
  on public.application_recipient_conversations(artist_user_id, last_message_at desc nulls last);

create table if not exists public.application_recipient_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.application_recipient_conversations(id) on delete cascade,
  sender_kind text not null,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_recipient_identity_id uuid references public.application_recipient_identities(id) on delete set null,
  body text not null,
  client_nonce uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint application_recipient_messages_sender_kind_check check (sender_kind in ('artist', 'recipient')),
  constraint application_recipient_messages_body_check check (char_length(btrim(body)) between 1 and 4000),
  constraint application_recipient_messages_sender_check check (
    (sender_kind = 'artist' and sender_user_id is not null and sender_recipient_identity_id is null)
    or
    (sender_kind = 'recipient' and sender_user_id is null and sender_recipient_identity_id is not null)
  ),
  unique (conversation_id, client_nonce)
);

create index if not exists application_recipient_messages_conversation_idx
  on public.application_recipient_messages(conversation_id, created_at, id);

create table if not exists public.application_extended_profile_requests (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.application_recipient_access(id) on delete cascade,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_identity_id uuid references public.application_recipient_identities(id) on delete set null,
  status text not null default 'requested',
  requested_sections text[] not null default '{}',
  artist_decision_note text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_extended_profile_requests_status_check check (status in ('requested', 'approved', 'denied', 'revoked'))
);

create unique index if not exists application_extended_profile_requests_unique_pending_idx
  on public.application_extended_profile_requests(access_id, recipient_identity_id)
  where status = 'requested';

alter table public.application_recipient_access enable row level security;
alter table public.application_recipient_events enable row level security;
alter table public.application_recipient_identities enable row level security;
alter table public.application_recipient_message_drafts enable row level security;
alter table public.application_recipient_conversations enable row level security;
alter table public.application_recipient_messages enable row level security;
alter table public.application_extended_profile_requests enable row level security;

drop policy if exists "Artists manage own recipient access" on public.application_recipient_access;
create policy "Artists manage own recipient access"
on public.application_recipient_access
for all
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists read own recipient events" on public.application_recipient_events;
create policy "Artists read own recipient events"
on public.application_recipient_events
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists read recipient identities for own packages" on public.application_recipient_identities;
create policy "Artists read recipient identities for own packages"
on public.application_recipient_identities
for select
to authenticated
using (
  exists (
    select 1 from public.application_packages package_row
    where package_row.id = application_recipient_identities.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
);

drop policy if exists "Recipients read own verified identity" on public.application_recipient_identities;
create policy "Recipients read own verified identity"
on public.application_recipient_identities
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists "Artists read own recipient conversations" on public.application_recipient_conversations;
create policy "Artists read own recipient conversations"
on public.application_recipient_conversations
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Recipients read own application conversations" on public.application_recipient_conversations;
create policy "Recipients read own application conversations"
on public.application_recipient_conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.application_recipient_identities identity_row
    where identity_row.id = application_recipient_conversations.recipient_identity_id
      and identity_row.auth_user_id = (select auth.uid())
      and identity_row.verified_at is not null
  )
);

drop policy if exists "Artists read own recipient messages" on public.application_recipient_messages;
create policy "Artists read own recipient messages"
on public.application_recipient_messages
for select
to authenticated
using (
  exists (
    select 1 from public.application_recipient_conversations conversation_row
    where conversation_row.id = application_recipient_messages.conversation_id
      and conversation_row.artist_user_id = (select auth.uid())
  )
);

drop policy if exists "Artists send own recipient replies" on public.application_recipient_messages;
create policy "Artists send own recipient replies"
on public.application_recipient_messages
for insert
to authenticated
with check (
  sender_kind = 'artist'
  and sender_user_id = (select auth.uid())
  and sender_recipient_identity_id is null
  and exists (
    select 1 from public.application_recipient_conversations conversation_row
    where conversation_row.id = application_recipient_messages.conversation_id
      and conversation_row.artist_user_id = (select auth.uid())
      and conversation_row.status = 'active'
  )
);

drop policy if exists "Recipients read own application messages" on public.application_recipient_messages;
create policy "Recipients read own application messages"
on public.application_recipient_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.application_recipient_conversations conversation_row
    join public.application_recipient_identities identity_row
      on identity_row.id = conversation_row.recipient_identity_id
    where conversation_row.id = application_recipient_messages.conversation_id
      and identity_row.auth_user_id = (select auth.uid())
      and identity_row.verified_at is not null
  )
);

drop policy if exists "Artists manage own extended profile requests" on public.application_extended_profile_requests;
create policy "Artists manage own extended profile requests"
on public.application_extended_profile_requests
for all
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

drop policy if exists "Recipients read own extended profile requests" on public.application_extended_profile_requests;
create policy "Recipients read own extended profile requests"
on public.application_extended_profile_requests
for select
to authenticated
using (
  exists (
    select 1 from public.application_recipient_identities identity_row
    where identity_row.id = application_extended_profile_requests.recipient_identity_id
      and identity_row.auth_user_id = (select auth.uid())
      and identity_row.verified_at is not null
  )
);

revoke all on public.application_recipient_access from anon;
revoke all on public.application_recipient_events from anon;
revoke all on public.application_recipient_identities from anon;
revoke all on public.application_recipient_message_drafts from anon;
revoke all on public.application_recipient_conversations from anon;
revoke all on public.application_recipient_messages from anon;
revoke all on public.application_extended_profile_requests from anon;
revoke all on public.application_recipient_message_drafts from authenticated;

grant select, insert, update, delete on public.application_recipient_access to authenticated;
grant select on public.application_recipient_events to authenticated;
grant select on public.application_recipient_identities to authenticated;
grant select on public.application_recipient_conversations to authenticated;
grant select, insert on public.application_recipient_messages to authenticated;
grant select, insert, update on public.application_extended_profile_requests to authenticated;

create or replace function public.sync_application_package_data_scope()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  select opportunity.data_scope
  into new.data_scope
  from public.opportunities opportunity
  where opportunity.id = new.opportunity_id;
  new.data_scope := coalesce(new.data_scope, 'real');
  return new;
end;
$$;

revoke all on function public.sync_application_package_data_scope() from public;
revoke all on function public.sync_application_package_data_scope() from anon;
grant execute on function public.sync_application_package_data_scope() to authenticated;

drop trigger if exists sync_application_package_data_scope_trigger on public.application_packages;
create trigger sync_application_package_data_scope_trigger
before insert or update of opportunity_id on public.application_packages
for each row execute function public.sync_application_package_data_scope();

with source_row as (
  insert into public.opportunity_sources (
    slug, name, base_domain, source_type, ingestion_method, license,
    commercial_reuse_allowed, attribution_required, update_frequency, active, terms_reviewed_at
  ) values (
    'kleio-internal-practice-test', 'KLEIO Internal Practice Test', 'kleio.internal',
    'manual_curation', 'internal_creation', 'Internal synthetic testing only',
    false, false, 'manual', true, now()
  )
  on conflict (slug) do update set name = excluded.name, active = true, updated_at = now()
  returning id
), resolved_source as (
  select id from source_row
  union all
  select id from public.opportunity_sources where slug = 'kleio-internal-practice-test'
  limit 1
), opportunity_row as (
  insert into public.opportunities (
    source_id, external_id, canonical_url, application_url, guidelines_url,
    title, original_title, provider_name, provider_id, opportunity_type,
    summary, description, disciplines, eligible_applicant_types, eligible_countries,
    career_stages, award_min, award_max, currency, application_fee,
    deadline_at, deadline_timezone, required_materials, application_mode, status,
    verification_status, institutional_verification_level, financial_terms_verified,
    rights_terms_verified, lifecycle_status, submission_method, submission_email,
    contact_email, submission_instructions, source_language, data_scope,
    verification_confidence, verification_method, last_verified_at
  )
  select
    resolved_source.id,
    'kleio-practice-submission-test-v1',
    'https://kleio.internal/practice-submission-test', '', '',
    'KLEIO Independent Practice Submission Test',
    'KLEIO Independent Practice Submission Test',
    'KLEIO Internal Workflow Lab', 'kleio-internal-workflow-lab', 'grant',
    'A synthetic email-submission opportunity for testing KLEIO application preparation, recipient review, and conversation continuity.',
    'INTERNAL WORKFLOW TEST — NOT A REAL GRANT. Theme: New Forms of Memory. This synthetic program explores memory, personal archives, inherited histories, material transformation, and how artists translate evidence across generations. Selection priorities: a clear relationship between the proposed or selected work and the stated theme; complete artwork metadata; concise professional communication; and artist-controlled use of Creative Passport evidence. No funding, exhibition, residency, award, or institutional endorsement will be provided.',
    array['visual_arts', 'photography', 'film', 'sculpture', 'installation'],
    array['individual_artist'], array['worldwide'], array['emerging', 'mid_career', 'established'],
    2500, 2500, 'USD', 0,
    '2026-12-31 23:59:00+00', 'UTC',
    array['Artist biography', 'Artist statement', 'Curriculum vitae (CV)', 'Three selected artworks', 'Opportunity-specific response', 'Optional supporting link'],
    'external', 'open', 'kleio_reviewed', 'official_source_plus_terms', false, false,
    'published', 'email', 'luminaryblur@gmail.com', 'luminaryblur@gmail.com',
    'Email the approved application package to luminaryblur@gmail.com. This inbox is an internal KLEIO testing destination. Include the secure KLEIO review link and attach the files listed in the final checklist.',
    'en', 'synthetic_test', 1, 'internal_synthetic_fixture', now()
  from resolved_source
  on conflict (source_id, external_id) do update set
    title = excluded.title,
    summary = excluded.summary,
    description = excluded.description,
    required_materials = excluded.required_materials,
    deadline_at = excluded.deadline_at,
    status = 'open',
    submission_method = 'email',
    submission_email = 'luminaryblur@gmail.com',
    contact_email = 'luminaryblur@gmail.com',
    submission_instructions = excluded.submission_instructions,
    data_scope = 'synthetic_test',
    updated_at = now(),
    last_verified_at = now()
  returning id, source_id
), resolved_opportunity as (
  select id, source_id from opportunity_row
  union all
  select opportunity.id, opportunity.source_id
  from public.opportunities opportunity
  join public.opportunity_sources source on source.id = opportunity.source_id
  where source.slug = 'kleio-internal-practice-test'
    and opportunity.external_id = 'kleio-practice-submission-test-v1'
  limit 1
)
insert into public.opportunity_source_snapshots (
  opportunity_id, source_id, fetched_at, raw_data, checksum, is_current
)
select
  resolved_opportunity.id,
  resolved_opportunity.source_id,
  now(),
  jsonb_build_object(
    'document_type', 'synthetic_scanned_opportunity',
    'test_only', true,
    'title', 'KLEIO Independent Practice Submission Test',
    'theme', 'New Forms of Memory',
    'submission_email', 'luminaryblur@gmail.com',
    'submission_email_evidence', 'Applications must be emailed to luminaryblur@gmail.com.',
    'requirements_as_scanned', jsonb_build_array(
      'Artist biography', 'Artist statement', 'CV', 'Curriculum vitae',
      'Three selected artworks with title, year, medium/materials, dimensions and image',
      'A 300-word response connecting the work to memory, archives or inherited histories',
      'Optional supporting link'
    ),
    'notice', 'This is a synthetic internal workflow test and not a real opportunity.'
  ),
  encode(digest('kleio-practice-submission-test-v1', 'sha256'), 'hex'),
  true
from resolved_opportunity
where not exists (
  select 1 from public.opportunity_source_snapshots existing
  where existing.opportunity_id = resolved_opportunity.id
    and existing.checksum = encode(digest('kleio-practice-submission-test-v1', 'sha256'), 'hex')
);

with target as (
  select opportunity.id
  from public.opportunities opportunity
  join public.opportunity_sources source on source.id = opportunity.source_id
  where source.slug = 'kleio-internal-practice-test'
    and opportunity.external_id = 'kleio-practice-submission-test-v1'
  limit 1
), requirement_seed(material_key, label, category, passport_field, input_type, minimum_word_count, maximum_word_count, minimum_item_count, maximum_item_count, source_text, source_location, sort_order) as (
  values
    ('biography', 'Artist biography', 'biography', 'bio', 'text', null::integer, 200, null::integer, null::integer, 'Include a concise artist biography.', 'Synthetic scan · Required materials', 10),
    ('artist_statement', 'Artist statement', 'artist_statement', 'artist_statement', 'text', null::integer, 500, null::integer, null::integer, 'Include an artist statement.', 'Synthetic scan · Required materials', 20),
    ('cv', 'Artist CV', 'cv', 'cv', 'document', null::integer, null::integer, null::integer, null::integer, 'Include a CV / curriculum vitae. The scanned source repeats both terms; KLEIO should present one normalized requirement.', 'Synthetic scan · Required materials', 30),
    ('portfolio', 'Three selected artworks', 'portfolio', 'portfolio', 'media_selection', null::integer, null::integer, 3, 3, 'Submit three selected artworks with images and complete metadata.', 'Synthetic scan · Required materials', 40),
    ('application_question', 'Opportunity-specific response', 'application_question', 'project_proposal', 'long_text', 100, 300, null::integer, null::integer, 'In 300 words or fewer, explain how the selected work relates to memory, archives, inherited histories, or material transformation.', 'Synthetic scan · Application question', 50),
    ('supporting_link', 'Optional supporting link', 'supporting_link', 'website_url', 'url', null::integer, null::integer, null::integer, null::integer, 'Optional: include one supporting website or project link.', 'Synthetic scan · Optional materials', 60)
)
insert into public.opportunity_requirements (
  opportunity_id, material_key, label, required, source_text, source_url,
  extraction_method, verification_status, sort_order, category, description,
  source_location, passport_field, input_type, minimum_word_count,
  maximum_word_count, minimum_item_count, maximum_item_count, accepted_file_types,
  maximum_file_size_bytes, requires_artist_confirmation, confidence_score,
  confidence_status, confidence_reason, normalized_interpretation
)
select
  target.id,
  requirement_seed.material_key,
  requirement_seed.label,
  requirement_seed.material_key <> 'supporting_link',
  requirement_seed.source_text,
  'https://kleio.internal/practice-submission-test',
  'manual_review', 'confirmed', requirement_seed.sort_order,
  requirement_seed.category, requirement_seed.source_text, requirement_seed.source_location,
  requirement_seed.passport_field, requirement_seed.input_type,
  requirement_seed.minimum_word_count, requirement_seed.maximum_word_count,
  requirement_seed.minimum_item_count, requirement_seed.maximum_item_count,
  case when requirement_seed.material_key = 'cv' then array['application/pdf'] else '{}'::text[] end,
  case when requirement_seed.material_key = 'cv' then 15728640 else null end,
  requirement_seed.material_key = 'application_question',
  1, 'verified', 'Synthetic fixture authored by KLEIO for internal workflow testing.',
  requirement_seed.label
from target
cross join requirement_seed
on conflict (opportunity_id, material_key) do update set
  label = excluded.label,
  required = excluded.required,
  source_text = excluded.source_text,
  source_location = excluded.source_location,
  category = excluded.category,
  passport_field = excluded.passport_field,
  input_type = excluded.input_type,
  minimum_word_count = excluded.minimum_word_count,
  maximum_word_count = excluded.maximum_word_count,
  minimum_item_count = excluded.minimum_item_count,
  maximum_item_count = excluded.maximum_item_count,
  accepted_file_types = excluded.accepted_file_types,
  maximum_file_size_bytes = excluded.maximum_file_size_bytes,
  verification_status = 'confirmed',
  confidence_status = 'verified',
  confidence_score = 1,
  updated_at = now();

insert into public.kleio_feature_flags (key, enabled, rollout, description)
values (
  'artist_recipient_application_loop',
  true,
  jsonb_build_object('scope', 'synthetic_test', 'opportunity_external_id', 'kleio-practice-submission-test-v1'),
  'Enables the secure recipient-review and submission-specific conversation loop for the clearly labeled synthetic practice opportunity.'
)
on conflict (key) do update set
  enabled = true,
  rollout = excluded.rollout,
  description = excluded.description,
  updated_at = now();

commit;
