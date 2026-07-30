create or replace function public.save_my_artist_draft(
  target_draft_key text,
  target_draft_kind text,
  target_opportunity_id uuid,
  target_payload jsonb,
  expected_revision bigint,
  target_client_updated_at timestamptz
)
returns public.artist_passport_drafts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_row public.artist_passport_drafts;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if target_draft_key is null or char_length(target_draft_key) not between 1 and 120 then raise exception 'invalid_draft_key'; end if;
  if target_draft_kind not in ('creative_passport','import_review','voice_transcript','opportunity_questions') then raise exception 'invalid_draft_kind'; end if;
  if jsonb_typeof(coalesce(target_payload, '{}'::jsonb)) <> 'object' then raise exception 'invalid_draft_payload'; end if;

  insert into public.artist_passport_drafts (
    artist_user_id, draft_key, draft_kind, opportunity_id, payload, revision,
    client_updated_at, expires_at, updated_at
  ) values (
    auth.uid(), target_draft_key, target_draft_kind, target_opportunity_id,
    coalesce(target_payload, '{}'::jsonb), 1,
    target_client_updated_at, now() + interval '90 days', now()
  )
  on conflict (artist_user_id, draft_key) do update set
    draft_kind = excluded.draft_kind,
    opportunity_id = excluded.opportunity_id,
    payload = excluded.payload,
    revision = artist_passport_drafts.revision + 1,
    client_updated_at = excluded.client_updated_at,
    expires_at = now() + interval '90 days',
    updated_at = now()
  where artist_passport_drafts.revision = greatest(coalesce(expected_revision, 0), 0)
  returning * into saved_row;

  if saved_row.artist_user_id is null then raise exception 'draft_conflict'; end if;
  return saved_row;
end;
$$;

grant execute on function public.save_my_artist_draft(text,text,uuid,jsonb,bigint,timestamptz) to authenticated;
comment on function public.save_my_artist_draft(text,text,uuid,jsonb,bigint,timestamptz) is 'Owner-scoped optimistic autosave. A stale expected revision fails with draft_conflict instead of overwriting newer remote work.';
