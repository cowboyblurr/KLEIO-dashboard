-- Privacy-safe product analytics contract for artist document intelligence.

insert into private.product_event_definitions (
  event_name,
  event_version,
  product_area,
  public_allowed,
  durable_milestone
)
values
  ('document_upload_started',1,'creative_passport',false,false),
  ('document_upload_completed',1,'creative_passport',false,false),
  ('document_upload_failed',1,'creative_passport',false,false),
  ('document_analysis_started',1,'creative_passport',false,false),
  ('document_analysis_completed',1,'creative_passport',false,false),
  ('document_analysis_partial',1,'creative_passport',false,false),
  ('document_analysis_failed',1,'creative_passport',false,false),
  ('document_ocr_required',1,'creative_passport',false,false),
  ('document_classification_corrected',1,'creative_passport',false,false),
  ('passport_proposal_confirmed',1,'creative_passport',false,false),
  ('passport_proposal_edited',1,'creative_passport',false,false),
  ('passport_proposal_rejected',1,'creative_passport',false,false),
  ('passport_conflict_resolved',1,'creative_passport',false,false),
  ('interpretation_confirmed',1,'creative_passport',false,false),
  ('interpretation_dismissed',1,'creative_passport',false,false),
  ('biography_draft_requested',1,'creative_passport',false,false),
  ('biography_draft_saved',1,'creative_passport',false,false)
on conflict (event_name) do update
set event_version = excluded.event_version,
    product_area = excluded.product_area,
    public_allowed = excluded.public_allowed,
    durable_milestone = excluded.durable_milestone,
    updated_at = now();

alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check check (
    event_name in (
      'landing_viewed','artist_signup_selected','creative_passport_selected','explore_opportunities_selected','public_directory_viewed','opportunity_opened',
      'signup_started','signup_validation_failed','signup_submitted','account_created','confirmation_required','confirmation_completed','login_completed','login_failed','session_expired','session_recovered',
      'onboarding_started','onboarding_step_viewed','onboarding_step_completed','onboarding_step_skipped','onboarding_validation_failed','onboarding_save_failed','onboarding_saved_and_exited','onboarding_resumed','onboarding_completed',
      'passport_started','passport_mode_selected','passport_section_started','passport_section_completed','passport_save_failed','proposal_review_opened','proposal_approved','proposal_rejected','passport_record_confirmed',
      'document_upload_started','document_upload_completed','document_upload_failed','document_analysis_started','document_analysis_completed','document_analysis_partial','document_analysis_failed','document_ocr_required','document_classification_corrected',
      'passport_proposal_confirmed','passport_proposal_edited','passport_proposal_rejected','passport_conflict_resolved','interpretation_confirmed','interpretation_dismissed','biography_draft_requested','biography_draft_saved',
      'import_source_selected','upload_started','upload_succeeded','upload_failed','import_started','import_completed','import_partially_completed','import_failed','artwork_record_saved','artwork_record_save_failed','portfolio_inclusion_confirmed','draft_restored','autosave_succeeded','autosave_failed',
      'opportunity_directory_viewed','search_performed','filter_applied','search_no_results','official_source_opened','opportunity_saved','opportunity_unsaved','readiness_viewed','prepare_selected','application_preparation_started',
      'user_visible_error','workflow_recovery_offered','workflow_recovered','support_selected','feedback_started','feedback_submitted','first_value_reached','artist_activated',
      'institution_section_viewed','institution_signup_selected','carousel_viewed','carousel_manual_advanced','carousel_card_selected','login_selected','check_fit_selected','save_selected','signup_prompted',
      'opportunity_restoration_completed','opportunity_restoration_failed','guided_step_completed','guided_step_skipped','review_opened','claim_confirmed','claim_rejected','claim_deferred','duplicate_merged','claims_bulk_confirmed','voice_capability_detected','voice_started','voice_completed','conflict_detected'
    )
  );

comment on constraint product_events_event_name_check on public.product_events is
  'Allows the canonical founding-artist beta event vocabulary, including privacy-safe document-intelligence workflow events. Document text, filenames, excerpts and artist identity remain prohibited analytics metadata.';
