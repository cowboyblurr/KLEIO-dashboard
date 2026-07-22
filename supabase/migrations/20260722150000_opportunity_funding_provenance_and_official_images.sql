begin;

alter table public.opportunities
  add column if not exists funding_display_text text not null default '',
  add column if not exists funding_amount_type text not null default 'not_stated',
  add column if not exists funding_source_url text not null default '',
  add column if not exists funding_source_note text not null default '',
  add column if not exists funding_verified_at timestamptz;

alter table public.opportunities drop constraint if exists opportunities_funding_amount_type_check;
alter table public.opportunities add constraint opportunities_funding_amount_type_check
check (funding_amount_type in (
  'not_stated','fixed','range','category_specific','conditional_maximum',
  'reimbursement_up_to','prize_pool','program_budget','varies_by_country',
  'in_kind_plus_cash'
));

create or replace function public.default_opportunity_funding_display()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  formatted_min text;
  formatted_max text;
  currency_label text;
begin
  if nullif(btrim(new.funding_display_text), '') is null
     and (new.award_min is not null or new.award_max is not null)
  then
    currency_label := nullif(btrim(coalesce(new.currency, '')), '');
    formatted_min := case when new.award_min is null then null else trim(to_char(new.award_min, 'FM999G999G999G990D##')) end;
    formatted_max := case when new.award_max is null then null else trim(to_char(new.award_max, 'FM999G999G999G990D##')) end;

    if new.award_min is not null and new.award_max is not null and new.award_min = new.award_max then
      new.funding_display_text := concat_ws(' ', currency_label, formatted_max);
      new.funding_amount_type := 'fixed';
    elsif new.award_min is not null and new.award_max is not null then
      new.funding_display_text := concat_ws(' ', currency_label, formatted_min || '–' || formatted_max);
      new.funding_amount_type := 'range';
    elsif new.award_max is not null then
      new.funding_display_text := concat('Up to ', concat_ws(' ', currency_label, formatted_max));
      new.funding_amount_type := 'conditional_maximum';
    else
      new.funding_display_text := concat('From ', concat_ws(' ', currency_label, formatted_min));
      new.funding_amount_type := 'range';
    end if;

    if nullif(btrim(new.funding_source_url), '') is null then
      new.funding_source_url := coalesce(new.guidelines_url, new.canonical_url, '');
    end if;
    new.funding_verified_at := coalesce(new.funding_verified_at, new.last_verified_at, now());
  elsif new.award_min is null and new.award_max is null and nullif(btrim(new.funding_display_text), '') is null then
    new.funding_amount_type := 'not_stated';
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_default_funding_display on public.opportunities;
create trigger opportunities_default_funding_display
before insert or update of award_min, award_max, currency, funding_display_text,
  funding_amount_type, funding_source_url, funding_verified_at
on public.opportunities
for each row execute function public.default_opportunity_funding_display();

update public.opportunities
set funding_display_text = funding_display_text
where award_min is not null or award_max is not null;

update public.opportunities opportunity_row
set award_min = 20000, award_max = 30000, currency = 'EUR',
    funding_display_text = 'EUR 20,000 for documentary scripts · EUR 30,000 for fiction scripts',
    funding_amount_type = 'category_specific',
    funding_source_url = 'https://www.boe.es/diario_boe/txt.php?id=BOE-B-2026-17504',
    funding_source_note = 'The official call has a EUR 4,000,000 program budget. The displayed values are the fixed award per selected project, not the total program budget.',
    funding_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'spain-culture-bdns'
  and opportunity_row.external_id = 'spain-icaa-screenwriting-2026';

update public.opportunities opportunity_row
set award_min = null, award_max = 1200000, currency = 'EUR',
    funding_display_text = 'Up to EUR 1,000,000 per project · up to EUR 1,200,000 for animation',
    funding_amount_type = 'category_specific',
    funding_source_url = 'https://www.boe.es/buscar/doc.php?id=BOE-B-2026-15551',
    funding_source_note = 'The official call has a EUR 30,000,000 program budget. The higher ceiling applies only to animation projects.',
    funding_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'spain-culture-bdns'
  and opportunity_row.external_id = 'spain-icaa-feature-production-905549';

update public.opportunities opportunity_row
set award_min = null, award_max = null, currency = 'EUR',
    funding_display_text = 'Eligible expenses reimbursed up to the festival-specific official cap',
    funding_amount_type = 'reimbursement_up_to',
    funding_source_url = opportunity_row.guidelines_url,
    funding_source_note = 'The maximum varies by festival and eligible expense category; KLEIO does not present one universal amount.',
    funding_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'spain-culture-bdns'
  and opportunity_row.external_id = 'spain-icaa-film-festivals-2026';

