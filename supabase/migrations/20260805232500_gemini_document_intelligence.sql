begin;

alter table public.artist_ai_usage_events
  drop constraint if exists artist_ai_usage_events_action_check;

alter table public.artist_ai_usage_events
  add constraint artist_ai_usage_events_action_check
  check (action = any (array[
    'analyze_practice'::text,
    'generate_draft'::text,
    'organize_website_evidence'::text,
    'analyze_document'::text
  ]));

create index if not exists artist_ai_usage_events_document_daily_idx
  on public.artist_ai_usage_events (artist_user_id, action, created_at desc)
  where action = 'analyze_document';

comment on constraint artist_ai_usage_events_action_check on public.artist_ai_usage_events is
  'Canonical server-side AI actions. analyze_document records Gemini PDF analysis without document text, filenames, private URLs, or model output.';

comment on index public.artist_ai_usage_events_document_daily_idx is
  'Supports owner-scoped Gemini document rate and cost controls without storing private document content.';

commit;
