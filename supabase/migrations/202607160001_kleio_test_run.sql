-- KLEIO controlled test-run schema
-- Apply with the Supabase CLI or SQL editor in a non-production project first.

create extension if not exists pgcrypto;

create type public.kleio_role as enum ('artist', 'institution', 'collaborator', 'admin');
create type public.open_call_status as enum ('draft', 'open', 'closed', 'under_review', 'completed', 'archived');
create type public.application_status as enum ('draft', 'submitted', 'in_review', 'needs_follow_up', 'shortlisted', 'finalist', 'accepted', 'declined', 'withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.kleio_role not null,
  display_name text,
  email text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  professional_name text not null default '',
  location text not null default '',
  bio text not null default '',
  artist_statement text not null default '',
  practice_description text not null default '',
  website_url text not null default '',
  instagram_url text not null default '',
  disciplines text[] not null default '{}',
  mediums text[] not null default '{}',
  languages text[] not null default '{}',
  education text not null default '',
  exhibition_history text not null default '',
  awards text not null default '',
  cv_file_path text,
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  organization_type text not null default '',
  description text not null default '',
  location text not null default '',
  website_url text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'reviewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table public.portfolio_works (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  year text not null default '',
  medium text not null default '',
  dimensions text not null default '',
  description text not null default '',
  series text not null default '',
  tags text[] not null default '{}',
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.open_calls (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  slug text not null,
  opportunity_type text not null default 'Open Call',
  summary text not null default '',
  description text not null default '',
  location text not null default '',
  participation_format text not null default '',
  opens_at date,
  deadline_at date,
  notification_date date,
  program_start_date date,
  program_end_date date,
  eligibility jsonb not null default '{}'::jsonb,
  required_materials text[] not null default '{}',
  review_configuration jsonb not null default '{}'::jsonb,
  status public.open_call_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, slug),
  check (deadline_at is null or opens_at is null or deadline_at >= opens_at),
  check (program_end_date is null or program_start_date is null or program_end_date >= program_start_date)
);

create table public.call_questions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.open_calls(id) on delete cascade,
  label text not null,
  description text not null default '',
  question_type text not null default 'long' check (question_type in ('short', 'long', 'choice', 'number', 'date')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.open_calls(id) on delete cascade,
  artist_user_id uuid not null references public.profiles(id) on delete cascade,
  artist_name text not null default '',
  artist_email text not null default '',
  profile_snapshot jsonb not null default '{}'::jsonb,
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (call_id, artist_user_id)
);

create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  question_id uuid references public.call_questions(id) on delete set null,
  question_key text not null default '',
  answer_text text not null default '',
  answer_data jsonb not null default '{}'::jsonb
);

create table public.application_works (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  portfolio_work_id uuid not null references public.portfolio_works(id) on delete restrict,
  sort_order integer not null default 0,
  unique (application_id, portfolio_work_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles(id) on delete cascade,
  recommendation text not null default '',
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  internal_notes text not null default '',
  review_status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, reviewer_user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('artist', 'institution')),
  body text not null check (char_length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  previous_status public.application_status,
  new_status public.application_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index open_calls_public_idx on public.open_calls(status, deadline_at);
create index open_calls_institution_idx on public.open_calls(institution_id, created_at desc);
create index applications_artist_idx on public.applications(artist_user_id, updated_at desc);
create index applications_call_idx on public.applications(call_id, status);
create index application_answers_application_idx on public.application_answers(application_id);
create index application_works_application_idx on public.application_works(application_id);
create index reviews_application_idx on public.reviews(application_id);
create index messages_application_idx on public.messages(application_id, created_at);
create index messages_recipient_unread_idx on public.messages(recipient_user_id, read_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger artist_profiles_set_updated_at before update on public.artist_profiles for each row execute procedure public.set_updated_at();
create trigger institutions_set_updated_at before update on public.institutions for each row execute procedure public.set_updated_at();
create trigger portfolio_works_set_updated_at before update on public.portfolio_works for each row execute procedure public.set_updated_at();
create trigger open_calls_set_updated_at before update on public.open_calls for each row execute procedure public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications for each row execute procedure public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'artist');
  if requested_role not in ('artist', 'institution', 'collaborator') then
    requested_role := 'artist';
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

create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.owns_institution(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.institutions i
    where i.id = target_institution_id
      and (
        i.owner_user_id = auth.uid()
        or exists (
          select 1 from public.institution_members m
          where m.institution_id = i.id and m.user_id = auth.uid() and m.status = 'active'
        )
      )
  );
$$;

create or replace function public.can_manage_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.open_calls c on c.id = a.call_id
    where a.id = target_application_id and public.owns_institution(c.institution_id)
  );
$$;

create or replace function public.can_access_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications a
    where a.id = target_application_id
      and (a.artist_user_id = auth.uid() or public.can_manage_application(a.id))
  );
$$;

alter table public.profiles enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_members enable row level security;
alter table public.portfolio_works enable row level security;
alter table public.open_calls enable row level security;
alter table public.call_questions enable row level security;
alter table public.applications enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_works enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.application_status_history enable row level security;

create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy artist_profiles_manage_own on public.artist_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy institutions_public_read on public.institutions for select using (true);
create policy institutions_insert_owner on public.institutions for insert with check (owner_user_id = auth.uid());
create policy institutions_update_owner on public.institutions for update using (public.owns_institution(id)) with check (public.owns_institution(id));
create policy institutions_delete_owner on public.institutions for delete using (owner_user_id = auth.uid());

