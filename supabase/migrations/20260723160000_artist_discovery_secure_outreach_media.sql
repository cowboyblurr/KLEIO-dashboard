begin;

-- Artist-controlled publication projection. Private Creative Passport fields remain in artist_profiles.
create table if not exists public.artist_discovery_profiles (
  artist_user_id uuid primary key references public.profiles(id) on delete cascade,
  visibility text not null default 'private',
  contact_mode text not null default 'opportunity_invites',
  availability text[] not null default '{}',
  themes text[] not null default '{}',
  selected_work_ids uuid[] not null default '{}',
  professional_name text not null default '',
  location text not null default '',
  bio text not null default '',
  artist_statement text not null default '',
  practice_description text not null default '',
  website_url text not null default '',
  instagram_url text not null default '',
  disciplines text[] not null default '{}',
  mediums text[] not null default '{}',
  languages text[] not null default '{}',
  career_stage text,
  profile_completion integer not null default 0,
  profile_image_path text not null default '',
  featured_work_id uuid,
  selected_works jsonb not null default '[]'::jsonb,
  enabled_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint artist_discovery_visibility_check check (visibility in ('private','applications_only','institutions')),
  constraint artist_discovery_contact_mode_check check (contact_mode in ('none','opportunity_invites')),
  constraint artist_discovery_selected_works_array_check check (jsonb_typeof(selected_works) = 'array'),
  constraint artist_discovery_selected_work_limit check (cardinality(selected_work_ids) <= 8)
);

alter table public.artist_discovery_profiles enable row level security;

grant select, insert, update, delete on public.artist_discovery_profiles to authenticated;
revoke all on public.artist_discovery_profiles from anon;

create or replace function public.is_active_institution_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
      and profile_row.onboarding_completed
      and (
        exists (select 1 from public.institutions i where i.owner_user_id = (select auth.uid()))
        or exists (
          select 1 from public.institution_members m
          where m.user_id = (select auth.uid()) and m.status = 'active'
        )
      )
  );
$$;

revoke all on function public.is_active_institution_user() from public, anon;
grant execute on function public.is_active_institution_user() to authenticated, service_role;

create or replace function public.can_contact_artists_for_institution(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institutions i
    where i.id = target_institution_id
      and (
        i.owner_user_id = (select auth.uid())
        or exists (
          select 1
          from public.institution_members m
          where m.institution_id = i.id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
            and lower(m.role) in ('owner','admin','administrator','manager','program director','program_director')
        )
      )
  );
$$;

revoke all on function public.can_contact_artists_for_institution(uuid) from public, anon;
grant execute on function public.can_contact_artists_for_institution(uuid) to authenticated, service_role;

create or replace function public.enforce_artist_discovery_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  passport public.artist_profiles%rowtype;
  invalid_count integer;
