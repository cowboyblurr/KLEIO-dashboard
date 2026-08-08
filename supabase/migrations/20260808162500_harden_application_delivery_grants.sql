-- `application_deliveries` is written only through controlled server/artist RPCs.
-- Supabase default grants can include table privileges such as TRUNCATE,
-- REFERENCES, TRIGGER, and SELECT. Remove all direct access first, then grant
-- back only the owner-scoped authenticated read surface.

revoke all privileges on table public.application_deliveries from anon, authenticated;
grant select on table public.application_deliveries to authenticated;

revoke all on function public.record_my_application_delivery(uuid,text,text,uuid,text,text,text,text,text,text) from public, anon;
grant execute on function public.record_my_application_delivery(uuid,text,text,uuid,text,text,text,text,text,text) to authenticated;
