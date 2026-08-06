create or replace function public.normalize_artist_import_proposal_edit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.artist_edited_value is not null and btrim(new.artist_edited_value) = '' then
    new.artist_edited_value := null;
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_artist_import_proposal_edit_trigger
on public.artist_import_proposals;

create trigger normalize_artist_import_proposal_edit_trigger
before insert or update of artist_edited_value
on public.artist_import_proposals
for each row
execute function public.normalize_artist_import_proposal_edit();

update public.artist_import_proposals
set artist_edited_value = null
where artist_edited_value is not null
  and btrim(artist_edited_value) = '';