begin
  if (select auth.uid()) is not null and new.artist_user_id <> (select auth.uid()) then
    raise exception 'Artists may publish only their own discovery profile' using errcode = '42501';
  end if;

  select * into passport
  from public.artist_profiles p
  where p.user_id = new.artist_user_id;

  if passport.id is null or not exists (
    select 1 from public.profiles account
    where account.id = new.artist_user_id and account.role = 'artist'::public.kleio_role
  ) then
    raise exception 'A valid artist profile is required' using errcode = '42501';
  end if;

  select count(*) into invalid_count
  from unnest(coalesce(new.selected_work_ids, '{}'::uuid[])) selected_id
  where not exists (
    select 1 from public.portfolio_works work_row
    where work_row.id = selected_id and work_row.artist_user_id = new.artist_user_id
  );
  if invalid_count > 0 then
    raise exception 'Selected discovery works must belong to the artist' using errcode = '42501';
  end if;

  new.professional_name := passport.professional_name;
  new.location := passport.location;
  new.bio := passport.bio;
  new.artist_statement := passport.artist_statement;
  new.practice_description := passport.practice_description;
  new.website_url := passport.website_url;
  new.instagram_url := passport.instagram_url;
  new.disciplines := passport.disciplines;
  new.mediums := passport.mediums;
  new.languages := passport.languages;
  new.career_stage := passport.career_stage;
  new.profile_completion := passport.profile_completion;
  new.profile_image_path := passport.profile_image_path;
  new.featured_work_id := passport.featured_work_id;
  new.selected_work_ids := coalesce(new.selected_work_ids, '{}'::uuid[]);
  new.availability := coalesce(new.availability, '{}'::text[]);
  new.themes := coalesce(new.themes, '{}'::text[]);
  new.selected_works := coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', work_row.id,
      'title', work_row.title,
      'year', work_row.year,
      'medium', work_row.medium,
      'dimensions', work_row.dimensions,
      'description', work_row.description,
      'series', work_row.series,
      'tags', work_row.tags,
      'image_path', work_row.image_path,
      'sort_order', work_row.sort_order
    ) order by work_row.sort_order, work_row.created_at)
    from public.portfolio_works work_row
    where work_row.artist_user_id = new.artist_user_id
      and work_row.id = any(new.selected_work_ids)
  ), '[]'::jsonb);

  if new.visibility = 'institutions' and old.visibility is distinct from 'institutions' then
    new.enabled_at := now();
  elsif new.visibility <> 'institutions' then
    new.enabled_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.enforce_artist_discovery_publication() from public, anon, authenticated;

drop trigger if exists artist_discovery_publication_guard on public.artist_discovery_profiles;
create trigger artist_discovery_publication_guard
before insert or update on public.artist_discovery_profiles
for each row execute function public.enforce_artist_discovery_publication();

create or replace function public.refresh_artist_discovery_from_passport()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.artist_discovery_profiles
  set updated_at = now()
  where artist_user_id = new.user_id;
  return new;
end;
$$;
revoke all on function public.refresh_artist_discovery_from_passport() from public, anon, authenticated;

drop trigger if exists artist_profile_refresh_discovery on public.artist_profiles;
create trigger artist_profile_refresh_discovery
after update of professional_name, location, bio, artist_statement, practice_description,
  website_url, instagram_url, disciplines, mediums, languages, career_stage,
  profile_completion, profile_image_path, featured_work_id
on public.artist_profiles
for each row execute function public.refresh_artist_discovery_from_passport();

create or replace function public.refresh_artist_discovery_work()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_artist uuid;
begin
  target_artist := coalesce(new.artist_user_id, old.artist_user_id);
  if tg_op = 'DELETE' then
    update public.artist_discovery_profiles
    set selected_work_ids = array_remove(selected_work_ids, old.id), updated_at = now()
    where artist_user_id = target_artist;
  else
    update public.artist_discovery_profiles set updated_at = now()
    where artist_user_id = target_artist and new.id = any(selected_work_ids);
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.refresh_artist_discovery_work() from public, anon, authenticated;

drop trigger if exists portfolio_work_refresh_discovery on public.portfolio_works;
create trigger portfolio_work_refresh_discovery
after update or delete on public.portfolio_works
for each row execute function public.refresh_artist_discovery_work();

drop policy if exists artist_discovery_owner_manage on public.artist_discovery_profiles;
create policy artist_discovery_owner_manage
on public.artist_discovery_profiles
for all to authenticated
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));

drop policy if exists artist_discovery_institution_read on public.artist_discovery_profiles;
create policy artist_discovery_institution_read
on public.artist_discovery_profiles
for select to authenticated
using (visibility = 'institutions' and public.is_active_institution_user());

create index if not exists artist_discovery_visibility_updated_idx
on public.artist_discovery_profiles(visibility, updated_at desc);
create index if not exists artist_discovery_disciplines_gin
on public.artist_discovery_profiles using gin(disciplines);
create index if not exists artist_discovery_mediums_gin
on public.artist_discovery_profiles using gin(mediums);