create policy institution_members_read_scope on public.institution_members for select using (user_id = auth.uid() or public.owns_institution(institution_id));
create policy institution_members_manage_owner on public.institution_members for all using (public.owns_institution(institution_id)) with check (public.owns_institution(institution_id));

create policy portfolio_works_manage_own on public.portfolio_works for all using (artist_user_id = auth.uid()) with check (artist_user_id = auth.uid());
create policy portfolio_works_institution_read_selected on public.portfolio_works for select using (
  exists (
    select 1 from public.application_works aw
    join public.applications a on a.id = aw.application_id
    where aw.portfolio_work_id = portfolio_works.id and public.can_manage_application(a.id)
  )
);

create policy open_calls_public_read on public.open_calls for select using (status = 'open' or public.owns_institution(institution_id));
create policy open_calls_insert_owner on public.open_calls for insert with check (public.owns_institution(institution_id) and created_by = auth.uid());
create policy open_calls_update_owner on public.open_calls for update using (public.owns_institution(institution_id)) with check (public.owns_institution(institution_id));
create policy open_calls_delete_owner on public.open_calls for delete using (public.owns_institution(institution_id));

create policy call_questions_public_read on public.call_questions for select using (
  exists (select 1 from public.open_calls c where c.id = call_questions.call_id and (c.status = 'open' or public.owns_institution(c.institution_id)))
);
create policy call_questions_manage_owner on public.call_questions for all using (
  exists (select 1 from public.open_calls c where c.id = call_questions.call_id and public.owns_institution(c.institution_id))
) with check (
  exists (select 1 from public.open_calls c where c.id = call_questions.call_id and public.owns_institution(c.institution_id))
);

create policy applications_artist_select on public.applications for select using (artist_user_id = auth.uid());
create policy applications_artist_insert on public.applications for insert with check (
  artist_user_id = auth.uid()
  and exists (select 1 from public.open_calls c where c.id = call_id and c.status = 'open')
);
create policy applications_artist_update_draft on public.applications for update using (artist_user_id = auth.uid()) with check (artist_user_id = auth.uid());
create policy applications_institution_select on public.applications for select using (public.can_manage_application(id));
create policy applications_institution_update on public.applications for update using (public.can_manage_application(id)) with check (public.can_manage_application(id));

create policy application_answers_access on public.application_answers for select using (public.can_access_application(application_id));
create policy application_answers_artist_manage on public.application_answers for all using (
  exists (select 1 from public.applications a where a.id = application_answers.application_id and a.artist_user_id = auth.uid())
) with check (
  exists (select 1 from public.applications a where a.id = application_answers.application_id and a.artist_user_id = auth.uid())
);

create policy application_works_access on public.application_works for select using (public.can_access_application(application_id));
create policy application_works_artist_manage on public.application_works for all using (
  exists (select 1 from public.applications a where a.id = application_works.application_id and a.artist_user_id = auth.uid())
) with check (
  exists (select 1 from public.applications a where a.id = application_works.application_id and a.artist_user_id = auth.uid())
);

create policy reviews_institution_read on public.reviews for select using (public.can_manage_application(application_id));
create policy reviews_institution_insert on public.reviews for insert with check (reviewer_user_id = auth.uid() and public.can_manage_application(application_id));
create policy reviews_institution_update on public.reviews for update using (reviewer_user_id = auth.uid() and public.can_manage_application(application_id)) with check (reviewer_user_id = auth.uid() and public.can_manage_application(application_id));

create policy messages_participant_read on public.messages for select using (
  sender_user_id = auth.uid() or recipient_user_id = auth.uid()
);
create policy messages_participant_insert on public.messages for insert with check (
  sender_user_id = auth.uid()
  and public.can_access_application(application_id)
  and exists (
    select 1 from public.applications a
    join public.open_calls c on c.id = a.call_id
    join public.institutions i on i.id = c.institution_id
    where a.id = messages.application_id
      and (
        (a.artist_user_id = auth.uid() and messages.recipient_user_id in (i.owner_user_id))
        or (public.can_manage_application(a.id) and messages.recipient_user_id = a.artist_user_id)
      )
  )
);
create policy messages_recipient_update on public.messages for update using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create policy status_history_access on public.application_status_history for select using (public.can_access_application(application_id));
create policy status_history_institution_insert on public.application_status_history for insert with check (changed_by = auth.uid() and public.can_manage_application(application_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-images', 'portfolio-images', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('institution-logos', 'institution-logos', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('artist-documents', 'artist-documents', false, 15728640, array['application/pdf']),
  ('application-documents', 'application-documents', false, 15728640, array['application/pdf'])
on conflict (id) do nothing;

create policy portfolio_images_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy portfolio_images_owner_manage on storage.objects for update to authenticated using (
  bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy portfolio_images_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy portfolio_images_owner_read on storage.objects for select to authenticated using (
  bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy institution_logos_public_read on storage.objects for select using (bucket_id = 'institution-logos');
create policy institution_logos_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'institution-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy institution_logos_owner_manage on storage.objects for update to authenticated using (
  bucket_id = 'institution-logos' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'institution-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy institution_logos_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'institution-logos' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy private_documents_owner_all on storage.objects for all to authenticated using (
  bucket_id in ('artist-documents', 'application-documents') and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id in ('artist-documents', 'application-documents') and (storage.foldername(name))[1] = auth.uid()::text
);
