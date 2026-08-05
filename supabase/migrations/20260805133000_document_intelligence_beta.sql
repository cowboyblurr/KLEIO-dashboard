-- KLEIO artist-beta document intelligence
-- Activates direct PDF upload while preserving the existing canonical source,
-- extraction, proposal, Passport-record and document-version architecture.

update public.kleio_import_source_availability
set artist_beta_enabled = case
      when source_type in ('device_document', 'pdf', 'existing_kleio_media') then true
      else false
    end,
    availability_note = case source_type
      when 'device_document' then 'Active beta path for direct artist-controlled PDF upload.'
      when 'pdf' then 'Active beta path for private PDF document analysis.'
      when 'existing_kleio_media' then 'Private KLEIO document reanalysis is available when the source is still owned by the artist.'
      when 'google_drive_document' then 'Deferred. The secure Drive foundation is preserved but is not part of the initial document beta.'
      when 'google_drive_image' then 'Deferred. The secure Drive foundation is preserved but is not part of the initial document beta.'
      when 'instagram_image' then 'Deferred. Instagram does not compete with direct PDF upload in the initial document beta.'
      when 'website' then 'Deferred unless separately authorized through a later release decision.'
      when 'device_image' then 'Not part of the document-intelligence beta entry flow.'
      when 'pasted_text' then 'Deferred as a primary import method; existing internal support remains preserved.'
      when 'voice_transcript' then 'Deferred as a primary import method.'
      else availability_note
    end,
    updated_at = now();

alter table public.artist_import_sources
  add column if not exists artist_selected_document_type text not null default 'unknown',
  add column if not exists analysis_stage text not null default 'not_started',
  add column if not exists text_layer_status text not null default 'unknown',
  add column if not exists ocr_status text not null default 'not_required',
  add column if not exists page_count integer,
  add column if not exists analysis_consent_at timestamptz,
  add column if not exists analysis_deleted_at timestamptz,
  add column if not exists keep_without_analysis boolean not null default false;

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_artist_selected_document_type_check;
alter table public.artist_import_sources
  add constraint artist_import_sources_artist_selected_document_type_check
  check (artist_selected_document_type = any (array[
    'artist_cv','biography','artist_statement','practice_description','portfolio_document',
    'exhibition_history','project_proposal','grant_application','budget','press_publication',
    'work_sample_list','residency_material','reference_document','general_artist_material',
    'sensitive_eligibility_document','mixed_document','unknown'
  ]));

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_analysis_stage_check;
alter table public.artist_import_sources
  add constraint artist_import_sources_analysis_stage_check
  check (analysis_stage = any (array[
    'not_started','uploading','checking_file','reading_structure','identifying_information',
    'comparing_passport','preparing_review','review_ready','needs_attention','review_completed',
    'stopped','failed'
  ]));

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_text_layer_status_check;
alter table public.artist_import_sources
  add constraint artist_import_sources_text_layer_status_check
  check (text_layer_status = any (array['unknown','available','partial','unavailable']));

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_ocr_status_check;
alter table public.artist_import_sources
  add constraint artist_import_sources_ocr_status_check
  check (ocr_status = any (array['not_required','required','not_configured','processing','completed','failed']));

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_page_count_check;
alter table public.artist_import_sources
  add constraint artist_import_sources_page_count_check
  check (page_count is null or page_count between 1 and 250);

alter table public.artist_extraction_jobs
  add column if not exists page_text jsonb not null default '[]'::jsonb,
  add column if not exists document_structure jsonb not null default '{}'::jsonb,
  add column if not exists analysis_layers jsonb not null default '{}'::jsonb,
  add column if not exists warnings jsonb not null default '[]'::jsonb,
  add column if not exists analysis_version text not null default 'document_intelligence_v1',
  add column if not exists native_text_status text not null default 'unknown',
  add column if not exists ocr_status text not null default 'not_required';

alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_page_text_array;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_page_text_array check (jsonb_typeof(page_text) = 'array');
alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_structure_object;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_structure_object check (jsonb_typeof(document_structure) = 'object');
alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_layers_object;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_layers_object check (jsonb_typeof(analysis_layers) = 'object');
alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_warnings_array;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_warnings_array check (jsonb_typeof(warnings) = 'array');
alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_native_text_status_check;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_native_text_status_check
  check (native_text_status = any (array['unknown','available','partial','unavailable']));
alter table public.artist_extraction_jobs
  drop constraint if exists artist_extraction_jobs_ocr_status_check;
alter table public.artist_extraction_jobs
  add constraint artist_extraction_jobs_ocr_status_check
  check (ocr_status = any (array['not_required','required','not_configured','processing','completed','failed']));

alter table public.artist_import_proposals
  add column if not exists analysis_layer smallint not null default 1,
  add column if not exists confidence_state text not null default 'artist_confirmation_required',
  add column if not exists supporting_evidence jsonb not null default '[]'::jsonb,
  add column if not exists supporting_source_count integer not null default 1,
  add column if not exists bulk_confirm_eligible boolean not null default false,
  add column if not exists interpretation_kind text not null default '';

alter table public.artist_import_proposals
  drop constraint if exists artist_import_proposals_analysis_layer_check;
alter table public.artist_import_proposals
  add constraint artist_import_proposals_analysis_layer_check check (analysis_layer between 1 and 5);
alter table public.artist_import_proposals
  drop constraint if exists artist_import_proposals_confidence_state_check;
alter table public.artist_import_proposals
  add constraint artist_import_proposals_confidence_state_check
  check (confidence_state = any (array[
    'high','moderate','low','artist_confirmation_required','conflicting_evidence','insufficient_evidence'
  ]));
alter table public.artist_import_proposals
  drop constraint if exists artist_import_proposals_supporting_evidence_array;
alter table public.artist_import_proposals
  add constraint artist_import_proposals_supporting_evidence_array check (jsonb_typeof(supporting_evidence) = 'array');
alter table public.artist_import_proposals
  drop constraint if exists artist_import_proposals_supporting_source_count_check;
alter table public.artist_import_proposals
  add constraint artist_import_proposals_supporting_source_count_check check (supporting_source_count > 0);

create table if not exists public.artist_document_correlations (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  correlation_type text not null,
  analysis_layer smallint not null default 3,
  title text not null,
  summary text not null,
  related_passport_field text not null default '',
  supporting_evidence jsonb not null default '[]'::jsonb,
  supporting_source_count integer not null default 1,
  confidence_state text not null default 'moderate',
  inheritance_risk boolean not null default false,
  status text not null default 'proposed',
  artist_edited_text text not null default '',
  artist_feedback text not null default '',
  model_provider text not null default '',
  model_name text not null default '',
  analysis_version text not null default 'document_correlation_v1',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_document_correlations_type_check check (correlation_type = any (array[
    'repeated_evidence','repeated_artist_language','practice_pattern','practice_evolution',
    'geographic_connection','institutional_relationship','collaboration_pattern','career_highlight',
    'duplicate_record','conflicting_evidence','missing_context','interpretive_hypothesis'
  ])),
  constraint artist_document_correlations_layer_check check (analysis_layer between 3 and 5),
  constraint artist_document_correlations_title_check check (char_length(title) between 1 and 240),
  constraint artist_document_correlations_summary_check check (char_length(summary) between 1 and 6000),
  constraint artist_document_correlations_evidence_array check (jsonb_typeof(supporting_evidence) = 'array'),
  constraint artist_document_correlations_source_count_check check (supporting_source_count > 0),
  constraint artist_document_correlations_confidence_check check (confidence_state = any (array[
    'high','moderate','low','artist_confirmation_required','conflicting_evidence','insufficient_evidence'
  ])),
  constraint artist_document_correlations_status_check check (status = any (array[
    'proposed','confirmed_useful_language','dismissed','inaccurate','deferred'
  ]))
);