-- Restrict private artist assets to owners, legitimate applicants, or opted-in discovery publication.
drop policy if exists artist_assets_select_scope on storage.objects;
create policy artist_assets_select_scope
on storage.objects
for select to authenticated
using (
  bucket_id = 'artist-assets'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.portfolio_works work_row
      join public.application_works selected_work on selected_work.portfolio_work_id = work_row.id
      where work_row.image_path = storage.objects.name
        and public.can_manage_application(selected_work.application_id)
    )
    or (
      public.is_active_institution_user()
      and exists (
        select 1
        from public.artist_discovery_profiles discovery
        where discovery.visibility = 'institutions'
          and (
            discovery.profile_image_path = storage.objects.name
            or exists (
              select 1 from jsonb_array_elements(discovery.selected_works) selected_work
              where selected_work->>'image_path' = storage.objects.name
            )
            or exists (
              select 1 from public.portfolio_works featured
              where featured.id = discovery.featured_work_id
                and featured.artist_user_id = discovery.artist_user_id
                and featured.image_path = storage.objects.name
            )
          )
      )
    )
  )
);

-- Opportunity presentation media: public listing image plus separate application cover.
alter table public.open_calls
  add column if not exists preview_image_position_x smallint not null default 50,
  add column if not exists preview_image_position_y smallint not null default 50,
  add column if not exists submission_cover_path text not null default '',
  add column if not exists submission_cover_alt_text text not null default '',
  add column if not exists submission_cover_position_x smallint not null default 50,
  add column if not exists submission_cover_position_y smallint not null default 50;

alter table public.opportunities
  add column if not exists preview_image_position_x smallint not null default 50,
  add column if not exists preview_image_position_y smallint not null default 50,
  add column if not exists submission_cover_path text not null default '',
  add column if not exists submission_cover_alt_text text not null default '',
  add column if not exists submission_cover_position_x smallint not null default 50,
  add column if not exists submission_cover_position_y smallint not null default 50;

alter table public.open_calls
  drop constraint if exists open_calls_preview_image_position_x_check,
  drop constraint if exists open_calls_preview_image_position_y_check,
  drop constraint if exists open_calls_submission_cover_position_x_check,
  drop constraint if exists open_calls_submission_cover_position_y_check,
  add constraint open_calls_preview_image_position_x_check check (preview_image_position_x between 0 and 100),
  add constraint open_calls_preview_image_position_y_check check (preview_image_position_y between 0 and 100),
  add constraint open_calls_submission_cover_position_x_check check (submission_cover_position_x between 0 and 100),
  add constraint open_calls_submission_cover_position_y_check check (submission_cover_position_y between 0 and 100);

create or replace function public.enforce_open_call_preview_image_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  media_path text;
  uploader_user_id uuid;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is not null and not public.can_contact_artists_for_institution(new.institution_id) then
    if new.preview_image_path is distinct from old.preview_image_path
      or new.submission_cover_path is distinct from old.submission_cover_path
      or new.preview_image_url is distinct from old.preview_image_url then
      raise exception 'Your institution role cannot manage opportunity media' using errcode = '42501';
    end if;
  end if;

  foreach media_path in array array[new.preview_image_path, new.submission_cover_path]
  loop
    if nullif(media_path, '') is not null then
      begin
        uploader_user_id := split_part(media_path, '/', 1)::uuid;
      exception when others then
        raise exception 'Opportunity media path is invalid' using errcode = '22023';
      end;
      if caller_id is not null and uploader_user_id <> caller_id then
        raise exception 'Opportunity media must be uploaded by the current institution member' using errcode = '42501';
      end if;
      if not exists (
        select 1 from public.institutions i
        where i.id = new.institution_id and i.owner_user_id = uploader_user_id
      ) and not exists (
        select 1 from public.institution_members m
        where m.institution_id = new.institution_id
          and m.user_id = uploader_user_id
          and m.status = 'active'
          and lower(m.role) in ('owner','admin','administrator','manager','program director','program_director')
      ) then
        raise exception 'Opportunity media must belong to an authorized institution member' using errcode = '42501';
      end if;
    end if;
  end loop;

  if nullif(new.preview_image_path, '') is not null then
    new.preview_image_origin := 'institution_upload';
    if new.preview_image_rights_status = 'not_supplied' then new.preview_image_rights_status := 'provider_owned'; end if;
  elsif nullif(new.preview_image_url, '') is null then
    new.preview_image_origin := 'kleio_fallback';
    new.preview_image_rights_status := 'not_supplied';
  end if;

  if nullif(new.submission_cover_path, '') is not null and nullif(new.submission_cover_alt_text, '') is null then
    raise exception 'Submission cover alt text is required' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_open_call_preview_image_ownership() from public, anon, authenticated;

