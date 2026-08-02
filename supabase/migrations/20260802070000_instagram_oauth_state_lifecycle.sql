alter table public.artist_instagram_oauth_states
  add column if not exists processing_at timestamptz,
  add column if not exists last_failure_category text not null default '';

alter table public.artist_instagram_oauth_states
  alter column expires_at set default (now() + interval '15 minutes');

create index if not exists artist_instagram_oauth_states_processing_idx
  on public.artist_instagram_oauth_states (processing_at)
  where used_at is null;

comment on column public.artist_instagram_oauth_states.processing_at is
  'Short-lived callback claim used to prevent concurrent processing without consuming the OAuth state.';
comment on column public.artist_instagram_oauth_states.last_failure_category is
  'Safe normalized category from the most recent callback failure; never stores codes, tokens, state values, or secrets.';
