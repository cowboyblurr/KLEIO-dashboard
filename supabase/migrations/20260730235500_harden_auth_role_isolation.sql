-- Harden KLEIO beta authentication boundaries without changing the primary-role model.

-- Profiles are created by the trusted auth trigger. Signed-out users do not
-- need direct table privileges, and signed-in users only need to read their
-- RLS-scoped row and update non-authoritative presentation fields.
revoke all privileges on table public.profiles from anon;
revoke insert, delete, truncate, references, trigger on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, onboarding_completed, updated_at)
  on table public.profiles to authenticated;

-- This research queue is an internal service process. RLS already denies all
-- client rows; explicit grants now match that intent.
revoke all privileges on table public.opportunity_image_research_queue from anon, authenticated;

-- Resolve an owned institution before invited memberships. This prevents an
-- institution owner from opening an unrelated membership merely because its
-- UUID sorts first. Multi-membership switching remains an explicit post-beta
-- product decision rather than an implicit client-side assumption.
create or replace function public.get_my_institution_contexts()
returns table(
  institution_id uuid,
  institution_name text,
  member_role text,
  member_status text
)
language sql
stable
security definer
set search_path = ''
as $function$
  with contexts as (
    select distinct on (institution_row.id)
      institution_row.id as institution_id,
      coalesce(nullif(institution_row.display_name, ''), institution_row.name) as institution_name,
      case
        when institution_row.owner_user_id = (select auth.uid()) then 'Owner'
        else member_row.role
      end as member_role,
      case
        when institution_row.owner_user_id = (select auth.uid()) then 'active'
        else member_row.status
      end as member_status
    from public.institutions institution_row
    left join public.institution_members member_row
      on member_row.institution_id = institution_row.id
     and member_row.user_id = (select auth.uid())
    where institution_row.owner_user_id = (select auth.uid())
       or (
         member_row.user_id = (select auth.uid())
         and member_row.status = 'active'
       )
    order by
      institution_row.id,
      case when institution_row.owner_user_id = (select auth.uid()) then 0 else 1 end
  )
  select
    contexts.institution_id,
    contexts.institution_name,
    contexts.member_role,
    contexts.member_status
  from contexts
  order by
    case when contexts.member_role = 'Owner' then 0 else 1 end,
    lower(contexts.institution_name),
    contexts.institution_id;
$function$;

revoke all on function public.get_my_institution_contexts() from public, anon;
grant execute on function public.get_my_institution_contexts() to authenticated, service_role;

-- Cover foreign keys reported by the database advisor. Partial indexes avoid
-- indexing null relationships that are valid for general drafts or events.
create index if not exists artist_import_proposals_source_id_idx
  on public.artist_import_proposals (source_id);

create index if not exists artist_passport_drafts_opportunity_id_idx
  on public.artist_passport_drafts (opportunity_id)
  where opportunity_id is not null;

create index if not exists product_events_actor_user_id_idx
  on public.product_events (actor_user_id)
  where actor_user_id is not null;