drop trigger if exists open_calls_preview_image_ownership on public.open_calls;
create trigger open_calls_preview_image_ownership
before insert or update of preview_image_path, preview_image_url, preview_image_rights_status,
  preview_image_origin, preview_image_position_x, preview_image_position_y,
  submission_cover_path, submission_cover_alt_text, submission_cover_position_x,
  submission_cover_position_y, created_by
on public.open_calls
for each row execute function public.enforce_open_call_preview_image_ownership();

create or replace function public.sync_open_call_preview_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.opportunities opportunity_row
  set preview_image_path = new.preview_image_path,
      preview_image_url = new.preview_image_url,
      preview_image_source_url = new.preview_image_source_url,
      preview_image_alt_text = new.preview_image_alt_text,
      preview_image_attribution = new.preview_image_attribution,
      preview_image_rights_status = new.preview_image_rights_status,
      preview_image_origin = new.preview_image_origin,
      preview_image_position_x = new.preview_image_position_x,
      preview_image_position_y = new.preview_image_position_y,
      submission_cover_path = new.submission_cover_path,
      submission_cover_alt_text = new.submission_cover_alt_text,
      submission_cover_position_x = new.submission_cover_position_x,
      submission_cover_position_y = new.submission_cover_position_y,
      updated_at = now()
  where opportunity_row.internal_call_id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_open_call_preview_image() from public, anon, authenticated;

drop trigger if exists zz_open_calls_sync_preview_image on public.open_calls;
create trigger zz_open_calls_sync_preview_image
after insert or update of preview_image_path, preview_image_url, preview_image_source_url,
  preview_image_alt_text, preview_image_attribution, preview_image_rights_status,
  preview_image_origin, preview_image_position_x, preview_image_position_y,
  submission_cover_path, submission_cover_alt_text, submission_cover_position_x,
  submission_cover_position_y
on public.open_calls
for each row execute function public.sync_open_call_preview_image();

-- Invitation state and discovery outreach are opportunity-linked and institution-initiated.
alter table public.opportunity_conversations
  add column if not exists origin text not null default 'artist_application';
alter table public.opportunity_conversations
  drop constraint if exists opportunity_conversations_origin_check;
alter table public.opportunity_conversations
  add constraint opportunity_conversations_origin_check check (origin in ('artist_application','discovery_invitation'));

create table if not exists public.artist_opportunity_invitations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  artist_user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.opportunity_conversations(id) on delete cascade,
  initiated_by uuid not null references public.profiles(id),
  status text not null default 'sent',
  invitation_note text not null default '',
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (institution_id, opportunity_id, artist_user_id),
  constraint artist_opportunity_invitation_status_check check (status in ('draft','sent','viewed','interested','declined','expired','withdrawn','applied'))
);

alter table public.artist_opportunity_invitations enable row level security;
grant select on public.artist_opportunity_invitations to authenticated;
revoke insert, update, delete on public.artist_opportunity_invitations from authenticated, anon;

drop policy if exists artist_invitation_artist_read on public.artist_opportunity_invitations;
create policy artist_invitation_artist_read on public.artist_opportunity_invitations
for select to authenticated using (artist_user_id = (select auth.uid()));

drop policy if exists artist_invitation_institution_read on public.artist_opportunity_invitations;
create policy artist_invitation_institution_read on public.artist_opportunity_invitations
for select to authenticated using (public.can_contact_artists_for_institution(institution_id));

