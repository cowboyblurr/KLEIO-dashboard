create table if not exists public.artist_media_collection_insights (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_ids uuid[] not null,
  source_fingerprint text not null,
  title text not null default '',
  status text not null default 'review_ready' check (status in ('review_ready', 'confirmed', 'dismissed')),
  generated_insight jsonb not null default '{}'::jsonb,
  artist_summary text not null default '',
  passport_record_id uuid references public.artist_passport_records(id) on delete set null,
  provider text not null default '',
  model text not null default '',
  prompt_version text not null default '',
  analyzed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_media_collection_insights_min_sources check (cardinality(source_ids) >= 2),
  constraint artist_media_collection_insights_max_sources check (cardinality(source_ids) <= 12),
  constraint artist_media_collection_insights_fingerprint_unique unique (artist_user_id, source_fingerprint)
);

create index if not exists artist_media_collection_insights_artist_updated_idx
  on public.artist_media_collection_insights (artist_user_id, updated_at desc);
create index if not exists artist_media_collection_insights_artist_status_idx
  on public.artist_media_collection_insights (artist_user_id, status, confirmed_at desc);

alter table public.artist_media_collection_insights enable row level security;

revoke all on public.artist_media_collection_insights from anon;
grant select, insert, update, delete on public.artist_media_collection_insights to authenticated;

create policy "artist_media_collection_insights_select_own"
  on public.artist_media_collection_insights
  for select
  to authenticated
  using (artist_user_id = auth.uid());

create policy "artist_media_collection_insights_insert_own"
  on public.artist_media_collection_insights
  for insert
  to authenticated
  with check (artist_user_id = auth.uid());

create policy "artist_media_collection_insights_update_own"
  on public.artist_media_collection_insights
  for update
  to authenticated
  using (artist_user_id = auth.uid())
  with check (artist_user_id = auth.uid());

create policy "artist_media_collection_insights_delete_own"
  on public.artist_media_collection_insights
  for delete
  to authenticated
  using (artist_user_id = auth.uid());

create or replace function public.confirm_my_media_collection_insight(target_insight_id uuid, reviewed_summary text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  insight public.artist_media_collection_insights%rowtype;
  existing_record_id uuid;
  final_summary text := btrim(coalesce(reviewed_summary, ''));
  now_at timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;
  if char_length(final_summary) < 1 or char_length(final_summary) > 20000 then
    raise exception 'collection_summary_invalid';
  end if;

  select * into insight
  from public.artist_media_collection_insights
  where id = target_insight_id
    and artist_user_id = current_user_id
  for update;

  if not found then
    raise exception 'collection_insight_not_found';
  end if;

  select id into existing_record_id
  from public.artist_passport_records
  where artist_user_id = current_user_id
    and normalized_key = 'media_collection:' || insight.id::text
    and status = 'active'
  order by updated_at desc
  limit 1;

  if existing_record_id is null then
    insert into public.artist_passport_records (
      artist_user_id,
      record_type,
      section,
      display_value,
      normalized_value,
      normalized_key,
      evidence_excerpt,
      provenance_status,
      visibility,
      status,
      is_sensitive,
      confirmed_at,
      last_reviewed_at,
      created_at,
      updated_at
    ) values (
      current_user_id,
      'body_of_work_context',
      'practice',
      final_summary,
      jsonb_build_object(
        'collection_insight_id', insight.id,
        'source_ids', insight.source_ids,
        'artist_reviewed', true
      ),
      'media_collection:' || insight.id::text,
      left(final_summary, 1200),
      'confirmed',
      'private',
      'active',
      false,
      now_at,
      now_at,
      now_at,
      now_at
    ) returning id into existing_record_id;
  else
    update public.artist_passport_records
    set display_value = final_summary,
        normalized_value = jsonb_build_object(
          'collection_insight_id', insight.id,
          'source_ids', insight.source_ids,
          'artist_reviewed', true
        ),
        evidence_excerpt = left(final_summary, 1200),
        provenance_status = 'confirmed',
        visibility = 'private',
        status = 'active',
        is_sensitive = false,
        confirmed_at = now_at,
        last_reviewed_at = now_at,
        updated_at = now_at
    where id = existing_record_id
      and artist_user_id = current_user_id;
  end if;

  update public.artist_media_collection_insights
  set status = 'confirmed',
      artist_summary = final_summary,
      passport_record_id = existing_record_id,
      confirmed_at = now_at,
      updated_at = now_at
  where id = insight.id
    and artist_user_id = current_user_id;

  return existing_record_id;
end;
$$;

create or replace function public.dismiss_my_media_collection_insight(target_insight_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  insight public.artist_media_collection_insights%rowtype;
  now_at timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into insight
  from public.artist_media_collection_insights
  where id = target_insight_id
    and artist_user_id = current_user_id
  for update;

  if not found then
    raise exception 'collection_insight_not_found';
  end if;

  if insight.passport_record_id is not null then
    update public.artist_passport_records
    set status = 'removed',
        last_reviewed_at = now_at,
        updated_at = now_at
    where id = insight.passport_record_id
      and artist_user_id = current_user_id;
  end if;

  update public.artist_media_collection_insights
  set status = 'dismissed',
      artist_summary = '',
      confirmed_at = null,
      updated_at = now_at
  where id = insight.id
    and artist_user_id = current_user_id;

  return true;
end;
$$;

revoke all on function public.confirm_my_media_collection_insight(uuid, text) from public, anon;
grant execute on function public.confirm_my_media_collection_insight(uuid, text) to authenticated;
revoke all on function public.dismiss_my_media_collection_insight(uuid) from public, anon;
grant execute on function public.dismiss_my_media_collection_insight(uuid) to authenticated;

comment on table public.artist_media_collection_insights is
  'Private, owner-scoped synthesis across artist-selected media. Generated patterns remain suggestions; only artist_summary on confirmed rows is promoted into private artist-confirmed Passport evidence, and dismissal removes that promoted context.';