update public.opportunities opportunity_row
set award_min = 10000, award_max = 127000, currency = 'MXN',
    funding_display_text = 'MXN 10,000–127,000 depending on prize category',
    funding_amount_type = 'range',
    funding_source_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/arte-popular-2026.pdf',
    funding_source_note = 'The official call distributes 123 prizes from MXN 10,000 honorable mentions to a MXN 127,000 presidential award; the total prize pool is MXN 2,775,000.',
    funding_verified_at = now(),
    preview_image_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/arte-popular-2026.jpg',
    preview_image_source_url = opportunity_row.canonical_url,
    preview_image_alt_text = 'Official cover for the 2026 Gran Premio Nacional de Arte Popular',
    preview_image_attribution = 'Secretaría de Cultura de México / FONART',
    preview_image_rights_status = 'official_publication', preview_image_origin = 'official_source'
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'mexico-cultura'
  and opportunity_row.external_id = 'mexico-fonart-gran-premio-2026';

update public.opportunities opportunity_row
set award_min = 60800, award_max = 105000, currency = 'MXN',
    funding_display_text = 'MXN 60,800–105,000 depending on prize category',
    funding_amount_type = 'range',
    funding_source_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/grandes-maestros-2026.pdf',
    funding_source_note = 'The official call distributes 22 prizes and a total prize pool of MXN 1,588,000.',
    funding_verified_at = now(),
    preview_image_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/grandes-maestros.jpg',
    preview_image_source_url = opportunity_row.canonical_url,
    preview_image_alt_text = 'Official cover for the 2026 Grandes Maestras y Maestros del Patrimonio Artesanal de México competition',
    preview_image_attribution = 'Secretaría de Cultura de México / FONART',
    preview_image_rights_status = 'official_publication', preview_image_origin = 'official_source'
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'mexico-cultura'
  and opportunity_row.external_id = 'mexico-fonart-grandes-maestros-2026';

update public.opportunities opportunity_row
set award_min = 9000, award_max = 100000, currency = 'MXN',
    funding_display_text = 'MXN 9,000–100,000 depending on prize category',
    funding_amount_type = 'range',
    funding_source_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/nacimientos-2026.pdf',
    funding_source_note = 'The official call distributes 45 prizes and a total prize pool of MXN 1,075,000.',
    funding_verified_at = now(),
    preview_image_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/nacimientos.jpg',
    preview_image_source_url = opportunity_row.canonical_url,
    preview_image_alt_text = 'Official cover for the 2026 Concurso Nacional de Nacimientos Mexicanos',
    preview_image_attribution = 'Secretaría de Cultura de México / FONART',
    preview_image_rights_status = 'official_publication', preview_image_origin = 'official_source'
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'mexico-cultura'
  and opportunity_row.external_id = 'mexico-fonart-nacimientos-2026';

update public.opportunities opportunity_row
set award_min = 125000, award_max = 125000, currency = 'USD',
    funding_display_text = 'MXN equivalent of USD 125,000 · plus diploma and sculpture',
    funding_amount_type = 'in_kind_plus_cash',
    funding_source_url = opportunity_row.guidelines_url,
    funding_source_note = 'The cash prize is paid in Mexican pesos at the equivalent of USD 125,000 and includes non-cash recognition.',
    funding_verified_at = now(),
    preview_image_url = 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/Carlos_Fuentes_2026.jpg',
    preview_image_source_url = opportunity_row.canonical_url,
    preview_image_alt_text = 'Official cover for the 2026 Premio Internacional Carlos Fuentes',
    preview_image_attribution = 'Secretaría de Cultura de México / UNAM',
    preview_image_rights_status = 'official_publication', preview_image_origin = 'official_source'
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'mexico-cultura'
  and opportunity_row.external_id = 'mexico-carlos-fuentes-2026';

