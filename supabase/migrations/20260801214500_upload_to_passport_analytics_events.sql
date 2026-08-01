alter table public.product_events drop constraint if exists product_events_event_name_check;
alter table public.product_events add constraint product_events_event_name_check
  check (event_name = any (array[
    'landing_viewed','carousel_viewed','carousel_manual_advanced','carousel_card_selected',
    'explore_opportunities_selected','creative_passport_selected','institution_section_viewed',
    'institution_signup_selected','login_selected','public_directory_viewed','search_performed',
    'filter_applied','opportunity_opened','official_source_opened','check_fit_selected','save_selected',
    'prepare_selected','signup_prompted','signup_started','signup_submitted','signup_validation_failed',
    'account_created','confirmation_required','confirmation_completed','opportunity_restoration_completed',
    'opportunity_restoration_failed','passport_mode_selected','guided_step_completed','guided_step_skipped',
    'onboarding_resumed','onboarding_save_failed','onboarding_step_viewed','onboarding_validation_failed',
    'onboarding_step_completed','onboarding_step_skipped','onboarding_completed','import_started',
    'import_completed','proposal_approved','proposal_rejected','review_opened','claim_confirmed',
    'claim_rejected','claim_deferred','duplicate_merged','claims_bulk_confirmed',
    'voice_capability_detected','voice_started','voice_completed','autosave_succeeded','autosave_failed',
    'draft_restored','conflict_detected'
  ]));
