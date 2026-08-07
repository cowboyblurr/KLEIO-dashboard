begin;

alter table public.artist_ai_usage_events
  drop constraint if exists artist_ai_usage_events_action_check;

alter table public.artist_ai_usage_events
  add constraint artist_ai_usage_events_action_check
  check (action = any (array[
    'analyze_practice'::text,
    'generate_draft'::text,
    'generate_application_answer'::text,
    'organize_website_evidence'::text,
    'analyze_document'::text
  ]));

comment on column public.artist_ai_usage_events.action is
  'Metered AI action. generate_application_answer is separated from general drafting so application-composer prompt and token costs can be measured independently for pricing.';

commit;