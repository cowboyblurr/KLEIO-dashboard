create table if not exists public.user_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms_and_privacy')),
  policy_version text not null check (char_length(policy_version) between 1 and 40),
  accepted_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key (user_id, consent_type, policy_version)
);

alter table public.user_consents enable row level security;
create policy user_consents_read_own on public.user_consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_consents_insert_own on public.user_consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.user_consents to authenticated;
comment on table public.user_consents is 'Append-only account consent receipts created after authenticated signup confirmation.';
