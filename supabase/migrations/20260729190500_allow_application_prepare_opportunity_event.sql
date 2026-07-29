-- The production artist directory already emits `application_prepare`.
-- Keep the database constraint aligned so the event is not silently discarded.

alter table public.opportunity_events
  drop constraint if exists opportunity_events_event_name_check;

alter table public.opportunity_events
  add constraint opportunity_events_event_name_check
  check (event_name = any (array[
    'search'::text,
    'zero_results'::text,
    'view'::text,
    'save'::text,
    'unsave'::text,
    'external_application_click'::text,
    'internal_application_start'::text,
    'provider_submission'::text,
    'application_prepare'::text
  ]));
