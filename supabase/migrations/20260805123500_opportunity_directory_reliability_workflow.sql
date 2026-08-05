begin;

alter table public.opportunities drop constraint if exists opportunities_verification_status_check;
alter table public.opportunities
  add constraint opportunities_verification_status_check
  check (verification_status = any (array[
    'unreviewed'::text,
    'official_source'::text,
    'provider_published'::text,
    'provider_verified'::text,
    'kleio_reviewed'::text,
    'source_attributed'::text,
    'needs_review'::text,
    'rejected'::text,
    'expired'::text
  ]));

create table if not exists public.artist_hidden_opportunities (
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (artist_user_id, opportunity_id)
);

alter table public.artist_hidden_opportunities enable row level security;

drop policy if exists artist_hidden_opportunities_select_own on public.artist_hidden_opportunities;
create policy artist_hidden_opportunities_select_own
on public.artist_hidden_opportunities for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists artist_hidden_opportunities_insert_own on public.artist_hidden_opportunities;
create policy artist_hidden_opportunities_insert_own
on public.artist_hidden_opportunities for insert
to authenticated
with check ((select auth.uid()) = artist_user_id);

drop policy if exists artist_hidden_opportunities_delete_own on public.artist_hidden_opportunities;
create policy artist_hidden_opportunities_delete_own
on public.artist_hidden_opportunities for delete
to authenticated
using ((select auth.uid()) = artist_user_id);

revoke all on public.artist_hidden_opportunities from anon;
grant select, insert, delete on public.artist_hidden_opportunities to authenticated;

