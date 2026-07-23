create or replace function public.normalize_feature_gated_pdf_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parser_version = 'pdf-runtime-pending'
     and new.extraction_status = 'ocr_required' then
    new.extraction_status := 'pending';
    new.metadata := coalesce(new.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'page_extraction_enabled', false,
        'ocr_requirement_determined', false,
        'status_reason', 'Page-level parser has not run; OCR need is unknown.'
      );
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_feature_gated_pdf_status_before_write
  on public.opportunity_research_documents;
create trigger normalize_feature_gated_pdf_status_before_write
before insert or update on public.opportunity_research_documents
for each row execute function public.normalize_feature_gated_pdf_status();

revoke all on function public.normalize_feature_gated_pdf_status()
  from public, anon, authenticated;
grant execute on function public.normalize_feature_gated_pdf_status()
  to service_role;
