alter table public.artist_profiles
  add column if not exists onboarding_preferences jsonb not null default '{}'::jsonb;

alter table public.institutions
  add column if not exists onboarding_preferences jsonb not null default '{}'::jsonb;

comment on column public.artist_profiles.onboarding_preferences is
  'Artist-selected onboarding preferences used to personalize initial workspace recommendations.';

comment on column public.institutions.onboarding_preferences is
  'Institution-selected onboarding preferences used to personalize initial workspace recommendations.';
