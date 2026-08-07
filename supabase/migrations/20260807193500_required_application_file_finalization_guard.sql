-- Required application file finalization guard.
--
-- The artist-facing composer distinguishes written answers, file/document inputs,
-- portfolio selection, and genuinely mixed requirements. This guard repeats the
-- file-channel rule at the database boundary so a direct RPC call cannot preserve
-- a final submission version while a required application file is still absent.

create or replace function public.finalize_my_application_submission_version(
  target_package_id uuid,
  supplied_preflight jsonb default '{}'::jsonb
)
returns table(
  submission_version_id uuid,
  version_number integer,
  finalized_at timestamptz
)
language plpgsql
security invoker
set search_path = 'public', 'private'
as $$
declare
  package_opportunity_id uuid;
  missing_required_files text[];
begin
  select package.opportunity_id
  into package_opportunity_id
  from public.application_packages package
  where package.id = target_package_id
    and package.artist_user_id = (select auth.uid());

  if package_opportunity_id is null then
    raise exception 'application_package_not_found';
  end if;

  select coalesce(array_agg(requirement.label order by requirement.sort_order), array[]::text[])
  into missing_required_files
  from public.opportunity_requirements requirement
  where requirement.opportunity_id = package_opportunity_id
    and requirement.required
    and (
      case
        -- Explicit source input type wins over semantic labels and packaging hints.
        when lower(coalesce(requirement.input_type, '')) in ('textarea', 'long_text', 'written_response', 'essay', 'text', 'short_text') then false
        when lower(coalesce(requirement.input_type, '')) in ('document', 'documents', 'file', 'upload', 'url_or_document', 'mixed') then true
        when coalesce(cardinality(requirement.accepted_file_types), 0) > 0 then true
        when lower(coalesce(requirement.category, '')) = 'supporting_document' then true
        else false
      end
    )
    and not exists (
      select 1
      from public.application_requirement_attachments attachment
      where attachment.artist_user_id = (select auth.uid())
        and attachment.opportunity_id = package_opportunity_id
        and attachment.requirement_id = requirement.id
        and attachment.included_in_package
        and attachment.artist_confirmed_at is not null
        and attachment.validation_status <> 'invalid'
    );

  if coalesce(cardinality(missing_required_files), 0) > 0 then
    raise exception 'required_application_file_missing: %', array_to_string(missing_required_files, ', ');
  end if;

  return query
  select *
  from private.finalize_my_application_submission_version_impl(target_package_id, supplied_preflight);
end;
$$;

revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from public, anon;
grant execute on function public.finalize_my_application_submission_version(uuid, jsonb) to authenticated;

comment on function public.finalize_my_application_submission_version(uuid, jsonb) is
  'Artist finalization boundary. Refuses to seal a submission while any source-defined required file/document requirement lacks an artist-confirmed included attachment.';
