-- Team membership acceptance remains disabled for the initial beta until
-- account roles, workspace selection, revocation, and reviewer navigation are
-- validated as one end-to-end workflow. The client UI also removes the action,
-- but the database remains the authoritative enforcement boundary.
revoke all on function public.accept_institution_invitation(uuid) from public, anon, authenticated;
grant execute on function public.accept_institution_invitation(uuid) to service_role;