create index if not exists artist_invitations_artist_status_idx
on public.artist_opportunity_invitations(artist_user_id, status, updated_at desc);
create index if not exists artist_invitations_institution_status_idx
on public.artist_opportunity_invitations(institution_id, status, updated_at desc);

create or replace function messaging_private.can_access_opportunity_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.opportunity_conversations conversation_row
    where conversation_row.id = target_conversation_id
      and (
        conversation_row.artist_user_id = (select auth.uid())
        or (
          conversation_row.origin = 'discovery_invitation'
          and public.can_contact_artists_for_institution(conversation_row.institution_id)
        )
        or (
          conversation_row.origin = 'artist_application'
          and public.owns_institution(conversation_row.institution_id)
        )
      )
  );
$$;
revoke all on function messaging_private.can_access_opportunity_conversation(uuid) from public, anon;
grant execute on function messaging_private.can_access_opportunity_conversation(uuid) to authenticated, service_role;

create or replace function public.invite_artist_to_opportunity(
  target_artist_user_id uuid,
  target_opportunity_id uuid,
  message_body text,
  request_nonce uuid default gen_random_uuid()
)
returns table(invitation_id uuid, conversation_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  target_institution_id uuid;
  target_deadline timestamptz;
  resolved_conversation_id uuid;
  resolved_invitation_id uuid;
  opportunity_title text;
  institution_name text;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if char_length(normalized_body) < 10 or char_length(normalized_body) > 4000 then
    raise exception 'Invitation message must contain between 10 and 4000 characters' using errcode = '22023';
  end if;

  select opportunity_row.provider_name, opportunity_row.title, call_row.institution_id,
         coalesce(opportunity_row.deadline_at, call_row.deadline_at::timestamptz)
  into institution_name, opportunity_title, target_institution_id, target_deadline
  from public.opportunities opportunity_row
  join public.open_calls call_row on call_row.id = opportunity_row.internal_call_id
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.id = target_opportunity_id
    and opportunity_row.application_mode = 'internal'
    and opportunity_row.status = 'open'
    and source_row.slug = 'kleio-institution' and source_row.active
    and call_row.status = 'open'::public.open_call_status
    and call_row.published_at is not null
    and (call_row.opens_at is null or call_row.opens_at <= current_date)
    and (call_row.deadline_at is null or call_row.deadline_at >= current_date);

  if target_institution_id is null then
    raise exception 'Only an active published KLEIO listing can be used for artist outreach' using errcode = '22023';
  end if;
  if not public.can_contact_artists_for_institution(target_institution_id) then
    raise exception 'Your institution role cannot initiate artist outreach' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.artist_discovery_profiles discovery
    where discovery.artist_user_id = target_artist_user_id
      and discovery.visibility = 'institutions'
      and discovery.contact_mode = 'opportunity_invites'
  ) then
    raise exception 'This artist is not available for institution opportunity invitations' using errcode = '42501';
  end if;
  if (
    select count(*) from public.artist_opportunity_invitations invitation
    where invitation.institution_id = target_institution_id
      and invitation.sent_at >= now() - interval '24 hours'
      and invitation.status not in ('draft','withdrawn')
  ) >= 25 then
    raise exception 'Daily institution outreach limit reached' using errcode = '54000';
  end if;

  insert into public.opportunity_conversations(opportunity_id, institution_id, artist_user_id, origin)
  values(target_opportunity_id, target_institution_id, target_artist_user_id, 'discovery_invitation')
  on conflict (opportunity_id, artist_user_id) do update
    set origin = case when public.opportunity_conversations.origin = 'artist_application' then 'artist_application' else 'discovery_invitation' end,
        updated_at = now()
  returning id into resolved_conversation_id;

  insert into public.artist_opportunity_invitations(
    institution_id, opportunity_id, artist_user_id, conversation_id, initiated_by,
    status, invitation_note, sent_at, expires_at, updated_at
  ) values (
    target_institution_id, target_opportunity_id, target_artist_user_id,
    resolved_conversation_id, caller_id, 'sent', normalized_body, now(), target_deadline, now()
  )
  on conflict (institution_id, opportunity_id, artist_user_id) do update
    set conversation_id = excluded.conversation_id,
        invitation_note = case
          when public.artist_opportunity_invitations.status in ('declined','withdrawn','applied') then public.artist_opportunity_invitations.invitation_note
          else excluded.invitation_note end,
        updated_at = now()
  returning id into resolved_invitation_id;

  if not exists (
    select 1 from public.opportunity_messages m
    where m.sender_user_id = caller_id and m.client_nonce = request_nonce
  ) then
    insert into public.opportunity_messages(
      conversation_id, sender_user_id, sender_role, body, client_nonce, created_at
    ) values (
      resolved_conversation_id, caller_id, 'institution', normalized_body, request_nonce, clock_timestamp()
    );
    update public.opportunity_conversations
    set last_message_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = resolved_conversation_id;
    insert into public.notifications(user_id, kind, title, body, href)
    values(target_artist_user_id, 'artist_opportunity_invitation', 'Institution opportunity invitation',
      institution_name || ' invited you to review ' || opportunity_title || '.', '/artist-dashboard/messages/');
  end if;

  return query select resolved_invitation_id, resolved_conversation_id, 'sent'::text;
