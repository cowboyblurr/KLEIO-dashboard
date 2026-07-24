begin;

update public.opportunity_sources
set
  terms_reviewed_at = null,
  updated_at = now()
where slug = 'arab-fund-arts-culture';

commit;
