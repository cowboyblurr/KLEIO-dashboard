alter table public.artist_profiles
  add column if not exists profile_image_path text,
  add column if not exists featured_work_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_profiles_featured_work_id_fkey'
      and conrelid = 'public.artist_profiles'::regclass
  ) then
    alter table public.artist_profiles
      add constraint artist_profiles_featured_work_id_fkey
      foreign key (featured_work_id)
      references public.portfolio_works(id)
      on delete set null;
  end if;
end
$$;

create index if not exists artist_profiles_featured_work_id_idx
  on public.artist_profiles(featured_work_id)
  where featured_work_id is not null;

create or replace function public.enforce_artist_profile_featured_work_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.featured_work_id is not null and not exists (
    select 1
    from public.portfolio_works work
    where work.id = new.featured_work_id
      and work.artist_user_id = new.user_id
  ) then
    raise exception 'Featured work must belong to the artist profile owner';
  end if;

  return new;
end;
$$;

drop trigger if exists artist_profile_featured_work_owner on public.artist_profiles;
create trigger artist_profile_featured_work_owner
before insert or update of featured_work_id, user_id
on public.artist_profiles
for each row
execute function public.enforce_artist_profile_featured_work_owner();