with funding_values(external_id, award_max, display_text, amount_type, source_url, note) as (
  values
    ('ibermusicas-2026-circulacion',10000::numeric,'Up to USD 10,000 · EUR 10,000 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/1-Ayuda-a-la-circulacion-de-profesionales-de-la-musica-2026.pdf','Mobility expenses only; Ibermúsicas may fund less than the requested amount.'),
    ('ibermusicas-2026-programacion',10000::numeric,'Up to USD 10,000 · EUR 10,000 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/2-Ayuda-a-la-programacion-musical-2026.pdf','The applicable currency depends on the applicant country.'),
    ('ibermusicas-2026-artistas-residencias',5000::numeric,'Up to USD 5,000 · EUR 5,000 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/06/3-Ayuda-a-artistas-e-investigadores-para-residencias-2026-ok.pdf','The applicable currency depends on the applicant country.'),
    ('ibermusicas-2026-instituciones-residencias',5000::numeric,'Up to USD 5,000 · EUR 5,000 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/4-Ayuda-a-instituciones-para-residencias-2026.pdf','The applicable currency depends on the applicant country.'),
    ('ibermusicas-2026-especializacion',6000::numeric,'USD/EUR 1,000 per month for up to 6 months · maximum 6,000','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/5-Ayuda-a-la-especializacion-y-el-perfeccionamiento-artistico-y-tecnico-2026.pdf','Spain and Portugal use euros; other participating countries use U.S. dollars or local-currency equivalent.'),
    ('ibermusicas-2026-proyectos-virtuales',2500::numeric,'Up to USD 2,500 · EUR 2,500 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/6-Ayuda-a-proyectos-virtuales-2026.pdf','The applicable currency depends on the applicant country.'),
    ('ibermusicas-2026-repertorio',2500::numeric,'Up to USD 2,500 · EUR 2,500 for Spain or Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/05/7-Ayuda-a-la-promocion-del-repertorio-iberoamericano-2026.pdf','The applicable currency depends on the applicant country.'),
    ('ibermusicas-2026-mid-atlantic-arts',5000::numeric,'Ibermúsicas: up to USD/EUR 5,000 for visa costs · host support may reach USD 16,500','in_kind_plus_cash','https://www.ibermusicas.org/wp-content/uploads/2026/05/8-Convocatoria-especial-Ibermusicas-%E2%80%93-Mid-Atlantic-Arts-2026.pdf','The USD 16,500 component is potential presenter/host support from Mid Atlantic Arts, not guaranteed direct cash to the artist.'),
    ('ibermusicas-2026-emilia-romagna',10000::numeric,'EUR 10,000 per selected project','fixed','https://www.ibermusicas.org/wp-content/uploads/2026/05/9-Convocatoria-especial-Ibermusicas-Emilia-Romagna-Conectando-artistas-y-escenas-musicales-2026.docx.pdf','Fixed support stated in the official special-call guidelines.'),
    ('ibermusicas-2026-arts-council-england',10000::numeric,'Up to USD 10,000 · EUR 10,000 for Spain or Portugal · local partner support included','in_kind_plus_cash','https://www.ibermusicas.org/wp-content/uploads/2026/06/10-Convocatoria-especial-Ibermusicas-Arts-Council-England-2026-ok.pdf','Local transport, accommodation, and performance fees may be supplied by program partners under separate agreements.'),
    ('ibermusicas-2026-canciones',2000::numeric,'USD 2,000 per selected song · split equally between two creators','fixed','https://www.ibermusicas.org/wp-content/uploads/2026/06/13-Premio-Ibermusicas-a-la-creacion-de-canciones-2026-ok.pdf','The total award is divided equally between the two co-creators.'),
    ('ibermusicas-2026-canciones-infancias',2000::numeric,'USD 2,000 per selected song · EUR 2,000 for Portugal · split between creators','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/06/14-Premio-Ibermusicas-a-la-creacion-de-canciones-para-las-infancias-2026-okk.pdf','The total award is divided equally between the two co-creators.'),
    ('ibermusicas-2026-sinfonica',2500::numeric,'USD 2,500 · EUR 2,500 for Portugal','varies_by_country','https://www.ibermusicas.org/wp-content/uploads/2026/06/15-Premio-Ibermusicas-de-composicion-de-obra-para-Orquesta-Sinfonica-2026-okkk.pdf','The applicable currency depends on the participating country stated in the guidelines.')
)
update public.opportunities opportunity_row
set award_min = case when funding_values.amount_type = 'fixed' then funding_values.award_max else null end,
    award_max = funding_values.award_max,
    currency = case when funding_values.external_id = 'ibermusicas-2026-emilia-romagna' then 'EUR' when funding_values.amount_type = 'fixed' then 'USD' else null end,
    funding_display_text = funding_values.display_text,
    funding_amount_type = funding_values.amount_type,
    funding_source_url = funding_values.source_url,
    funding_source_note = funding_values.note,
    funding_verified_at = now()
from funding_values
join public.opportunity_sources source_row on source_row.slug = 'ibermusicas'
where opportunity_row.source_id = source_row.id
  and opportunity_row.external_id = funding_values.external_id;

update public.opportunities opportunity_row
set funding_display_text = 'Amount not stated in the official source',
    funding_amount_type = 'not_stated',
    funding_source_url = coalesce(nullif(opportunity_row.guidelines_url, ''), opportunity_row.canonical_url),
    funding_source_note = 'KLEIO checked the current official record and did not find a published award floor, ceiling, or fixed amount.',
    funding_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id
  and source_row.active
  and opportunity_row.status in ('open','forecasted','upcoming')
  and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
  and nullif(btrim(opportunity_row.funding_display_text), '') is null;

commit;
