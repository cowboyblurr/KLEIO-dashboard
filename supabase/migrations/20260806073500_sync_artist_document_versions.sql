-- Keep document revision history synchronized at the canonical source boundary.
-- This applies to every PDF classification path, including extraction, manual
-- classification, and future import adapters, without relying on one UI flow.

alter table public.artist_document_versions
  drop constraint if exists artist_document_versions_family_check;

alter table public.artist_document_versions
  add constraint artist_document_versions_family_check check (document_family = any (array[
    'artist_cv','artist_biography','artist_statement','project_proposal','project_budget','work_sample_list',
    'proof_of_residency','identification_document','reference_letter','press_publication',
    'exhibition_documentation','award_grant_documentation','application_requirement_file','other_artist_material'
  ]));

create or replace function public.sync_artist_document_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_versioned_families constant text[] := array[
    'artist_cv','artist_biography','artist_statement','project_proposal','project_budget','work_sample_list',
    'proof_of_residency','identification_document','reference_letter','press_publication',
    'exhibition_documentation','award_grant_documentation','application_requirement_file','other_artist_material'
  ];
  v_existing public.artist_document_versions%rowtype;
  v_previous public.artist_document_versions%rowtype;
  v_old_family text;
  v_next_version integer;
  v_new_lock bigint;
  v_old_lock bigint;
  v_now timestamptz := now();
begin
  select *
    into v_existing
    from public.artist_document_versions
   where source_id = new.id
   for update;

  v_old_family := case when found then v_existing.document_family else null end;
  v_new_lock := hashtextextended(new.artist_user_id::text || ':' || coalesce(new.classification, ''), 0);
  v_old_lock := hashtextextended(new.artist_user_id::text || ':' || coalesce(v_old_family, ''), 0);

  -- Lock document families in a stable order so simultaneous uploads cannot
  -- claim the same version number or create two current versions.
  if v_old_family is not null and v_old_family is distinct from new.classification then
    if v_old_lock <= v_new_lock then
      perform pg_advisory_xact_lock(v_old_lock);
      perform pg_advisory_xact_lock(v_new_lock);
    else
      perform pg_advisory_xact_lock(v_new_lock);
      perform pg_advisory_xact_lock(v_old_lock);
    end if;
  else
    perform pg_advisory_xact_lock(v_new_lock);
  end if;

  -- Non-PDF, unclassified, or deleted sources cannot remain the current
  -- revision of a document family. Historical application-selected versions
  -- remain addressable by their immutable version id.
  if new.mime_type is distinct from 'application/pdf'
     or not (new.classification = any (v_versioned_families))
     or new.deleted_at is not null then
    if v_old_family is not null then
      update public.artist_document_versions
         set is_current = false,
             status = case when status = 'application_selected' then status else 'archived' end,
             updated_at = v_now
       where id = v_existing.id;

      update public.artist_import_sources
         set is_current_version = false,
             updated_at = v_now
       where id = new.id;

      select *
        into v_previous
        from public.artist_document_versions
       where artist_user_id = new.artist_user_id
         and document_family = v_old_family
         and source_id <> new.id
         and status <> 'archived'
       order by version_number desc, created_at desc
       limit 1
       for update;

      if found then
        update public.artist_document_versions
           set is_current = true,
               status = case when status = 'application_selected' then status else 'current' end,
               updated_at = v_now
         where id = v_previous.id;

        update public.artist_import_sources
           set is_current_version = true,
               document_version = v_previous.version_number,
               updated_at = v_now
         where id = v_previous.source_id;
      end if;
    end if;
    return new;
  end if;

  -- A source already registered in the same family keeps its immutable version
  -- number. Re-analysis therefore never creates a false new document revision.
  if v_old_family = new.classification then
    update public.artist_document_versions
       set is_current = true,
           status = case when status = 'application_selected' then status else 'current' end,
           updated_at = v_now
     where id = v_existing.id;

    update public.artist_document_versions
       set is_current = false,
           status = case when status = 'application_selected' then status else 'superseded' end,
           updated_at = v_now
     where artist_user_id = new.artist_user_id
       and document_family = new.classification
       and id <> v_existing.id
       and is_current;

    update public.artist_import_sources
       set document_version = v_existing.version_number,
           is_current_version = true,
           updated_at = v_now
     where id = new.id;

    update public.artist_import_sources source_row
       set is_current_version = false,
           updated_at = v_now
     where source_row.artist_user_id = new.artist_user_id
       and source_row.id <> new.id
       and source_row.id in (
         select source_id
           from public.artist_document_versions
          where artist_user_id = new.artist_user_id
            and document_family = new.classification
            and not is_current
       );

    return new;
  end if;

  -- If the artist corrects a document's family, restore the latest remaining
  -- revision in the old family before assigning this source to the new family.
  if v_old_family is not null then
    update public.artist_document_versions
       set is_current = false,
           status = case when status = 'application_selected' then status else 'archived' end,
           updated_at = v_now
     where id = v_existing.id;

    select *
      into v_previous
      from public.artist_document_versions
     where artist_user_id = new.artist_user_id
       and document_family = v_old_family
       and source_id <> new.id
       and status <> 'archived'
     order by version_number desc, created_at desc
     limit 1
     for update;

    if found then
      update public.artist_document_versions
         set is_current = true,
             status = case when status = 'application_selected' then status else 'current' end,
             updated_at = v_now
       where id = v_previous.id;

      update public.artist_import_sources
         set is_current_version = true,
             document_version = v_previous.version_number,
             updated_at = v_now
       where id = v_previous.source_id;
    end if;
  end if;

  select *
    into v_previous
    from public.artist_document_versions
   where artist_user_id = new.artist_user_id
     and document_family = new.classification
     and is_current
   order by version_number desc, created_at desc
   limit 1
   for update;

  select coalesce(max(version_number), 0) + 1
    into v_next_version
    from public.artist_document_versions
   where artist_user_id = new.artist_user_id
     and document_family = new.classification;

  update public.artist_document_versions
     set is_current = false,
         status = case when status = 'application_selected' then status else 'superseded' end,
         updated_at = v_now
   where artist_user_id = new.artist_user_id
     and document_family = new.classification
     and is_current;

  update public.artist_import_sources source_row
     set is_current_version = false,
         updated_at = v_now
   where source_row.artist_user_id = new.artist_user_id
     and source_row.id in (
       select source_id
         from public.artist_document_versions
        where artist_user_id = new.artist_user_id
          and document_family = new.classification
          and not is_current
     );

  if v_old_family is null then
    insert into public.artist_document_versions (
      artist_user_id,
      source_id,
      document_family,
      version_number,
      previous_source_id,
      is_current,
      status,
      comparison_summary,
      created_at,
      updated_at
    ) values (
      new.artist_user_id,
      new.id,
      new.classification,
      v_next_version,
      v_previous.source_id,
      true,
      'current',
      jsonb_build_object(
        'registered_by', 'artist_import_source_trigger',
        'checksum', coalesce(new.checksum, ''),
        'previous_source_id', v_previous.source_id,
        'artist_confirmation_required', true
      ),
      v_now,
      v_now
    )
    returning * into v_existing;
  else
    update public.artist_document_versions
       set document_family = new.classification,
           version_number = v_next_version,
           previous_source_id = v_previous.source_id,
           is_current = true,
           status = case when status = 'application_selected' then status else 'current' end,
           comparison_summary = coalesce(comparison_summary, '{}'::jsonb) || jsonb_build_object(
             'registered_by', 'artist_import_source_trigger',
             'checksum', coalesce(new.checksum, ''),
             'previous_source_id', v_previous.source_id,
             'reclassified_from', v_old_family,
             'artist_confirmation_required', true
           ),
           updated_at = v_now
     where id = v_existing.id
     returning * into v_existing;
  end if;

  update public.artist_import_sources
     set document_version = v_existing.version_number,
         is_current_version = true,
         updated_at = v_now
   where id = new.id;

  return new;
