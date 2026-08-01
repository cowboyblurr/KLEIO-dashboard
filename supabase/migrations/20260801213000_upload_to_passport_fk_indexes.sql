create index if not exists application_package_items_source_version_idx
  on public.application_package_items (source_version_id)
  where source_version_id is not null;
create index if not exists application_requirement_attachments_application_idx
  on public.application_requirement_attachments (application_id)
  where application_id is not null;
create index if not exists application_requirement_attachments_opportunity_idx
  on public.application_requirement_attachments (opportunity_id);
create index if not exists application_requirement_attachments_requirement_fk_idx
  on public.application_requirement_attachments (requirement_id);
create index if not exists application_requirement_attachments_source_idx
  on public.application_requirement_attachments (source_id);
create index if not exists application_requirement_attachments_source_version_idx
  on public.application_requirement_attachments (source_version_id)
  where source_version_id is not null;
create index if not exists artist_document_versions_previous_source_idx
  on public.artist_document_versions (previous_source_id)
  where previous_source_id is not null;
create index if not exists artist_import_proposals_duplicate_claim_idx
  on public.artist_import_proposals (duplicate_of_claim_id)
  where duplicate_of_claim_id is not null;
create index if not exists artist_import_proposals_existing_record_idx
  on public.artist_import_proposals (existing_record_id)
  where existing_record_id is not null;
create index if not exists artist_passport_records_source_claim_idx
  on public.artist_passport_records (source_claim_id)
  where source_claim_id is not null;
create index if not exists artist_passport_records_supersedes_idx
  on public.artist_passport_records (supersedes_record_id)
  where supersedes_record_id is not null;
create index if not exists artist_requirement_assessments_opportunity_fk_idx
  on public.artist_requirement_assessments (opportunity_id);
create index if not exists artist_requirement_assessments_requirement_fk_idx
  on public.artist_requirement_assessments (requirement_id);
