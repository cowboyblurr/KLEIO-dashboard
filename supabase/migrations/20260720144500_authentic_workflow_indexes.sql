begin;

create index if not exists call_questions_call_id_idx
  on public.call_questions (call_id);
create index if not exists messages_sender_user_id_idx
  on public.messages (sender_user_id);
create index if not exists saved_opportunities_call_id_idx
  on public.saved_opportunities (call_id);
create index if not exists review_assignments_application_id_idx
  on public.review_assignments (application_id);
create index if not exists review_assignments_assigned_by_idx
  on public.review_assignments (assigned_by);
create index if not exists institution_invitations_invited_by_idx
  on public.institution_invitations (invited_by);
create index if not exists institution_invitations_invited_user_id_idx
  on public.institution_invitations (invited_user_id)
  where invited_user_id is not null;

commit;