create table if not exists public.opportunity_reports (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  reason text not null check (reason = any (array[
    'deadline_incorrect'::text,
    'closed'::text,
    'broken_link'::text,
    'funding_inaccurate'::text,
    'eligibility_inaccurate'::text,
    'possible_scam'::text,
    'rights_concern'::text,
    'unexpected_fee'::text,
    'match_incorrect'::text,
    'duplicate'::text,
    'other'::text
  ])),
  notes text not null default '' check (char_length(notes) <= 2000),
  status text not null default 'open' check (status = any (array['open'::text,'reviewing'::text,'resolved'::text,'dismissed'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text not null default '' check (char_length(resolution_notes) <= 4000)
);

create index if not exists opportunity_reports_open_queue_idx
  on public.opportunity_reports (status, created_at desc)
  where status in ('open','reviewing');
create index if not exists opportunity_reports_opportunity_idx
  on public.opportunity_reports (opportunity_id, status);
create unique index if not exists opportunity_reports_artist_open_unique
  on public.opportunity_reports (artist_user_id, opportunity_id, reason)
  where status in ('open','reviewing');

alter table public.opportunity_reports enable row level security;

drop policy if exists opportunity_reports_select_own_or_admin on public.opportunity_reports;
create policy opportunity_reports_select_own_or_admin
on public.opportunity_reports for select
to authenticated
using ((select auth.uid()) = artist_user_id or private.is_kleio_admin());

drop policy if exists opportunity_reports_insert_own on public.opportunity_reports;
create policy opportunity_reports_insert_own
on public.opportunity_reports for insert
to authenticated
with check ((select auth.uid()) = artist_user_id and status = 'open');

drop policy if exists opportunity_reports_admin_update on public.opportunity_reports;
create policy opportunity_reports_admin_update
on public.opportunity_reports for update
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

revoke all on public.opportunity_reports from anon;
grant select, insert, update on public.opportunity_reports to authenticated;

create table if not exists public.opportunity_review_audit (
  id bigint generated always as identity primary key,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text not null,
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists opportunity_review_audit_opportunity_idx
  on public.opportunity_review_audit (opportunity_id, created_at desc);

alter table public.opportunity_review_audit enable row level security;

drop policy if exists opportunity_review_audit_admin_select on public.opportunity_review_audit;
create policy opportunity_review_audit_admin_select
on public.opportunity_review_audit for select
to authenticated
using (private.is_kleio_admin());

revoke all on public.opportunity_review_audit from anon, authenticated;
grant select on public.opportunity_review_audit to authenticated;

create or replace function public.search_my_opportunities_v3(
  search_query text default null,
  opportunity_types text[] default null,
  source_slugs text[] default null,
  applicant_types text[] default null,
  eligible_country text default null,
  participation_formats text[] default null,
  discipline_filters text[] default null,
  career_stage_filters text[] default null,
  deadline_from timestamptz default null,
  deadline_to timestamptz default null,
  minimum_funding numeric default null,
  funding_known_only boolean default false,
  structured_requirements_only boolean default false,
  no_fee_only boolean default false,
  external_only boolean default false,
  limit_count integer default 24,
  offset_count integer default 0
)
returns setof public.opportunities
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  opportunity_row public.opportunities%rowtype;
  chunk_offset integer := 0;
  chunk_count integer;
  visible_index integer := 0;
  emitted_count integer := 0;
  requested_limit integer := greatest(1, least(coalesce(limit_count, 24), 100));
  requested_offset integer := greatest(coalesce(offset_count, 0), 0);
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'authenticated_artist_required';
  end if;

  loop
    chunk_count := 0;
    for opportunity_row in
      select *
      from public.search_opportunities_v2(
        search_query,
        opportunity_types,
        source_slugs,
        applicant_types,
        eligible_country,
        participation_formats,
        discipline_filters,
        career_stage_filters,
        deadline_from,
        deadline_to,
        minimum_funding,
        funding_known_only,
        structured_requirements_only,
        no_fee_only,
        external_only,
        100,
        chunk_offset
      )
    loop
      chunk_count := chunk_count + 1;
      if opportunity_row.lifecycle_status = any (array['verified'::text,'published'::text,'updated'::text,'closing_soon'::text])
        and opportunity_row.verification_status = any (array['official_source'::text,'provider_published'::text,'provider_verified'::text,'kleio_reviewed'::text])
        and opportunity_row.last_verified_at is not null
        and nullif(trim(opportunity_row.provider_name), '') is not null
        and (
          nullif(trim(opportunity_row.canonical_url), '') is not null
          or nullif(trim(opportunity_row.application_url), '') is not null
          or nullif(trim(opportunity_row.submission_email), '') is not null
        )
        and not exists (
          select 1
          from public.artist_hidden_opportunities hidden_row
          where hidden_row.artist_user_id = (select auth.uid())
            and hidden_row.opportunity_id = opportunity_row.id
        )
      then
        if visible_index >= requested_offset then
          return next opportunity_row;
          emitted_count := emitted_count + 1;
          if emitted_count >= requested_limit then return; end if;
        end if;
        visible_index := visible_index + 1;
      end if;
    end loop;
    exit when chunk_count < 100 or chunk_offset >= 4900;
    chunk_offset := chunk_offset + 100;
  end loop;
  return;
end;
$$;

create or replace function public.count_my_opportunities_v3(
  search_query text default null,
  opportunity_types text[] default null,
  source_slugs text[] default null,
  applicant_types text[] default null,
  eligible_country text default null,
  participation_formats text[] default null,
  discipline_filters text[] default null,
  career_stage_filters text[] default null,
  deadline_from timestamptz default null,
  deadline_to timestamptz default null,
  minimum_funding numeric default null,
  funding_known_only boolean default false,
  structured_requirements_only boolean default false,
  no_fee_only boolean default false,
  external_only boolean default false
)
returns integer
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  opportunity_row public.opportunities%rowtype;
  chunk_offset integer := 0;
  chunk_count integer;
  visible_count integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'authenticated_artist_required';
  end if;

  loop
    chunk_count := 0;
    for opportunity_row in
      select *
      from public.search_opportunities_v2(
        search_query,
        opportunity_types,
        source_slugs,
        applicant_types,
        eligible_country,
        participation_formats,
        discipline_filters,
        career_stage_filters,
        deadline_from,
        deadline_to,
        minimum_funding,
        funding_known_only,
        structured_requirements_only,
        no_fee_only,
        external_only,
        100,
        chunk_offset
      )
    loop
      chunk_count := chunk_count + 1;
      if opportunity_row.lifecycle_status = any (array['verified'::text,'published'::text,'updated'::text,'closing_soon'::text])
        and opportunity_row.verification_status = any (array['official_source'::text,'provider_published'::text,'provider_verified'::text,'kleio_reviewed'::text])
        and opportunity_row.last_verified_at is not null
        and nullif(trim(opportunity_row.provider_name), '') is not null
        and (
          nullif(trim(opportunity_row.canonical_url), '') is not null
          or nullif(trim(opportunity_row.application_url), '') is not null
          or nullif(trim(opportunity_row.submission_email), '') is not null
        )
        and not exists (
          select 1
          from public.artist_hidden_opportunities hidden_row
          where hidden_row.artist_user_id = (select auth.uid())
            and hidden_row.opportunity_id = opportunity_row.id
        )
      then
        visible_count := visible_count + 1;
      end if;
    end loop;
    exit when chunk_count < 100 or chunk_offset >= 4900;
    chunk_offset := chunk_offset + 100;
  end loop;
  return visible_count;
end;
$$;

revoke all on function public.search_my_opportunities_v3(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer) from public, anon;
grant execute on function public.search_my_opportunities_v3(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer) to authenticated;
revoke all on function public.count_my_opportunities_v3(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean) from public, anon;
grant execute on function public.count_my_opportunities_v3(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.get_kleio_opportunity_review_queue(
  queue_filter text default 'needs_attention',
  limit_count integer default 50,
  offset_count integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_kleio_admin() then
    raise exception using errcode = '42501', message = 'kleio_admin_required';
  end if;

  if queue_filter not in ('needs_attention','reports','verification','financial','rights','translation','reverify','duplicates','rejected','all') then
    raise exception using errcode = '22023', message = 'invalid_opportunity_queue_filter';
  end if;

  with candidate as (
    select
      opportunity_row.*,
      source_row.name as source_name,
      source_row.active as source_active,
      coalesce(report_summary.open_reports, 0) as open_reports,
      array_remove(array[
        case when opportunity_row.verification_status in ('unreviewed','source_attributed','needs_review') then 'verification' end,
        case when opportunity_row.lifecycle_status in ('discovered','needs_verification','source_unavailable','verification_expired') then 'lifecycle' end,
        case when opportunity_row.financial_terms_verified is false then 'financial' end,
        case when opportunity_row.rights_terms_verified is false then 'rights' end,
        case when opportunity_row.human_translation_review_required is true then 'translation' end,
        case when opportunity_row.reverify_at is not null and opportunity_row.reverify_at <= now() then 'reverify' end,
        case when opportunity_row.duplicate_of is not null then 'duplicate' end,
        case when coalesce(report_summary.open_reports, 0) > 0 then 'reported' end,
        case when opportunity_row.verification_status = 'rejected' then 'rejected' end,
        case when source_row.active is false then 'inactive_source' end,
        case when opportunity_row.status = 'open' and opportunity_row.deadline_at is not null and opportunity_row.deadline_at < now() then 'past_deadline' end,
        case when nullif(trim(opportunity_row.canonical_url), '') is null and nullif(trim(opportunity_row.application_url), '') is null and nullif(trim(opportunity_row.submission_email), '') is null then 'missing_application_path' end
      ]::text[], null) as review_flags
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
    left join lateral (
      select count(*)::integer as open_reports
      from public.opportunity_reports report_row
      where report_row.opportunity_id = opportunity_row.id
        and report_row.status in ('open','reviewing')
    ) report_summary on true
  ),
  filtered as (
    select *
    from candidate
    where
      queue_filter = 'all'
      or (queue_filter = 'needs_attention' and cardinality(review_flags) > 0)
      or (queue_filter = 'reports' and 'reported' = any(review_flags))
      or (queue_filter = 'verification' and ('verification' = any(review_flags) or 'lifecycle' = any(review_flags)))
      or (queue_filter = 'financial' and 'financial' = any(review_flags))
      or (queue_filter = 'rights' and 'rights' = any(review_flags))
      or (queue_filter = 'translation' and 'translation' = any(review_flags))
      or (queue_filter = 'reverify' and 'reverify' = any(review_flags))
      or (queue_filter = 'duplicates' and 'duplicate' = any(review_flags))
      or (queue_filter = 'rejected' and 'rejected' = any(review_flags))
  ),
  page as (
    select *
    from filtered
    order by case when open_reports > 0 then 0 else 1 end, coalesce(reverify_at, deadline_at, created_at), title
    limit greatest(1, least(coalesce(limit_count, 50), 100))
    offset greatest(coalesce(offset_count, 0), 0)
  )
  select jsonb_build_object(
    'filter', queue_filter,
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', page.id,
          'title', page.title,
          'original_title', page.original_title,
          'provider_name', page.provider_name,
          'source_name', page.source_name,
          'source_active', page.source_active,
          'canonical_url', page.canonical_url,
          'application_url', page.application_url,
          'guidelines_url', page.guidelines_url,
          'status', page.status,
          'verification_status', page.verification_status,
          'lifecycle_status', page.lifecycle_status,
          'deadline_at', page.deadline_at,
          'funding_display_text', page.funding_display_text,
          'funding_amount_type', page.funding_amount_type,
          'application_fee', page.application_fee,
          'financial_terms_verified', page.financial_terms_verified,
          'rights_terms_verified', page.rights_terms_verified,
          'translation_status', page.translation_status,
          'human_translation_review_required', page.human_translation_review_required,
          'last_verified_at', page.last_verified_at,
          'reverify_at', page.reverify_at,
          'duplicate_of', page.duplicate_of,
          'open_reports', page.open_reports,
          'review_flags', to_jsonb(page.review_flags),
          'summary', page.summary,
          'logistics_notes', page.logistics_notes,
          'funding_source_note', page.funding_source_note
        )
        order by case when page.open_reports > 0 then 0 else 1 end, coalesce(page.reverify_at, page.deadline_at, page.created_at), page.title
      )
      from page
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_review_opportunity(
  target_opportunity_id uuid,
  review_action text,
  review_reason text,
  duplicate_target_id uuid default null,
  review_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.opportunities%rowtype;
  previous_json jsonb;
  next_json jsonb;
begin
  if not private.is_kleio_admin() then
    raise exception using errcode = '42501', message = 'kleio_admin_required';
  end if;

  if char_length(trim(coalesce(review_reason, ''))) < 5 then
    raise exception using errcode = '22023', message = 'review_reason_required';
  end if;

  if review_action not in ('verify','publish','keep_review','reject','archive','reverify','merge_duplicate','restore','resolve_reports') then
    raise exception using errcode = '22023', message = 'invalid_opportunity_review_action';
  end if;

  select * into current_row from public.opportunities where id = target_opportunity_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'opportunity_not_found'; end if;
  previous_json := to_jsonb(current_row);

  if review_action = 'verify' then
    update public.opportunities set verification_status = 'kleio_reviewed', lifecycle_status = 'verified', last_verified_at = now(), verified_by = (select auth.uid())::text, verification_method = 'admin_review', reverify_at = now() + interval '60 days', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'publish' then
    if current_row.status not in ('open','upcoming','forecasted')
      or current_row.verification_status not in ('official_source','provider_published','provider_verified','kleio_reviewed')
      or current_row.last_verified_at is null
      or nullif(trim(current_row.provider_name), '') is null
      or (nullif(trim(current_row.canonical_url), '') is null and nullif(trim(current_row.application_url), '') is null and nullif(trim(current_row.submission_email), '') is null)
    then raise exception using errcode = '23514', message = 'opportunity_not_ready_to_publish'; end if;
    update public.opportunities set lifecycle_status = case when deadline_at is not null and deadline_at <= now() + interval '14 days' then 'closing_soon' else 'published' end, updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'keep_review' then
    update public.opportunities set verification_status = 'needs_review', lifecycle_status = 'needs_verification', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'reject' then
    update public.opportunities set verification_status = 'rejected', lifecycle_status = 'archived', status = 'archived', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'archive' then
    update public.opportunities set lifecycle_status = 'archived', status = 'archived', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'reverify' then
    update public.opportunities set last_verified_at = now(), reverify_at = now() + interval '60 days', lifecycle_status = case when verification_status in ('official_source','provider_published','provider_verified','kleio_reviewed') then 'verified' else 'needs_verification' end, updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'merge_duplicate' then
    if duplicate_target_id is null or duplicate_target_id = target_opportunity_id or not exists (select 1 from public.opportunities where id = duplicate_target_id) then raise exception using errcode = '22023', message = 'valid_duplicate_target_required'; end if;
    update public.opportunities set duplicate_of = duplicate_target_id, lifecycle_status = 'archived', status = 'archived', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'restore' then
    update public.opportunities set duplicate_of = null, verification_status = 'needs_review', lifecycle_status = 'needs_verification', status = 'draft', updated_at = now() where id = target_opportunity_id;
  elsif review_action = 'resolve_reports' then
    update public.opportunity_reports set status = 'resolved', resolution_notes = review_reason, resolved_at = now(), resolved_by = (select auth.uid()), updated_at = now() where opportunity_id = target_opportunity_id and status in ('open','reviewing');
  end if;

  select to_jsonb(opportunity_row.*) into next_json from public.opportunities opportunity_row where opportunity_row.id = target_opportunity_id;
  insert into public.opportunity_review_audit (opportunity_id, actor_user_id, action, reason, previous_values, new_values, source_url)
  values (target_opportunity_id, (select auth.uid()), review_action, trim(review_reason), previous_json, next_json, nullif(trim(review_source_url), ''));
  return jsonb_build_object('opportunity', next_json, 'action', review_action);
end;
$$;

revoke all on function public.get_kleio_opportunity_review_queue(text,integer,integer) from public, anon;
grant execute on function public.get_kleio_opportunity_review_queue(text,integer,integer) to authenticated;
revoke all on function public.admin_review_opportunity(uuid,text,text,uuid,text) from public, anon;
grant execute on function public.admin_review_opportunity(uuid,text,text,uuid,text) to authenticated;

commit;
