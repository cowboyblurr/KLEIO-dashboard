begin;

-- The Edge Function uses the service role and bypasses RLS intentionally.
-- Client roles receive an explicit deny policy so the server-only draft table
-- is both inaccessible and free of ambiguous "RLS enabled, no policy" state.
drop policy if exists "No direct client access to recipient drafts" on public.application_recipient_message_drafts;
create policy "No direct client access to recipient drafts"
on public.application_recipient_message_drafts
for all
to authenticated
using (false)
with check (false);

-- These functions exist only as internal trigger/calculation helpers.
-- Trigger execution does not require exposing them as callable REST RPCs.
revoke execute on function public.calculate_artist_passport_completion(uuid) from authenticated;
revoke execute on function public.refresh_artist_passport_completion_trigger() from authenticated;
revoke execute on function public.sync_application_package_data_scope() from authenticated;
revoke execute on function public.normalize_opportunity_requirement_key_trigger() from authenticated;

commit;
