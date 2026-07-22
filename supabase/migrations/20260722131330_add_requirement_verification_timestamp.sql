alter table public.opportunity_requirements
add column if not exists last_verified_at timestamptz;
