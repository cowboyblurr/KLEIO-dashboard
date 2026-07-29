revoke all on function public.mark_application_packages_stale_on_requirement_change() from public, anon, authenticated;
revoke all on function public.snapshot_application_package_version() from public, anon, authenticated;
revoke all on function public.promote_candidate_requirement_to_canonical(uuid, text) from public, anon, authenticated;
revoke all on function public.rollback_canonical_promotion(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_application_packages_stale_on_requirement_change() to service_role;
grant execute on function public.snapshot_application_package_version() to service_role;
grant execute on function public.promote_candidate_requirement_to_canonical(uuid, text) to service_role;
grant execute on function public.rollback_canonical_promotion(uuid, text) to service_role;
