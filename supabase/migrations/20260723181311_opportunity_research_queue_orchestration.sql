create or replace function public.create_or_resume_opportunity_research(target_opportunity_id uuid, force_new boolean default false)
returns table(session_id uuid, job_id uuid, research_status text)
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  resolved_session_id uuid;
  resolved_job_id uuid;
  queue_id bigint;
  idempotency text;
  feature_enabled boolean;
begin
  if current_user_id is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles p where p.id = current_user_id and p.role::text = 'artist') then
    raise exception 'Only an artist account can start opportunity research.' using errcode = '42501';
  end if;
  select enabled into feature_enabled from public.kleio_feature_flags where key = 'opportunity_research';
  if coalesce(feature_enabled, false) is not true then raise exception 'Opportunity research is currently unavailable.' using errcode = '55000'; end if;
  if not exists (
    select 1 from public.opportunities o join public.opportunity_sources s on s.id = o.source_id
    where o.id = target_opportunity_id and o.status in ('open','forecasted','upcoming')
      and (o.deadline_at is null or o.deadline_at >= now()) and o.duplicate_of is null and s.active
  ) then raise exception 'This opportunity is unavailable or no longer active.' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || target_opportunity_id::text, 0));
  if not force_new then
    select s.id, s.latest_job_id into resolved_session_id, resolved_job_id
    from public.opportunity_research_sessions s
    where s.artist_user_id = current_user_id and s.opportunity_id = target_opportunity_id
      and (s.status in ('queued','acquiring_source','parsing_source','ocr_pending','extracting_requirements','resolving_conflicts','matching_passport','building_package','running','retry_scheduled')
        or (s.status in ('artist_review_required','complete','succeeded','partial','blocked','failed') and s.created_at >= now() - interval '24 hours'))
    order by s.created_at desc limit 1;
    if resolved_session_id is not null then
      return query select resolved_session_id, resolved_job_id, (select s.status from public.opportunity_research_sessions s where s.id = resolved_session_id);
      return;
    end if;
  end if;

  if (select count(*) from public.opportunity_research_jobs j where j.artist_user_id = current_user_id and j.created_at >= now() - interval '1 hour') >= 10 then
    raise exception 'Research limit reached. Try again after the current hourly window.' using errcode = '54000';
  end if;
  if exists (select 1 from public.opportunity_research_jobs j where j.artist_user_id = current_user_id and j.opportunity_id = target_opportunity_id and j.created_at >= now() - interval '30 seconds') then
    raise exception 'A research request for this opportunity was just created.' using errcode = '55000';
  end if;

  insert into public.opportunity_research_sessions (artist_user_id, opportunity_id, status, current_stage, progress_percent, worker_version, extraction_version, metadata)
  values (current_user_id, target_opportunity_id, 'queued', 'queued', 0, 'opportunity-research-worker-v1', 'deterministic-v2', jsonb_build_object('initiated_from','application_preparation','force_new',force_new))
  returning id into resolved_session_id;

  insert into public.opportunity_research_steps (session_id, step_key, label, status, user_message, sort_order) values
    (resolved_session_id, 'acquiring_source', 'Locate and acquire official sources', 'queued', 'Waiting to review official public sources.', 10),
    (resolved_session_id, 'parsing_source', 'Parse source structure and documents', 'queued', 'Waiting to inspect source content and documents.', 20),
    (resolved_session_id, 'extracting_requirements', 'Extract requirements and eligibility', 'queued', 'Waiting to identify source-backed requirements.', 30),
    (resolved_session_id, 'resolving_conflicts', 'Resolve source conflicts', 'queued', 'Waiting to compare conflicting source statements.', 40),
    (resolved_session_id, 'matching_passport', 'Compare with Creative Passport', 'queued', 'Waiting to compare requirements with your materials.', 50),
    (resolved_session_id, 'building_package', 'Prepare artist review package', 'queued', 'Waiting to prepare your review workspace.', 60)
  on conflict (session_id, step_key) do nothing;

  idempotency := encode(digest(current_user_id::text || ':' || target_opportunity_id::text || ':' || resolved_session_id::text, 'sha256'), 'hex');
  insert into public.opportunity_research_jobs (artist_user_id, opportunity_id, session_id, job_type, current_stage, status, idempotency_key, priority, scheduled_at, worker_version, extraction_version)
  values (current_user_id, target_opportunity_id, resolved_session_id, 'full_research', 'queued', 'queued', idempotency, 50, now(), 'opportunity-research-worker-v1', 'deterministic-v2')
  returning id into resolved_job_id;

  select sent_id into queue_id from pgmq.send('opportunity_research', jsonb_build_object(
    'job_id', resolved_job_id, 'session_id', resolved_session_id, 'opportunity_id', target_opportunity_id,
    'artist_user_id', current_user_id, 'job_type', 'full_research', 'worker_version', 'opportunity-research-worker-v1'
  )) as sent_id;
  update public.opportunity_research_jobs set queue_message_id = queue_id, metadata = jsonb_build_object('queue','opportunity_research') where id = resolved_job_id;
  update public.opportunity_research_sessions set latest_job_id = resolved_job_id where id = resolved_session_id;
  insert into public.kleio_audit_events (actor_user_id, artist_user_id, opportunity_id, research_session_id, event_name, metadata)
  values (current_user_id, current_user_id, target_opportunity_id, resolved_session_id, 'opportunity_research_queued', jsonb_build_object('job_id',resolved_job_id,'queue_message_id',queue_id));
  return query select resolved_session_id, resolved_job_id, 'queued'::text;
