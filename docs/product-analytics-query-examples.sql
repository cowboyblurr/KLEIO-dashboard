-- KLEIO PRODUCT ANALYTICS QUERY EXAMPLES
--
-- The application dashboard should use the aggregate administrator RPC.
-- Raw product_events access is for protected database operations only and remains
-- subject to administrator RLS or service-role execution.

-- 1. Aggregate 30-day real-user dashboard snapshot.
select public.get_kleio_admin_analytics_snapshot(
  range_start => now() - interval '30 days',
  range_end => now(),
  requested_traffic_class => 'real_user',
  requested_acquisition_source => null,
  requested_viewport => null
);

-- 2. Aggregate activated artists attributed to LinkedIn.
select public.get_kleio_admin_analytics_snapshot(
  range_start => now() - interval '90 days',
  range_end => now(),
  requested_traffic_class => 'real_user',
  requested_acquisition_source => 'linkedin',
  requested_viewport => null
);

-- 3. Aggregate mobile friction only.
select public.get_kleio_admin_analytics_snapshot(
  range_start => now() - interval '30 days',
  range_end => now(),
  requested_traffic_class => 'real_user',
  requested_acquisition_source => null,
  requested_viewport => 'mobile'
);

-- 4. Protected ingestion-quality check. Do not expose this raw query in the browser.
select
  traffic_class,
  event_name,
  count(*) as event_count,
  count(distinct actor_user_id) filter (where actor_user_id is not null) as authenticated_actors,
  count(distinct anonymous_session_id) as anonymous_sessions
from public.product_events
where occurred_at >= now() - interval '30 days'
group by traffic_class, event_name
order by traffic_class, event_count desc, event_name;

-- 5. Protected rejection-quality check. Private schema; service-role operations only.
select
  rejection_code,
  traffic_class,
  count(*) as rejected_attempts,
  max(created_at) as last_rejected_at
from private.product_event_ingestion_rejections
where created_at >= now() - interval '30 days'
group by rejection_code, traffic_class
order by rejected_attempts desc, rejection_code;

-- 6. Protected milestone completeness check. No artist content is selected.
select
  count(*) as artist_accounts,
  count(*) filter (where confirmation_completed_at is not null) as confirmed_accounts,
  count(*) filter (where onboarding_completed_at is not null) as onboarding_completed,
  count(*) filter (where first_value_at is not null) as first_value_reached,
  count(*) filter (where activated_at is not null) as activated_artists
from public.artist_product_milestones;
