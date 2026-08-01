alter table public.artist_website_import_sessions
  add column if not exists rights_confirmed_at timestamptz;

create or replace function private.enforce_website_import_rights()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_session_id uuid;
begin
  if new.source_type <> 'website' then
    return new;
  end if;

  begin
    target_session_id := nullif(new.source_metadata ->> 'website_session_id', '')::uuid;
  exception when invalid_text_representation then
    target_session_id := null;
  end;

  if target_session_id is null or not exists (
    select 1
    from public.artist_website_import_sessions session
    where session.id = target_session_id
      and session.artist_user_id = new.artist_user_id
      and session.rights_confirmed_at is not null
  ) then
    raise exception 'website_import_rights_confirmation_required'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_website_import_rights() from public, anon, authenticated;

drop trigger if exists enforce_website_import_rights_before_insert on public.artist_import_sources;
create trigger enforce_website_import_rights_before_insert
before insert on public.artist_import_sources
for each row
when (new.source_type = 'website')
execute function private.enforce_website_import_rights();
