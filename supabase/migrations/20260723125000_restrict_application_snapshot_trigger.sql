begin;

revoke all on function public.capture_application_submission_snapshot() from public;
revoke all on function public.capture_application_submission_snapshot() from anon;
revoke all on function public.capture_application_submission_snapshot() from authenticated;
revoke all on function public.capture_application_submission_snapshot() from service_role;

grant execute on function public.capture_application_submission_snapshot() to postgres;

commit;
