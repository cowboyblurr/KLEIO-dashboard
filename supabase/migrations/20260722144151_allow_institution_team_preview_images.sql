create or replace function public.enforce_open_call_preview_image_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  uploader_user_id uuid;
begin
  if nullif(new.preview_image_path, '') is not null then
    begin
      uploader_user_id := split_part(new.preview_image_path, '/', 1)::uuid;
    exception when others then
      raise exception 'Opportunity preview image path is invalid' using errcode = '22023';
    end;

    if not exists (
      select 1
      from public.institutions institution_row
      where institution_row.id = new.institution_id
        and institution_row.owner_user_id = uploader_user_id
    ) and not exists (
      select 1
      from public.institution_members member_row
      where member_row.institution_id = new.institution_id
        and member_row.user_id = uploader_user_id
        and member_row.status = 'active'
    ) then
      raise exception 'Opportunity preview image must belong to an active institution member' using errcode = '42501';
    end if;

    new.preview_image_origin := 'institution_upload';
    if new.preview_image_rights_status = 'not_supplied' then
      new.preview_image_rights_status := 'provider_owned';
    end if;
  elsif nullif(new.preview_image_url, '') is null then
    new.preview_image_origin := 'kleio_fallback';
    new.preview_image_rights_status := 'not_supplied';
  end if;

  return new;
end;
$$;
