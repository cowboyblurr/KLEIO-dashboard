alter table public.artist_website_import_sessions
  add column if not exists scan_summary jsonb not null default '{}'::jsonb,
  add column if not exists dismissed_at timestamptz;

alter table public.artist_website_import_sessions
  drop constraint if exists artist_website_import_sessions_status_check;

alter table public.artist_website_import_sessions
  add constraint artist_website_import_sessions_status_check check (
    status = any (array[
      'analyzing',
      'review_ready',
      'limited_review',
      'image_only_review',
      'manual_input_recommended',
      'importing',
      'completed',
      'failed',
      'blocked',
      'expired',
      'dismissed'
    ])
  );

alter table public.artist_website_import_sessions
  drop constraint if exists artist_website_import_sessions_scan_summary_object;

alter table public.artist_website_import_sessions
  add constraint artist_website_import_sessions_scan_summary_object
  check (jsonb_typeof(scan_summary) = 'object');

create index if not exists artist_website_import_sessions_active_owner_idx
  on public.artist_website_import_sessions (artist_user_id, created_at desc)
  where status not in ('dismissed', 'expired');

comment on column public.artist_website_import_sessions.scan_summary is
  'Evidence-quality and collection-coverage summary for the artist-facing Website Import review.';

comment on column public.artist_website_import_sessions.dismissed_at is
  'When the artist cleared this scan from the active review workflow. Historical audit rows remain preserved.';
