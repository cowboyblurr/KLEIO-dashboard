-- The trigger runs on both artist_profiles (user_id) and institutions
-- (owner_user_id). Access trigger records through JSON so a missing field on
-- either table cannot abort onboarding.

create or replace function private.complete_role_onboarding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  target_user_id := coalesce(
    nullif(to_jsonb(new) ->> 'user_id', '')::uuid,
    nullif(to_jsonb(new) ->> 'owner_user_id', '')::uuid
  );

  if target_user_id is null then
    raise exception 'Unable to resolve onboarding user from table %', tg_table_name;
  end if;

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = target_user_id;

  return new;
end;
$$;

revoke all on function private.complete_role_onboarding() from public, anon, authenticated;
