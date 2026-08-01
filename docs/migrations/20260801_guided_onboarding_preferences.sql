alter table public.artist_profiles
  add column if not exists onboarding_preferences jsonb not null default '{}'::jsonb;

alter table public.institutions
  add column if not exists onboarding_preferences jsonb not null default '{}'::jsonb;

comment on column public.artist_profiles.onboarding_preferences is
  'Artist-selected onboarding preferences used to personalize initial workspace recommendations.';

comment on column public.institutions.onboarding_preferences is
  'Institution-selected onboarding preferences used to personalize initial workspace recommendations.';

alter table public.institutions
  drop constraint if exists institutions_organization_type_check;

alter table public.institutions
  add constraint institutions_organization_type_check
  check (
    organization_type = any (
      array[
        'museum'::text,
        'gallery'::text,
        'arts_nonprofit'::text,
        'foundation'::text,
        'residency'::text,
        'university_college'::text,
        'cultural_organization'::text,
        'government_arts_agency'::text,
        'independent_curatorial_organization'::text,
        'grantmaking_organization'::text,
        'festival_biennial'::text,
        'artist_run_organization'::text,
        'other'::text
      ]
    )
  );