end;
$$;
revoke all on function public.create_or_resume_opportunity_research(uuid, boolean) from public, anon;
grant execute on function public.create_or_resume_opportunity_research(uuid, boolean) to authenticated;

create or replace function public.cancel_opportunity_research(target_session_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := (select auth.uid()); target_job public.opportunity_research_jobs%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if not exists (select 1 from public.opportunity_research_sessions s where s.id = target_session_id and s.artist_user_id = current_user_id) then
    raise exception 'Research session not found.' using errcode = '42501';
  end if;
  select * into target_job from public.opportunity_research_jobs j where j.session_id = target_session_id order by j.created_at desc limit 1;
  if target_job.id is not null and target_job.status in ('queued','retry_scheduled') then
    if target_job.queue_message_id is not null then perform pgmq.delete('opportunity_research', target_job.queue_message_id); end if;
    update public.opportunity_research_jobs set status = 'cancelled', completed_at = now(), current_stage = 'cancelled' where id = target_job.id;
  elsif target_job.id is not null and target_job.status = 'processing' then
    update public.opportunity_research_jobs set status = 'cancel_requested', current_stage = 'cancel_requested' where id = target_job.id;
  end if;
  update public.opportunity_research_sessions set status = 'cancelled', current_stage = 'cancelled', completed_at = now(), progress_percent = least(progress_percent, 99) where id = target_session_id;
  update public.opportunity_research_steps set status = case when status in ('completed','failed','blocked') then status else 'cancelled' end, completed_at = coalesce(completed_at, now()) where session_id = target_session_id;
  insert into public.kleio_audit_events (actor_user_id, artist_user_id, research_session_id, event_name) values (current_user_id, current_user_id, target_session_id, 'opportunity_research_cancelled');
  return true;
end;
$$;
revoke all on function public.cancel_opportunity_research(uuid) from public, anon;
grant execute on function public.cancel_opportunity_research(uuid) to authenticated;

create or replace function public.claim_opportunity_research_jobs(batch_size integer default 1, visibility_timeout_seconds integer default 180)
returns table(message_id bigint, job_id uuid, session_id uuid, opportunity_id uuid, artist_user_id uuid, job_type text, attempt_count integer, max_attempts integer, message jsonb)
language plpgsql security definer set search_path = '' as $$
declare queue_row pgmq.message_record; job_row public.opportunity_research_jobs%rowtype;
begin
  if batch_size < 1 or batch_size > 10 then raise exception 'batch_size must be between 1 and 10'; end if;
  for queue_row in select * from pgmq.read('opportunity_research', greatest(30, visibility_timeout_seconds), batch_size, '{}'::jsonb) loop
    select * into job_row from public.opportunity_research_jobs j where j.id = nullif(queue_row.message->>'job_id','')::uuid for update;
    if job_row.id is null then perform pgmq.archive('opportunity_research', queue_row.msg_id); continue; end if;
    if job_row.status in ('cancel_requested','cancelled','complete','failed','blocked','stale') then perform pgmq.archive('opportunity_research', queue_row.msg_id); continue; end if;
    update public.opportunity_research_jobs set status = 'processing', current_stage = 'acquiring_source', attempt_count = attempt_count + 1,
      started_at = coalesce(started_at, now()), lease_expires_at = now() + make_interval(secs => greatest(30, visibility_timeout_seconds)),
      queue_message_id = queue_row.msg_id, error_message = '', failure_category = '' where id = job_row.id returning * into job_row;
    update public.opportunity_research_sessions set status = 'acquiring_source', current_stage = 'acquiring_source', progress_percent = greatest(progress_percent, 5), started_at = coalesce(started_at, now()) where id = job_row.session_id;
    insert into public.kleio_audit_events (artist_user_id, opportunity_id, research_session_id, event_name, metadata)
    values (job_row.artist_user_id, job_row.opportunity_id, job_row.session_id, 'opportunity_research_worker_claimed', jsonb_build_object('job_id',job_row.id,'message_id',queue_row.msg_id,'attempt',job_row.attempt_count));
    message_id := queue_row.msg_id; job_id := job_row.id; session_id := job_row.session_id; opportunity_id := job_row.opportunity_id;
    artist_user_id := job_row.artist_user_id; job_type := job_row.job_type; attempt_count := job_row.attempt_count; max_attempts := job_row.max_attempts; message := queue_row.message;
    return next;
  end loop;
end;
$$;
revoke all on function public.claim_opportunity_research_jobs(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_opportunity_research_jobs(integer, integer) to service_role;

create or replace function public.complete_opportunity_research_job(target_job_id uuid, target_message_id bigint, final_status text, summary jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare job_row public.opportunity_research_jobs%rowtype; session_status text;
begin
  if final_status not in ('complete','partial','artist_review_required','blocked','cancelled') then raise exception 'Invalid final status.'; end if;
  select * into job_row from public.opportunity_research_jobs where id = target_job_id for update;
  if job_row.id is null then return false; end if;
  if job_row.status = 'cancel_requested' then final_status := 'cancelled'; end if;
  perform pgmq.archive('opportunity_research', target_message_id);
  update public.opportunity_research_jobs set status = final_status, current_stage = final_status, completed_at = now(), lease_expires_at = null, metadata = metadata || coalesce(summary,'{}'::jsonb) where id = target_job_id;
  session_status := case final_status when 'complete' then 'complete' when 'artist_review_required' then 'artist_review_required' else final_status end;
  update public.opportunity_research_sessions set status = session_status,
    current_stage = case when final_status in ('complete','partial','artist_review_required') then 'artist_review_required' else final_status end,
    progress_percent = case when final_status in ('complete','partial','artist_review_required') then 100 else progress_percent end,
    completed_at = now(), metadata = metadata || coalesce(summary,'{}'::jsonb) where id = job_row.session_id;
  insert into public.kleio_audit_events (artist_user_id, opportunity_id, research_session_id, event_name, event_status, metadata)
  values (job_row.artist_user_id, job_row.opportunity_id, job_row.session_id, 'opportunity_research_worker_completed', final_status, jsonb_build_object('job_id',target_job_id,'message_id',target_message_id) || coalesce(summary,'{}'::jsonb));
  return true;
end;
$$;
revoke all on function public.complete_opportunity_research_job(uuid, bigint, text, jsonb) from public, anon, authenticated;
grant execute on function public.complete_opportunity_research_job(uuid, bigint, text, jsonb) to service_role;

create or replace function public.fail_opportunity_research_job(target_job_id uuid, target_message_id bigint, failure_category text, redacted_error_message text, retryable boolean default true, retry_delay_seconds integer default 60)
returns text language plpgsql security definer set search_path = '' as $$
declare job_row public.opportunity_research_jobs%rowtype; replacement_message_id bigint; outcome text;
begin
  select * into job_row from public.opportunity_research_jobs where id = target_job_id for update;
  if job_row.id is null then return 'missing'; end if;
  if job_row.status = 'cancel_requested' then
    perform pgmq.archive('opportunity_research', target_message_id);
    update public.opportunity_research_jobs set status='cancelled', completed_at=now(), lease_expires_at=null where id=target_job_id;
    update public.opportunity_research_sessions set status='cancelled', current_stage='cancelled', completed_at=now() where id=job_row.session_id;
    return 'cancelled';
  end if;
  if retryable and job_row.attempt_count < job_row.max_attempts then
    perform pgmq.delete('opportunity_research', target_message_id);
    select sent_id into replacement_message_id from pgmq.send('opportunity_research', jsonb_build_object(
      'job_id',job_row.id,'session_id',job_row.session_id,'opportunity_id',job_row.opportunity_id,
      'artist_user_id',job_row.artist_user_id,'job_type',job_row.job_type,'worker_version',job_row.worker_version
    ), greatest(1,retry_delay_seconds)) as sent_id;
    update public.opportunity_research_jobs set status='retry_scheduled', current_stage='retry_scheduled', scheduled_at=now()+make_interval(secs=>greatest(1,retry_delay_seconds)),
      queue_message_id=replacement_message_id, lease_expires_at=null, failure_category=left(coalesce(failure_category,''),120), error_message=left(coalesce(redacted_error_message,''),1000) where id=target_job_id;
    update public.opportunity_research_sessions set status='retry_scheduled', current_stage='retry_scheduled', error_message=left(coalesce(redacted_error_message,''),1000) where id=job_row.session_id;
    outcome := 'retry_scheduled';
  else
    perform pgmq.archive('opportunity_research', target_message_id);
    update public.opportunity_research_jobs set status='failed', current_stage='failed', completed_at=now(), lease_expires_at=null,
      failure_category=left(coalesce(failure_category,''),120), error_message=left(coalesce(redacted_error_message,''),1000) where id=target_job_id;
    update public.opportunity_research_sessions set status='failed', current_stage='failed', completed_at=now(), error_message=left(coalesce(redacted_error_message,''),1000) where id=job_row.session_id;
    outcome := 'failed';
  end if;
  insert into public.kleio_audit_events (artist_user_id, opportunity_id, research_session_id, event_name, event_status, metadata)
  values (job_row.artist_user_id, job_row.opportunity_id, job_row.session_id, 'opportunity_research_worker_failed', outcome,
    jsonb_build_object('job_id',target_job_id,'message_id',target_message_id,'category',left(coalesce(failure_category,''),120),'attempt',job_row.attempt_count));
  return outcome;
end;
$$;
revoke all on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) to service_role;

create or replace function public.promote_candidate_requirement_to_canonical(target_candidate_id uuid, promotion_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := (select auth.uid()); candidate public.opportunity_candidate_requirements%rowtype;
  canonical public.opportunity_requirements%rowtype; canonical_id uuid; previous_json jsonb := '{}'::jsonb; promotion_key text;
begin
  if current_user_id is null or not public.is_kleio_admin() then raise exception 'Administrative review is required.' using errcode='42501'; end if;
  select * into candidate from public.opportunity_candidate_requirements where id=target_candidate_id for update;
  if candidate.id is null then raise exception 'Candidate requirement not found.'; end if;
  if candidate.confidence_status not in ('verified','corroborated') then raise exception 'Only verified or corroborated candidates can be promoted.'; end if;
  if candidate.conflict_status in ('possible','confirmed') or exists (
    select 1 from public.opportunity_research_conflicts c where c.session_id=candidate.session_id and c.normalized_key=candidate.normalized_key and c.status='open' and c.severity='blocking'
  ) then raise exception 'Resolve blocking source conflicts before promotion.'; end if;
  if candidate.source_version_id is null or not exists (select 1 from public.opportunity_source_versions v where v.id=candidate.source_version_id and v.checksum<>'' and v.fetch_status='fetched') then
    raise exception 'A versioned fetched source is required for promotion.';
  end if;
  promotion_key := encode(digest('requirement:'||candidate.id::text, 'sha256'),'hex');
  if exists (select 1 from public.opportunity_canonical_promotions p where p.idempotency_key=promotion_key and p.rolled_back_at is null) then
    select p.canonical_record_id into canonical_id from public.opportunity_canonical_promotions p where p.idempotency_key=promotion_key;
    return canonical_id;
  end if;
  select * into canonical from public.opportunity_requirements r where r.opportunity_id=candidate.opportunity_id and r.material_key=candidate.normalized_key order by r.created_at limit 1 for update;
  if canonical.id is not null then
    previous_json := to_jsonb(canonical);
    update public.opportunity_requirements set label=candidate.label, required=candidate.required, source_text=candidate.source_text, source_url=candidate.source_url,
      extraction_method='promoted_candidate', verification_status='confirmed', last_verified_at=now(), category=candidate.category,
      description=candidate.description, source_location=candidate.evidence_location, passport_field=candidate.passport_field,
      input_type=candidate.input_type, minimum_word_count=candidate.minimum_word_count, maximum_word_count=candidate.maximum_word_count,
      minimum_item_count=candidate.minimum_item_count, maximum_item_count=candidate.maximum_item_count,
      accepted_file_types=candidate.accepted_file_types, maximum_file_size_bytes=candidate.maximum_file_size_bytes,
      maximum_total_size_bytes=candidate.maximum_total_size_bytes, filename_pattern=candidate.filename_pattern,
      requires_artist_confirmation=candidate.requires_artist_confirmation, legal_declaration=candidate.legal_declaration,
      payment_required=candidate.payment_required, human_verification_required=candidate.human_verification_required,
      confidence_score=candidate.confidence_score, constraints=candidate.constraints, source_title=candidate.source_title,
      retrieved_at=now(), confidence_status=candidate.confidence_status, confidence_reason=candidate.confidence_reason,
      normalized_interpretation=candidate.normalized_interpretation, research_session_id=null, updated_at=now()
    where id=canonical.id returning id into canonical_id;
  else
    insert into public.opportunity_requirements (opportunity_id, material_key, label, required, source_text, source_url, extraction_method,
      verification_status, last_verified_at, category, description, source_location, passport_field, input_type,
      minimum_word_count, maximum_word_count, minimum_item_count, maximum_item_count, accepted_file_types,
      maximum_file_size_bytes, maximum_total_size_bytes, filename_pattern, requires_artist_confirmation, legal_declaration,
      payment_required, human_verification_required, confidence_score, constraints, source_title, retrieved_at,
      confidence_status, confidence_reason, normalized_interpretation, research_session_id)
    values (candidate.opportunity_id,candidate.normalized_key,candidate.label,candidate.required,candidate.source_text,candidate.source_url,
      'promoted_candidate','confirmed',now(),candidate.category,candidate.description,candidate.evidence_location,candidate.passport_field,
      candidate.input_type,candidate.minimum_word_count,candidate.maximum_word_count,candidate.minimum_item_count,candidate.maximum_item_count,
      candidate.accepted_file_types,candidate.maximum_file_size_bytes,candidate.maximum_total_size_bytes,candidate.filename_pattern,
      candidate.requires_artist_confirmation,candidate.legal_declaration,candidate.payment_required,candidate.human_verification_required,
      candidate.confidence_score,candidate.constraints,candidate.source_title,now(),candidate.confidence_status,candidate.confidence_reason,
      candidate.normalized_interpretation,null) returning id into canonical_id;
  end if;
  insert into public.opportunity_canonical_promotions (opportunity_id,candidate_requirement_id,canonical_record_type,canonical_record_id,
    previous_value,promoted_value,promotion_reason,idempotency_key,promoted_by)
  values (candidate.opportunity_id,candidate.id,'requirement',canonical_id,previous_json,to_jsonb(candidate),left(promotion_reason,1000),promotion_key,current_user_id);
  update public.opportunity_candidate_requirements set promoted_at=now() where id=candidate.id;
  return canonical_id;
end;
$$;
revoke all on function public.promote_candidate_requirement_to_canonical(uuid, text) from public, anon;
grant execute on function public.promote_candidate_requirement_to_canonical(uuid, text) to authenticated;

create or replace function public.rollback_canonical_promotion(target_promotion_id uuid, rollback_reason text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := (select auth.uid()); promotion public.opportunity_canonical_promotions%rowtype; restored public.opportunity_requirements%rowtype;
begin
  if current_user_id is null or not public.is_kleio_admin() then raise exception 'Administrative review is required.' using errcode='42501'; end if;
  select * into promotion from public.opportunity_canonical_promotions where id=target_promotion_id for update;
  if promotion.id is null or promotion.rolled_back_at is not null then return false; end if;
  if promotion.canonical_record_type <> 'requirement' then raise exception 'Unsupported promotion type.'; end if;
  if promotion.previous_value = '{}'::jsonb then
    delete from public.opportunity_requirements where id=promotion.canonical_record_id;
  else
    restored := jsonb_populate_record(null::public.opportunity_requirements, promotion.previous_value);
    delete from public.opportunity_requirements where id=promotion.canonical_record_id;
    insert into public.opportunity_requirements select restored.*;
  end if;
  update public.opportunity_canonical_promotions set rolled_back_at=now(), rolled_back_by=current_user_id, rollback_reason=left(rollback_reason,1000) where id=promotion.id;
  return true;
end;
$$;
revoke all on function public.rollback_canonical_promotion(uuid, text) from public, anon;
grant execute on function public.rollback_canonical_promotion(uuid, text) to authenticated;

create or replace function public.version_application_package() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op='UPDATE' and (new.requirement_snapshot is distinct from old.requirement_snapshot or new.passport_snapshot is distinct from old.passport_snapshot
    or new.portfolio_snapshot is distinct from old.portfolio_snapshot or new.written_content is distinct from old.written_content
    or new.attachment_checksums is distinct from old.attachment_checksums or new.approval_confirmations is distinct from old.approval_confirmations
    or new.state is distinct from old.state or new.stale is distinct from old.stale) then
    new.package_version := old.package_version + 1;
  end if;
  if new.prepared_at is null and new.state <> 'draft' then new.prepared_at := now(); end if;
  return new;
end;
$$;
drop trigger if exists version_application_package_before_write on public.application_packages;
create trigger version_application_package_before_write before insert or update on public.application_packages for each row execute function public.version_application_package();

create or replace function public.snapshot_application_package_version() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.application_package_versions (package_id,artist_user_id,version,source_version_id,requirement_snapshot,passport_snapshot,
    portfolio_snapshot,written_content,attachment_checksums,approval_confirmations,state,stale)
  values (new.id,new.artist_user_id,new.package_version,new.source_version_id,new.requirement_snapshot,new.passport_snapshot,
    new.portfolio_snapshot,new.written_content,new.attachment_checksums,new.approval_confirmations,new.state,new.stale)
  on conflict (package_id,version) do update set source_version_id=excluded.source_version_id,
    requirement_snapshot=excluded.requirement_snapshot,passport_snapshot=excluded.passport_snapshot,
    portfolio_snapshot=excluded.portfolio_snapshot,written_content=excluded.written_content,
    attachment_checksums=excluded.attachment_checksums,approval_confirmations=excluded.approval_confirmations,
    state=excluded.state,stale=excluded.stale;
  return new;
end;
$$;
drop trigger if exists snapshot_application_package_after_write on public.application_packages;
create trigger snapshot_application_package_after_write after insert or update on public.application_packages for each row execute function public.snapshot_application_package_version();