end;
$$;

revoke all on function public.sync_artist_document_version() from public;

-- Separate insert and update triggers let the update path ignore extractor
-- writes that repeat the same classification during re-analysis.
drop trigger if exists sync_artist_document_version_on_insert on public.artist_import_sources;
create trigger sync_artist_document_version_on_insert
  after insert on public.artist_import_sources
  for each row execute function public.sync_artist_document_version();

drop trigger if exists sync_artist_document_version_on_change on public.artist_import_sources;
create trigger sync_artist_document_version_on_change
  after update of classification, mime_type, deleted_at on public.artist_import_sources
  for each row
  when (
    old.classification is distinct from new.classification
    or old.mime_type is distinct from new.mime_type
    or old.deleted_at is distinct from new.deleted_at
  )
  execute function public.sync_artist_document_version();

-- Backfill existing classified PDFs in creation order. The trigger assigns a
-- stable monotonically increasing version per artist and document family.
do $$
declare
  v_source_id uuid;
begin
  for v_source_id in
    select id
      from public.artist_import_sources
     where mime_type = 'application/pdf'
       and deleted_at is null
       and classification = any (array[
         'artist_cv','artist_biography','artist_statement','project_proposal','project_budget','work_sample_list',
         'proof_of_residency','identification_document','reference_letter','press_publication',
         'exhibition_documentation','award_grant_documentation','application_requirement_file','other_artist_material'
       ])
     order by created_at, id
  loop
    update public.artist_import_sources
       set classification = classification
     where id = v_source_id;

    -- The update trigger intentionally ignores unchanged classifications, so
    -- invoke the same synchronization function through a temporary meaningful
    -- transition only when this source has not already been registered.
    if not exists (
      select 1 from public.artist_document_versions where source_id = v_source_id
    ) then
      update public.artist_import_sources
         set mime_type = mime_type || ''
       where id = v_source_id;
    end if;
  end loop;
end;
$$;

-- Normalize any legacy duplicate-current state before enforcing the invariant.
with ranked as (
  select id,
         row_number() over (
           partition by artist_user_id, document_family
           order by version_number desc, created_at desc
         ) as current_rank
    from public.artist_document_versions
   where is_current
)
update public.artist_document_versions version_row
   set is_current = false,
       status = case when status = 'application_selected' then status else 'superseded' end,
       updated_at = now()
  from ranked
 where ranked.id = version_row.id
   and ranked.current_rank > 1;

create unique index if not exists artist_document_versions_one_current_per_family
  on public.artist_document_versions (artist_user_id, document_family)
  where is_current;
