create table if not exists public.artist_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  draft_type text not null,
  status text not null default 'generated',
  provider text not null default '',
  model text not null default '',
  prompt_version text not null default 'kleio_assist_v1',
  evidence jsonb not null default '[]'::jsonb,
  request_context jsonb not null default '{}'::jsonb,
  generated_output jsonb not null default '{}'::jsonb,
  artist_edited_text text not null default '',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_ai_drafts_type_check check (
    draft_type = any (array['short_bio','professional_bio','artist_statement','practice_description','artwork_description','submission_letter','application_answer'])
  ),
  constraint artist_ai_drafts_status_check check (
    status = any (array['generated','edited','approved','rejected'])
  ),
  constraint artist_ai_drafts_evidence_array check (jsonb_typeof(evidence) = 'array'),
  constraint artist_ai_drafts_request_object check (jsonb_typeof(request_context) = 'object'),
  constraint artist_ai_drafts_output_object check (jsonb_typeof(generated_output) = 'object')
);

alter table public.artist_ai_drafts enable row level security;

revoke all on table public.artist_ai_drafts from anon;
revoke all on table public.artist_ai_drafts from authenticated;
grant select, insert, update, delete on table public.artist_ai_drafts to authenticated;

create policy "Artists can read their KLEIO Assist drafts"
on public.artist_ai_drafts
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

create policy "Artists can create their KLEIO Assist drafts"
on public.artist_ai_drafts
for insert
to authenticated
with check ((select auth.uid()) = artist_user_id);

create policy "Artists can update their KLEIO Assist drafts"
on public.artist_ai_drafts
for update
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

create policy "Artists can delete their KLEIO Assist drafts"
on public.artist_ai_drafts
for delete
to authenticated
using ((select auth.uid()) = artist_user_id);

create index if not exists artist_ai_drafts_owner_updated_idx
  on public.artist_ai_drafts (artist_user_id, updated_at desc);
