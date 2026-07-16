-- Mark onboarding complete only after the authenticated account creates its role-specific record.

create or replace function private.complete_artist_onboarding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

revoke all on function private.complete_artist_onboarding() from public, anon, authenticated;

drop trigger if exists artist_profiles_complete_onboarding on public.artist_profiles;
create trigger artist_profiles_complete_onboarding
after insert or update on public.artist_profiles
for each row execute procedure private.complete_artist_onboarding();

create or replace function private.complete_institution_onboarding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = new.owner_user_id;
  return new;
end;
$$;

revoke all on function private.complete_institution_onboarding() from public, anon, authenticated;

drop trigger if exists institutions_complete_onboarding on public.institutions;
create trigger institutions_complete_onboarding
after insert or update on public.institutions
for each row execute procedure private.complete_institution_onboarding();
