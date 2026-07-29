insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('opportunity-source-documents','opportunity-source-documents',false,10485760,array['application/pdf'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

revoke all on storage.objects from anon, authenticated;