end;
$$;
revoke all on function public.invite_artist_to_opportunity(uuid,uuid,text,uuid) from public, anon;
grant execute on function public.invite_artist_to_opportunity(uuid,uuid,text,uuid) to authenticated, service_role;

create or replace function public.get_or_create_opportunity_conversation(target_opportunity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_institution_id uuid;
  resolved_conversation_id uuid;
  allowed_origin text;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = caller_id and p.role = 'artist'::public.kleio_role and p.onboarding_completed
  ) then raise exception 'Only an onboarded artist can open an authorized opportunity conversation' using errcode = '42501'; end if;

  select c.institution_id into target_institution_id
  from public.opportunities o
  join public.open_calls c on c.id = o.internal_call_id
  where o.id = target_opportunity_id and o.application_mode = 'internal';
  if target_institution_id is null then raise exception 'Opportunity messaging is unavailable' using errcode = '22023'; end if;

  if exists (
    select 1 from public.artist_opportunity_invitations i
    where i.opportunity_id = target_opportunity_id and i.artist_user_id = caller_id
      and i.status not in ('expired','withdrawn')
  ) then
    allowed_origin := 'discovery_invitation';
  elsif exists (
    select 1 from public.applications a
    join public.open_calls c on c.id = a.call_id
    where a.artist_user_id = caller_id
      and c.institution_id = target_institution_id
      and c.id = (select internal_call_id from public.opportunities where id = target_opportunity_id)
      and a.status <> 'draft'::public.application_status
  ) then
    allowed_origin := 'artist_application';
  else
    raise exception 'Artists can message an institution only after an invitation or submitted application' using errcode = '42501';
  end if;

  insert into public.opportunity_conversations(opportunity_id, institution_id, artist_user_id, origin)
  values(target_opportunity_id, target_institution_id, caller_id, allowed_origin)
  on conflict (opportunity_id, artist_user_id) do update set updated_at = now()
  returning id into resolved_conversation_id;
  return resolved_conversation_id;
end;
$$;
revoke all on function public.get_or_create_opportunity_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_opportunity_conversation(uuid) to authenticated, service_role;