alter table public.artist_document_correlations enable row level security;
revoke all on table public.artist_document_correlations from anon;
grant select, insert, update, delete on table public.artist_document_correlations to authenticated;

drop policy if exists artist_document_correlations_manage_own on public.artist_document_correlations;
create policy artist_document_correlations_manage_own
on public.artist_document_correlations
for all
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

create index if not exists artist_document_correlations_owner_status_idx
  on public.artist_document_correlations (artist_user_id, status, updated_at desc);
create index if not exists artist_document_correlations_owner_type_idx
  on public.artist_document_correlations (artist_user_id, correlation_type);

create or replace function private.sync_artist_document_analysis_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  summary jsonb := coalesce(new.review_summary, '{}'::jsonb);
begin
  new.page_count := coalesce(
    nullif(summary->>'total_pages', '')::integer,
    new.page_count
  );

  if coalesce((summary->>'ocr_required')::boolean, false) then
    new.text_layer_status := 'unavailable';
    new.ocr_status := case when new.ocr_status = 'completed' then 'completed' else 'not_configured' end;
  elsif coalesce((summary->>'text_layer_available')::boolean, false) then
    new.text_layer_status := 'available';
    new.ocr_status := 'not_required';
  end if;

  new.analysis_stage := case new.extraction_status
    when 'pending' then 'not_started'
    when 'queued' then 'checking_file'
    when 'processing' then 'reading_structure'
    when 'ready_for_review' then 'review_ready'
    when 'review_ready' then 'review_ready'
    when 'partially_extracted' then 'needs_attention'
    when 'partial' then 'needs_attention'
    when 'failed' then 'failed'
    when 'artist_review_completed' then 'review_completed'
    else new.analysis_stage
  end;

  return new;
exception when invalid_text_representation then
  return new;
end;
$$;

drop trigger if exists sync_artist_document_analysis_state on public.artist_import_sources;
create trigger sync_artist_document_analysis_state
before insert or update of extraction_status, review_summary
on public.artist_import_sources
for each row
execute function private.sync_artist_document_analysis_state();

create or replace function private.set_artist_proposal_intelligence_defaults()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.analysis_layer := case
    when new.relationship_status in ('conflict','unresolved') or new.status in ('conflicting','needs_clarification')
      then 5
    when new.extraction_method ilike '%interpret%'
      then 4
    when new.extraction_method ilike '%correlation%'
      then 3
    when new.claim_type in ('bio','artist_statement','practice_description','project_description','project_summary')
      then 2
    else 1
  end;

  new.confidence_state := case
    when new.relationship_status = 'conflict' or new.status = 'conflicting' then 'conflicting_evidence'
    when new.relationship_status = 'unresolved' then 'insufficient_evidence'
    when new.confidence is null then 'artist_confirmation_required'
    when new.confidence >= 0.85 then 'high'
    when new.confidence >= 0.65 then 'moderate'
    else 'low'
  end;

  if jsonb_array_length(coalesce(new.supporting_evidence, '[]'::jsonb)) = 0 then
    new.supporting_evidence := jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'source_id', new.source_id,
      'page', new.page_number,
      'excerpt', nullif(new.evidence_excerpt, ''),
      'extraction_method', new.extraction_method
    )));
  end if;

  new.bulk_confirm_eligible :=
    new.analysis_layer = 1
    and new.confidence_state = 'high'
    and new.status = 'proposed'
    and new.relationship_status = 'new'
    and new.sensitivity = 'standard';

  return new;
end;
$$;

drop trigger if exists set_artist_proposal_intelligence_defaults on public.artist_import_proposals;
create trigger set_artist_proposal_intelligence_defaults
before insert or update of confidence, status, relationship_status, extraction_method, evidence_excerpt, page_number
on public.artist_import_proposals
for each row
execute function private.set_artist_proposal_intelligence_defaults();

