begin;

delete from public.opportunities opportunity_row
using public.opportunity_sources source_row
where opportunity_row.source_id = source_row.id
  and source_row.slug = 'admin-import'
  and opportunity_row.external_id = 'slow-pottery-artist-residency-2026'
  and opportunity_row.canonical_url = 'https://www.slowpottery.com/pages/artist-residencies';

commit;