create or replace function public.respond_to_artist_opportunity_invitation(target_invitation_id uuid, target_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare caller_id uuid := (select auth.uid()); current_row public.artist_opportunity_invitations%rowtype;
begin
  select * into current_row from public.artist_opportunity_invitations where id = target_invitation_id;
  if current_row.id is null or current_row.artist_user_id <> caller_id then
    raise exception 'Invitation access denied' using errcode = '42501';
  end if;
  if target_status not in ('viewed','interested','declined') then
    raise exception 'Unsupported invitation response' using errcode = '22023';
  end if;
  if current_row.status in ('withdrawn','expired','applied') then
    raise exception 'This invitation can no longer be changed' using errcode = '22023';
  end if;
  update public.artist_opportunity_invitations
  set status = target_status,
      viewed_at = coalesce(viewed_at, now()),
      responded_at = case when target_status in ('interested','declined') then now() else responded_at end,
      updated_at = now()
  where id = target_invitation_id;
  return target_status;
end;
$$;
revoke all on function public.respond_to_artist_opportunity_invitation(uuid,text) from public, anon;
grant execute on function public.respond_to_artist_opportunity_invitation(uuid,text) to authenticated, service_role;

-- Existing threads remain historical; message notifications no longer include private message excerpts.
create or replace function public.send_opportunity_message(target_conversation_id uuid, message_body text, request_nonce uuid default gen_random_uuid())
returns table(id uuid, conversation_id uuid, sender_user_id uuid, sender_role text, body text, client_nonce uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  conversation_row public.opportunity_conversations%rowtype;
  resolved_sender_role text;
  inserted_id uuid;
  opportunity_title text;
  institution_owner_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if char_length(normalized_body) < 1 or char_length(normalized_body) > 4000 then
    raise exception 'Message must contain between 1 and 4000 characters' using errcode = '22023';
  end if;
  select * into conversation_row from public.opportunity_conversations where id = target_conversation_id;
  if conversation_row.id is null or not messaging_private.can_access_opportunity_conversation(target_conversation_id) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;
  if conversation_row.artist_user_id = caller_id then resolved_sender_role := 'artist';
  elsif conversation_row.origin = 'discovery_invitation' and public.can_contact_artists_for_institution(conversation_row.institution_id) then resolved_sender_role := 'institution';
  elsif conversation_row.origin = 'artist_application' and public.owns_institution(conversation_row.institution_id) then resolved_sender_role := 'institution';
  else raise exception 'Conversation access denied' using errcode = '42501'; end if;

  select existing.id into inserted_id from public.opportunity_messages existing
  where existing.sender_user_id = caller_id and existing.client_nonce = request_nonce;
  if inserted_id is null then
    insert into public.opportunity_messages(conversation_id,sender_user_id,sender_role,body,client_nonce,created_at)
    values(target_conversation_id,caller_id,resolved_sender_role,normalized_body,request_nonce,clock_timestamp())
    returning opportunity_messages.id into inserted_id;
    update public.opportunity_conversations c set last_message_at=m.created_at,updated_at=m.created_at
    from public.opportunity_messages m where c.id=target_conversation_id and m.id=inserted_id;
    insert into public.opportunity_conversation_reads(conversation_id,user_id,last_read_at)
    select target_conversation_id,caller_id,m.created_at from public.opportunity_messages m where m.id=inserted_id
    on conflict on constraint opportunity_conversation_reads_pkey do update set last_read_at=excluded.last_read_at;
    select o.title,i.owner_user_id into opportunity_title,institution_owner_id
    from public.opportunity_conversations c
    join public.opportunities o on o.id=c.opportunity_id
    join public.institutions i on i.id=c.institution_id where c.id=target_conversation_id;
    if resolved_sender_role='artist' then
      insert into public.notifications(user_id,kind,title,body,href)
      values(institution_owner_id,'opportunity_message','New artist message',opportunity_title || ' has a new artist reply.','/messages/');
    else
      insert into public.notifications(user_id,kind,title,body,href)
      values(conversation_row.artist_user_id,'opportunity_message','New institution message',opportunity_title || ' has a new institution message.','/artist-dashboard/messages/');
    end if;
  end if;
  return query select m.id,m.conversation_id,m.sender_user_id,m.sender_role,m.body,m.client_nonce,m.created_at
  from public.opportunity_messages m where m.id=inserted_id;
end;
$$;
revoke all on function public.send_opportunity_message(uuid,text,uuid) from public, anon;
grant execute on function public.send_opportunity_message(uuid,text,uuid) to authenticated, service_role;

commit;
