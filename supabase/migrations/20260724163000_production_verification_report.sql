begin;

create or replace view public.kleio_production_verification
with (security_invoker = true)
as
with checks as (
  select 'auth_users_have_profiles'::text as check_name,
         not exists (
           select 1 from auth.users u
           left join public.profiles p on p.id = u.id
           where p.id is null
         ) as passed,
         (select count(*)::text from auth.users u left join public.profiles p on p.id=u.id where p.id is null) as observed,
         '0 auth users without a public profile'::text as expected
  union all
  select 'profiles_have_auth_users',
         not exists (
           select 1 from public.profiles p
           left join auth.users u on u.id = p.id
           where u.id is null
         ),
         (select count(*)::text from public.profiles p left join auth.users u on u.id=p.id where u.id is null),
         '0 orphan profiles'
  union all
  select 'one_artist_profile_per_owner',
         not exists (select 1 from public.artist_profiles group by user_id having count(*) > 1),
         (select count(*)::text from (select user_id from public.artist_profiles group by user_id having count(*) > 1) duplicates),
         '0 duplicate artist owners'
  union all
  select 'one_institution_per_owner',
         not exists (select 1 from public.institutions group by owner_user_id having count(*) > 1),
         (select count(*)::text from (select owner_user_id from public.institutions group by owner_user_id having count(*) > 1) duplicates),
         '0 duplicate institution owners'
  union all
  select 'artist_assets_bucket_private',
         coalesce((select not public from storage.buckets where id='artist-assets'), false),
         coalesce((select case when public then 'public' else 'private' end from storage.buckets where id='artist-assets'),'missing'),
         'private'
  union all
  select 'opportunities_have_sources',
         not exists (select 1 from public.opportunities o left join public.opportunity_sources s on s.id=o.source_id where s.id is null),
         (select count(*)::text from public.opportunities o left join public.opportunity_sources s on s.id=o.source_id where s.id is null),
         '0 opportunities without a source'
  union all
  select 'current_opportunities_have_urls',
         not exists (
           select 1 from public.opportunities
           where duplicate_of is null
             and status in ('open','upcoming','forecasted')
             and (canonical_url is null or canonical_url !~ '^https?://')
         ),
         (select count(*)::text from public.opportunities where duplicate_of is null and status in ('open','upcoming','forecasted') and (canonical_url is null or canonical_url !~ '^https?://')),
         '0 current opportunities without an HTTP source URL'
  union all
  select 'current_opportunities_not_expired',
         not exists (
           select 1 from public.opportunities
           where duplicate_of is null and status='open' and deadline_at is not null and deadline_at < now()
         ),
         (select count(*)::text from public.opportunities where duplicate_of is null and status='open' and deadline_at is not null and deadline_at < now()),
         '0 open opportunities past deadline'
  union all
  select 'asia_search_returns_results',
         exists (select 1 from public.search_opportunities('Asia',null,null,null,null,null,false,false,50,0)),
         (select count(*)::text from public.search_opportunities('Asia',null,null,null,null,null,false,false,50,0)),
         'at least 1 result'
  union all
  select 'demo_emails_not_confirmed_live_accounts',
         not exists (
           select 1 from auth.users
           where email ~* '@kleio\\.demo$' and email_confirmed_at is not null
         ),
         (select count(*)::text from auth.users where email ~* '@kleio\\.demo$' and email_confirmed_at is not null),
         '0 confirmed live auth accounts using demo email domains'
)
select check_name, passed, observed, expected, now() as checked_at
from checks;

revoke all on public.kleio_production_verification from public, anon, authenticated;
grant select on public.kleio_production_verification to service_role;

commit;