update public.artist_import_proposals
set confidence = confidence,
    updated_at = updated_at;

update public.artist_import_sources
set extraction_status = extraction_status,
    review_summary = review_summary,
    updated_at = updated_at;

create or replace function public.refresh_my_document_correlations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  inserted_count integer := 0;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  delete from public.artist_document_correlations
  where artist_user_id = actor
    and status = 'proposed'
    and model_provider = ''
    and analysis_version = 'document_correlation_v1';

  with eligible_claims as (
    select
      proposal.id,
      proposal.source_id,
      proposal.claim_type,
      proposal.target_field,
      proposal.normalized_key,
      proposal.proposed_value,
      proposal.evidence_excerpt,
      proposal.page_number,
      proposal.fingerprint,
      source_row.created_at as source_created_at,
      source_row.document_version
    from public.artist_import_proposals proposal
    join public.artist_import_sources source_row
      on source_row.id = proposal.source_id
     and source_row.artist_user_id = actor
     and source_row.deleted_at is null
    where proposal.artist_user_id = actor
      and proposal.sensitivity = 'standard'
      and proposal.status not in ('rejected','source_unavailable','extraction_failed','outdated','superseded')
      and proposal.relationship_status <> 'conflict'
      and proposal.normalized_key <> ''
      and proposal.claim_type not in ('supporting_document','eligibility_document','reference_record')
  ),
  grouped as (
    select
      claim_type,
      target_field,
      normalized_key,
      min(proposed_value) as representative_value,
      count(distinct source_id)::integer as source_count,
      count(distinct fingerprint)::integer as fingerprint_count,
      min(source_created_at) as first_seen_at,
      max(source_created_at) as last_seen_at,
      jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'proposal_id', id,
          'source_id', source_id,
          'page', page_number,
          'excerpt', nullif(evidence_excerpt, ''),
          'document_version', document_version
        ))
        order by source_created_at, id
      ) as evidence
    from eligible_claims
    group by claim_type, target_field, normalized_key
    having count(distinct source_id) >= 2
  )
  insert into public.artist_document_correlations (
    artist_user_id,
    correlation_type,
    analysis_layer,
    title,
    summary,
    related_passport_field,
    supporting_evidence,
    supporting_source_count,
    confidence_state,
    inheritance_risk,
    status,
    analysis_version
  )
  select
    actor,
    case when fingerprint_count = 1 then 'repeated_artist_language' else 'repeated_evidence' end,
    3,
    case
      when fingerprint_count = 1 then 'Repeated artist-authored language'
      else 'Repeated evidence across documents'
    end,
    case
      when fingerprint_count = 1
        then format('“%s” appears in %s private documents. The wording may have been copied between versions, so KLEIO treats this as repeated language rather than independent confirmation.', left(representative_value, 500), source_count)
      else format('“%s” appears in %s private documents with more than one evidence fingerprint. Review the source excerpts before using this as confirmed Passport language.', left(representative_value, 500), source_count)
    end,
    target_field,
    evidence,
    source_count,
    case when fingerprint_count >= 2 and source_count >= 3 then 'high' else 'moderate' end,
    fingerprint_count = 1,
    'proposed',
    'document_correlation_v1'
  from grouped;

  get diagnostics inserted_count = row_count;

  return jsonb_build_object(
    'correlations_created', inserted_count,
    'artist_confirmation_required', true,
    'interpretations_are_not_facts', true
  );
end;
$$;

revoke all on function public.refresh_my_document_correlations() from public, anon;
grant execute on function public.refresh_my_document_correlations() to authenticated;

comment on function public.refresh_my_document_correlations() is
  'Rebuilds owner-scoped deterministic multi-document correlations from source-backed proposals. Repetition is not treated as independent proof when the evidence fingerprint is identical.';