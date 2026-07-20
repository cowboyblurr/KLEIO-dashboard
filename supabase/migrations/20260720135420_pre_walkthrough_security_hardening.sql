begin;

-- Public signup may create artist or institution accounts. Reviewer and
-- collaborator authorization must come from trusted app metadata, not from
-- user-editable signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  trusted_role text;
begin
  trusted_role := new.raw_app_meta_data ->> 'kleio_role';

  if trusted_role in ('collaborator', 'admin') then
    requested_role := trusted_role;
  else
    requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'artist');
    if requested_role not in ('artist', 'institution') then
      requested_role := 'artist';
    end if;
  end if;

  insert into public.profiles (id, role, display_name, email)
  values (
    new.id,
    requested_role::public.kleio_role,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    new.email
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Legacy policies without a TO clause applied to PUBLIC. Their predicates
-- generally failed closed for anonymous requests, but explicit role scoping is
-- clearer, cheaper, and prevents accidental broadening as helpers evolve.
alter policy application_answers_artist_manage on public.application_answers to authenticated;
alter policy application_answers_access on public.application_answers to authenticated;
alter policy status_history_institution_insert on public.application_status_history to authenticated;
alter policy status_history_access on public.application_status_history to authenticated;
alter policy application_works_artist_manage on public.application_works to authenticated;
alter policy application_works_access on public.application_works to authenticated;
alter policy applications_artist_insert on public.applications to authenticated;
alter policy applications_artist_select on public.applications to authenticated;
alter policy applications_institution_select on public.applications to authenticated;
alter policy applications_institution_update on public.applications to authenticated;
alter policy call_questions_manage_owner on public.call_questions to authenticated;
alter policy messages_participant_read on public.messages to authenticated;
alter policy messages_recipient_update on public.messages to authenticated;
alter policy open_calls_delete_owner on public.open_calls to authenticated;
alter policy open_calls_insert_owner on public.open_calls to authenticated;
alter policy open_calls_update_owner on public.open_calls to authenticated;
alter policy portfolio_works_manage_own on public.portfolio_works to authenticated;
alter policy portfolio_works_institution_read_selected on public.portfolio_works to authenticated;
alter policy reviews_institution_insert on public.reviews to authenticated;
alter policy reviews_institution_read on public.reviews to authenticated;
alter policy reviews_institution_update on public.reviews to authenticated;

-- Cover the foreign keys exercised by application and review walkthroughs.
create index if not exists application_answers_question_id_idx
  on public.application_answers (question_id);
create index if not exists application_status_history_application_id_idx
  on public.application_status_history (application_id);
create index if not exists application_status_history_changed_by_idx
  on public.application_status_history (changed_by);
create index if not exists application_works_portfolio_work_id_idx
  on public.application_works (portfolio_work_id);
create index if not exists messages_recipient_user_id_idx
  on public.messages (recipient_user_id);
create index if not exists reviews_reviewer_user_id_idx
  on public.reviews (reviewer_user_id);

commit;
