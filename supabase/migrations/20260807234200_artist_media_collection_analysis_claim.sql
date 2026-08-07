begin;

create table if not exists public.artist_media_collection_analysis_claims (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  source_fingerprint text not null,
  claimed_at timestamptz not null default now(),
  constraint artist_media_collection_analysis_claims_fingerprint_not_empty check (char_length(btrim(source_fingerprint)) between 16 and 128)
);

alter table public.artist_media_collection_analysis_claims enable row level security;

revoke all on public.artist_media_collection_analysis_claims from anon;
grant select, insert, update, delete on public.artist_media_collection_analysis_claims to authenticated;

create policy "artist_media_collection_analysis_claims_select_own"
  on public.artist_media_collection_analysis_claims
  for select
  to authenticated
  using (artist_user_id = (select auth.uid()));

create policy "artist_media_collection_analysis_claims_insert_own"
  on public.artist_media_collection_analysis_claims
  for insert
  to authenticated
  with check (artist_user_id = (select auth.uid()));

create policy "artist_media_collection_analysis_claims_update_own"
  on public.artist_media_collection_analysis_claims
  for update
  to authenticated
  using (artist_user_id = (select auth.uid()))
  with check (artist_user_id = (select auth.uid()));

create policy "artist_media_collection_analysis_claims_delete_own"
  on public.artist_media_collection_analysis_claims
  for delete
  to authenticated
  using (artist_user_id = (select auth.uid()));

create or replace function public.claim_my_media_collection_analysis(target_fingerprint text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_claim public.artist_media_collection_analysis_claims%rowtype;
  normalized_fingerprint text := btrim(coalesce(target_fingerprint, ''));
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;
  if char_length(normalized_fingerprint) < 16 or char_length(normalized_fingerprint) > 128 then
    raise exception 'collection_fingerprint_invalid';
  end if;

  select * into existing_claim
  from public.artist_media_collection_analysis_claims
  where artist_user_id = current_user_id
  for update;

  if found then
    if existing_claim.claimed_at > now() - interval '4 minutes' then
      return false;
    end if;

    update public.artist_media_collection_analysis_claims
    set source_fingerprint = normalized_fingerprint,
        claimed_at = now()
    where artist_user_id = current_user_id;
    return true;
  end if;

  begin
    insert into public.artist_media_collection_analysis_claims (artist_user_id, source_fingerprint, claimed_at)
    values (current_user_id, normalized_fingerprint, now());
    return true;
  exception when unique_violation then
    return false;
  end;
end;
$$;

create or replace function public.release_my_media_collection_analysis(target_fingerprint text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_fingerprint text := btrim(coalesce(target_fingerprint, ''));
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  delete from public.artist_media_collection_analysis_claims
  where artist_user_id = current_user_id
    and source_fingerprint = normalized_fingerprint;
end;
$$;

revoke all on function public.claim_my_media_collection_analysis(text) from public, anon;
grant execute on function public.claim_my_media_collection_analysis(text) to authenticated;
revoke all on function public.release_my_media_collection_analysis(text) from public, anon;
grant execute on function public.release_my_media_collection_analysis(text) to authenticated;

comment on table public.artist_media_collection_analysis_claims is
  'Short owner-scoped leases preventing duplicate concurrent body-of-work AI synthesis. One collection analysis may run per artist at a time; stale leases recover after four minutes.';
comment on function public.claim_my_media_collection_analysis(text) is
  'Atomically acquires one short body-of-work analysis lease for the authenticated artist. Concurrent requests are rejected and stale leases recover after four minutes.';
comment on function public.release_my_media_collection_analysis(text) is
  'Releases only the authenticated artist lease matching the completed collection fingerprint, preventing an older request from clearing a newer lease.';

commit;
