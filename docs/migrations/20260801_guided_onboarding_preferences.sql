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

alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check
  check (
    event_name = any (
      array[
        'landing_viewed'::text,
        'carousel_viewed'::text,
        'carousel_manual_advanced'::text,
        'carousel_card_selected'::text,
        'explore_opportunities_selected'::text,
        'creative_passport_selected'::text,
        'institution_section_viewed'::text,
        'institution_signup_selected'::text,
        'login_selected'::text,
        'public_directory_viewed'::text,
        'search_performed'::text,
        'filter_applied'::text,
        'opportunity_opened'::text,
        'official_source_opened'::text,
        'check_fit_selected'::text,
        'save_selected'::text,
        'prepare_selected'::text,
        'signup_prompted'::text,
        'signup_started'::text,
        'signup_submitted'::text,
        'signup_validation_failed'::text,
        'account_created'::text,
        'confirmation_required'::text,
        'confirmation_completed'::text,
        'opportunity_restoration_completed'::text,
        'opportunity_restoration_failed'::text,
        'passport_mode_selected'::text,
        'guided_step_completed'::text,
        'guided_step_skipped'::text,
        'onboarding_resumed'::text,
        'onboarding_save_failed'::text,
        'onboarding_step_viewed'::text,
        'onboarding_validation_failed'::text,
        'onboarding_step_completed'::text,
        'onboarding_step_skipped'::text,
        'onboarding_completed'::text,
        'import_started'::text,
        'import_completed'::text,
        'proposal_approved'::text,
        'proposal_rejected'::text,
        'voice_capability_detected'::text,
        'voice_started'::text,
        'voice_completed'::text,
        'autosave_succeeded'::text,
        'autosave_failed'::text,
        'draft_restored'::text,
        'conflict_detected'::text
      ]
    )
  );
