-- Keep anonymous opportunity discovery independent from authenticated ownership helpers.
-- Without this split, anon SELECT queries could fail before evaluating open status
-- because anon does not execute public.owns_institution(uuid).

drop policy if exists open_calls_public_read on public.open_calls;
drop policy if exists open_calls_authenticated_read on public.open_calls;

create policy open_calls_public_read
on public.open_calls
for select
to anon
using (status = 'open'::public.open_call_status);

create policy open_calls_authenticated_read
on public.open_calls
for select
to authenticated
using (
  status = 'open'::public.open_call_status
  or public.owns_institution(institution_id)
);

drop policy if exists call_questions_public_read on public.call_questions;
drop policy if exists call_questions_authenticated_read on public.call_questions;

create policy call_questions_public_read
on public.call_questions
for select
to anon
using (
  exists (
    select 1
    from public.open_calls call_row
    where call_row.id = call_questions.call_id
      and call_row.status = 'open'::public.open_call_status
  )
);

create policy call_questions_authenticated_read
on public.call_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.open_calls call_row
    where call_row.id = call_questions.call_id
      and (
        call_row.status = 'open'::public.open_call_status
        or public.owns_institution(call_row.institution_id)
      )
  )
);
