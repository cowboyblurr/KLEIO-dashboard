-- Extend deterministic document comparison into the five-layer review model.
-- Layer 3: multi-source correlation.
-- Layer 4: cautious practice-language hypothesis supported by multiple sources.
-- Layer 5: unresolved conflict or insufficient evidence.

create or replace function public.refresh_my_document_correlations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  correlation_count integer := 0;
  hypothesis_count integer := 0;
  conflict_count integer := 0;
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
      and proposal.relationship_status not in ('conflict','unresolved')
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
      else format('“%s” appears in %s private documents with more than one evidence fingerprint. Review every source excerpt before using this as confirmed Passport language.', left(representative_value, 500), source_count)
    end,
    target_field,
    evidence,
    source_count,
    case when fingerprint_count >= 2 and source_count >= 3 then 'high' else 'moderate' end,
    fingerprint_count = 1,
    'proposed',
    'document_correlation_v1'
  from grouped;

  get diagnostics correlation_count = row_count;

  with practice_claims as (
    select
      proposal.id,
      proposal.source_id,
      proposal.target_field,
      proposal.normalized_key,
      proposal.proposed_value,
      proposal.evidence_excerpt,
      proposal.page_number,
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
      and proposal.relationship_status not in ('conflict','unresolved')
      and proposal.normalized_key <> ''
      and proposal.target_field in (
        'disciplines','mediums','materials','themes','techniques','practice_description',
        'research_interests','audience_community','collaboration','technology_use'
      )
  ),
  grouped as (
    select
      target_field,
      normalized_key,
      min(proposed_value) as representative_value,
      count(distinct source_id)::integer as source_count,
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
    from practice_claims
    group by target_field, normalized_key
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
    'practice_pattern',
    4,
    'Possible recurring practice language',
    format('Across these documents, KLEIO noticed “%s” appears repeatedly and may be relevant to how you describe your practice. This is an interpretive hypothesis, not a verified fact or a statement of intent. Confirm, revise, defer, or dismiss it.', left(representative_value, 500)),
    target_field,
    evidence,
    source_count,
    'artist_confirmation_required',
    false,
    'proposed',
    'document_correlation_v1'
  from grouped;

  get diagnostics hypothesis_count = row_count;

  with conflicted as (
    select
      proposal.target_field,
      coalesce(nullif(proposal.normalized_key, ''), proposal.id::text) as conflict_key,
      count(distinct proposal.source_id)::integer as source_count,
      jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'proposal_id', proposal.id,
          'source_id', proposal.source_id,
          'page', proposal.page_number,
          'excerpt', nullif(proposal.evidence_excerpt, ''),
          'proposed_value', left(proposal.proposed_value, 1000),
          'relationship_status', proposal.relationship_status
        ))
        order by proposal.created_at, proposal.id
      ) as evidence
    from public.artist_import_proposals proposal
    join public.artist_import_sources source_row
      on source_row.id = proposal.source_id
     and source_row.artist_user_id = actor
     and source_row.deleted_at is null
    where proposal.artist_user_id = actor
      and proposal.sensitivity = 'standard'
      and (
        proposal.relationship_status in ('conflict','unresolved')
        or proposal.status in ('conflicting','needs_clarification')
      )
      and proposal.status not in ('rejected','outdated','superseded')
    group by proposal.target_field, coalesce(nullif(proposal.normalized_key, ''), proposal.id::text)
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
    'conflicting_evidence',
    5,
    'Conflicting or incomplete evidence',
    'The private sources do not support one reliable conclusion. Review the evidence, correct the source classification if needed, and decide whether to replace, keep both, defer, or reject the related Passport proposal.',
    target_field,
    evidence,
    greatest(source_count, 1),
    'conflicting_evidence',
    false,
    'proposed',
    'document_correlation_v1'
  from conflicted;

  get diagnostics conflict_count = row_count;

  return jsonb_build_object(
    'correlations_created', correlation_count,
    'interpretive_hypotheses_created', hypothesis_count,
    'conflicts_created', conflict_count,
    'artist_confirmation_required', true,
    'interpretations_are_not_facts', true
  );
end;
$$;

revoke all on function public.refresh_my_document_correlations() from public, anon;
grant execute on function public.refresh_my_document_correlations() to authenticated;

comment on function public.refresh_my_document_correlations() is
  'Rebuilds owner-scoped Layer 3 correlations, cautious Layer 4 practice hypotheses and Layer 5 conflicts from source-backed proposals. No result becomes a confirmed Passport fact automatically.';
