alter table public.artist_passport_drafts
  add column if not exists draft_key text not null default 'creative_passport'
  check (char_length(draft_key) between 1 and 120);

alter table public.artist_passport_drafts drop constraint if exists artist_passport_drafts_pkey;
alter table public.artist_passport_drafts add primary key (artist_user_id, draft_key);
create index if not exists artist_passport_drafts_owner_updated_idx
  on public.artist_passport_drafts(artist_user_id, updated_at desc);
