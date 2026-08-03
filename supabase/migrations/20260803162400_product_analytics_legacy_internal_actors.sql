insert into private.analytics_internal_actors (
  user_id,
  traffic_class,
  note
)
select distinct
  event_row.actor_user_id,
  'internal_qa',
  'Authenticated actor present in the pre-architecture analytics dataset; conservatively excluded from the founding real-user baseline.'
from public.product_events event_row
where event_row.actor_user_id is not null
  and event_row.release_channel = 'legacy_pre_beta'
on conflict (user_id) do nothing;

update public.product_events event_row
set traffic_class = 'internal_qa'
where event_row.actor_user_id in (
  select internal_actor.user_id
  from private.analytics_internal_actors internal_actor
)
and event_row.traffic_class <> 'internal_qa';

comment on table private.analytics_internal_actors is
  'Private internal-QA actor registry. Includes KLEIO administrators and authenticated actors observed in the verified pre-beta analytics dataset so testing cannot inflate founding real-user reporting.';
