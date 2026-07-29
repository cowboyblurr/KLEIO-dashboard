-- KLEIO natural-language opportunity search
-- Production-safe, idempotent migration. The database remains authoritative for
-- query interpretation so every current and future client receives the same behavior.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;

create or replace function public.normalize_opportunity_search_text(input_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
    lower(extensions.unaccent(coalesce(input_text, ''))),
    '[^[:alnum:]]+',
    ' ',
    'g'
  ));
$$;

create table if not exists public.artistic_taxonomy_terms (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('discipline', 'opportunity_type', 'location', 'format', 'fee')),
  canonical_value text not null,
  display_label text not null,
  parent_value text,
  search_weight numeric not null default 1 check (search_weight > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, canonical_value)
);

create table if not exists public.artistic_taxonomy_aliases (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.artistic_taxonomy_terms(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  language_code text not null default 'en',
  relation_type text not null default 'synonym'
    check (relation_type in ('canonical', 'synonym', 'related', 'translation', 'common_misspelling')),
  match_weight numeric not null default 1 check (match_weight > 0 and match_weight <= 1.5),
  display_priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (term_id, normalized_alias, language_code)
);

create table if not exists public.opportunity_taxonomy_mappings (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  term_id uuid not null references public.artistic_taxonomy_terms(id) on delete cascade,
  mapping_type text not null default 'structured_field'
    check (mapping_type in ('structured_field', 'official_source', 'translation', 'manual_review')),
  source_text text,
  source_url text,
  verification_status text not null default 'confirmed'
    check (verification_status in ('confirmed', 'ambiguous', 'needs_review')),
  last_verified_at timestamptz not null default now(),
  primary key (opportunity_id, term_id)
);

create table if not exists public.opportunity_search_stop_terms (
  normalized_term text not null,
  language_code text not null default 'en',
  active boolean not null default true,
  primary key (normalized_term, language_code)
);

alter table public.artistic_taxonomy_terms enable row level security;
alter table public.artistic_taxonomy_aliases enable row level security;
alter table public.opportunity_taxonomy_mappings enable row level security;
alter table public.opportunity_search_stop_terms enable row level security;

drop policy if exists artistic_taxonomy_terms_public_read on public.artistic_taxonomy_terms;
create policy artistic_taxonomy_terms_public_read
on public.artistic_taxonomy_terms for select
to anon, authenticated
using (active or private.is_kleio_admin());

drop policy if exists artistic_taxonomy_terms_admin_write on public.artistic_taxonomy_terms;
create policy artistic_taxonomy_terms_admin_write
on public.artistic_taxonomy_terms for all
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_aliases_public_read on public.artistic_taxonomy_aliases;
create policy artistic_taxonomy_aliases_public_read
on public.artistic_taxonomy_aliases for select
to anon, authenticated
using (active or private.is_kleio_admin());

drop policy if exists artistic_taxonomy_aliases_admin_write on public.artistic_taxonomy_aliases;
create policy artistic_taxonomy_aliases_admin_write
on public.artistic_taxonomy_aliases for all
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists opportunity_taxonomy_mappings_public_read on public.opportunity_taxonomy_mappings;
create policy opportunity_taxonomy_mappings_public_read
on public.opportunity_taxonomy_mappings for select
to anon, authenticated
using (verification_status = 'confirmed' or private.is_kleio_admin());

drop policy if exists opportunity_taxonomy_mappings_admin_write on public.opportunity_taxonomy_mappings;
create policy opportunity_taxonomy_mappings_admin_write
on public.opportunity_taxonomy_mappings for all
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists opportunity_search_stop_terms_public_read on public.opportunity_search_stop_terms;
create policy opportunity_search_stop_terms_public_read
on public.opportunity_search_stop_terms for select
to anon, authenticated
using (active or private.is_kleio_admin());

drop policy if exists opportunity_search_stop_terms_admin_write on public.opportunity_search_stop_terms;
create policy opportunity_search_stop_terms_admin_write
on public.opportunity_search_stop_terms for all
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

grant select on public.artistic_taxonomy_terms,
  public.artistic_taxonomy_aliases,
  public.opportunity_taxonomy_mappings,
  public.opportunity_search_stop_terms
to anon, authenticated;

create index if not exists artistic_taxonomy_aliases_normalized_idx
  on public.artistic_taxonomy_aliases(normalized_alias);
create index if not exists artistic_taxonomy_aliases_trgm_idx
  on public.artistic_taxonomy_aliases using gin (normalized_alias extensions.gin_trgm_ops);
create index if not exists artistic_taxonomy_terms_category_idx
  on public.artistic_taxonomy_terms(category, canonical_value)
  where active;
create index if not exists opportunity_taxonomy_mappings_term_idx
  on public.opportunity_taxonomy_mappings(term_id, opportunity_id)
  where verification_status = 'confirmed';

insert into public.opportunity_search_stop_terms(normalized_term, language_code)
values
  ('a','en'),('an','en'),('and','en'),('are','en'),('around','en'),('at','en'),
  ('for','en'),('from','en'),('i','en'),('in','en'),('is','en'),('looking','en'),
  ('me','en'),('my','en'),('near','en'),('of','en'),('on','en'),('or','en'),
  ('show','en'),('that','en'),('the','en'),('to','en'),('want','en'),('with','en'),
  ('find','en'),('need','en'),('please','en'),('search','en'),
  ('art','en'),('artist','en'),('artists','en'),('opportunity','en'),('opportunities','en'),
  ('program','en'),('programs','en'),('programme','en'),('programmes','en'),
  ('para','es'),('de','es'),('del','es'),('la','es'),('las','es'),('los','es'),
  ('oportunidad','es'),('oportunidades','es'),('convocatoria','es'),('convocatorias','es'),
  ('para','pt'),('de','pt'),('da','pt'),('das','pt'),('do','pt'),('dos','pt'),
  ('oportunidade','pt'),('oportunidades','pt'),('edital','pt'),('editais','pt'),
  ('pour','fr'),('de','fr'),('des','fr'),('les','fr'),('opportunite','fr'),('opportunites','fr'),
  ('fur','de'),('und','de'),('kunstler','de'),('kunstlerin','de')
on conflict do nothing;

with seed(category, canonical_value, display_label, parent_value, search_weight) as (
  values
    ('discipline','Ceramics','Ceramics','Craft',1.35),
    ('discipline','Painting','Painting','Visual Arts',1.20),
    ('discipline','Drawing','Drawing','Visual Arts',1.15),
    ('discipline','Photography','Photography','Visual Arts',1.20),
    ('discipline','Sculpture','Sculpture','Visual Arts',1.20),
    ('discipline','Film','Film / Video','Moving Image',1.20),
    ('discipline','Performance','Performance','Performing Arts',1.15),
    ('discipline','Installation','Installation','Visual Arts',1.15),
    ('discipline','Digital Art','Digital Art','Visual Arts',1.15),
    ('discipline','Illustration','Illustration','Visual Arts',1.10),
    ('discipline','Printmaking','Printmaking','Visual Arts',1.10),
    ('discipline','Textiles','Textiles / Fiber','Craft',1.20),
    ('discipline','Sound','Sound Art','Music',1.10),
    ('discipline','Writing','Writing / Literary Arts','Literature',1.10),
    ('discipline','Multidisciplinary','Multidisciplinary','Interdisciplinary Arts',1.00),
    ('opportunity_type','residency','Residencies',null,1.00),
    ('opportunity_type','grant','Grants',null,1.00),
    ('opportunity_type','fellowship','Fellowships',null,1.00),
    ('opportunity_type','commission','Commissions',null,1.00),
    ('opportunity_type','prize_award','Prizes / Awards',null,1.00),
    ('opportunity_type','open_call','Open Calls',null,1.00),
    ('opportunity_type','professional_development','Professional Development',null,1.00),
    ('location','Worldwide','Worldwide',null,1.00),
    ('location','Asia','Asia',null,1.00),
    ('location','Europe','Europe',null,1.00),
    ('location','Africa','Africa',null,1.00),
    ('location','Latin America','Latin America',null,1.00),
    ('location','Caribbean','Caribbean',null,1.00),
    ('location','Oceania','Oceania',null,1.00),
    ('location','United States','United States',null,1.00),
    ('location','Mexico','Mexico',null,1.00),
    ('location','Jamaica','Jamaica',null,1.00),
    ('format','online','Online / remote',null,1.00),
    ('format','in_person','In person',null,1.00),
    ('format','hybrid','Hybrid',null,1.00),
    ('fee','no_fee','No application fee',null,1.00)
)
insert into public.artistic_taxonomy_terms(category, canonical_value, display_label, parent_value, search_weight)
select * from seed
on conflict (category, canonical_value) do update
set display_label = excluded.display_label,
    parent_value = excluded.parent_value,
    search_weight = excluded.search_weight,
    active = true,
    updated_at = now();

with aliases(category, canonical_value, alias, language_code, relation_type, match_weight, display_priority) as (
  values
    ('discipline','Ceramics','ceramics','en','canonical',1.35,1),
    ('discipline','Ceramics','pottery','en','synonym',1.30,2),
    ('discipline','Ceramics','clay','en','synonym',1.20,3),
    ('discipline','Ceramics','ceramic','en','synonym',1.30,20),
    ('discipline','Ceramics','potter','en','synonym',1.25,4),
    ('discipline','Ceramics','clay art','en','synonym',1.20,6),
    ('discipline','Ceramics','clay artist','en','synonym',1.20,7),
    ('discipline','Ceramics','ceramicist','en','synonym',1.20,8),
    ('discipline','Ceramics','ceramic sculpture','en','related',1.10,9),
    ('discipline','Ceramics','earthenware','en','related',1.10,10),
    ('discipline','Ceramics','stoneware','en','related',1.10,11),
    ('discipline','Ceramics','porcelain','en','related',1.10,12),
    ('discipline','Ceramics','wheel thrown','en','related',1.05,13),
    ('discipline','Ceramics','wheel throwing','en','related',1.05,14),
    ('discipline','Ceramics','hand built ceramics','en','related',1.05,15),
    ('discipline','Ceramics','kiln','en','related',1.00,16),
    ('discipline','Ceramics','functional pottery','en','related',1.05,17),
    ('discipline','Ceramics','studio pottery','en','related',1.05,18),
    ('discipline','Ceramics','potery','en','common_misspelling',0.90,90),
    ('discipline','Ceramics','cermaics','en','common_misspelling',0.90,91),
    ('discipline','Ceramics','porcelin','en','common_misspelling',0.85,92),
    ('discipline','Ceramics','ceramica','es','translation',1.20,20),
    ('discipline','Ceramics','alfareria','es','translation',1.20,21),
    ('discipline','Ceramics','barro','es','translation',1.05,22),
    ('discipline','Ceramics','ceramica','pt','translation',1.20,20),
    ('discipline','Ceramics','olaria','pt','translation',1.20,21),
    ('discipline','Ceramics','barro','pt','translation',1.05,22),
    ('discipline','Ceramics','ceramique','fr','translation',1.20,20),
    ('discipline','Ceramics','poterie','fr','translation',1.20,21),
    ('discipline','Ceramics','argile','fr','translation',1.05,22),
    ('discipline','Ceramics','keramik','de','translation',1.20,20),
    ('discipline','Ceramics','topferei','de','translation',1.20,21),
    ('discipline','Ceramics','ceramica','it','translation',1.20,20),
    ('discipline','Ceramics','terracotta','it','translation',1.10,21),
    ('discipline','Ceramics','خزف','ar','translation',1.20,20),
    ('discipline','Ceramics','فخار','ar','translation',1.20,21),
    ('discipline','Ceramics','سيراميك','ar','translation',1.15,22),
    ('discipline','Ceramics','陶芸','ja','translation',1.20,20),
    ('discipline','Ceramics','陶器','ja','translation',1.15,21),
    ('discipline','Ceramics','도예','ko','translation',1.20,20),
    ('discipline','Ceramics','도자기','ko','translation',1.15,21),
    ('discipline','Ceramics','陶艺','zh','translation',1.20,20),
    ('discipline','Ceramics','陶瓷','zh','translation',1.15,21),
    ('discipline','Painting','painting','en','canonical',1.20,1),
    ('discipline','Painting','paintings','en','synonym',1.10,2),
    ('discipline','Painting','painter','en','synonym',1.10,3),
    ('discipline','Drawing','drawing','en','canonical',1.15,1),
    ('discipline','Drawing','drawings','en','synonym',1.05,2),
    ('discipline','Photography','photography','en','canonical',1.20,1),
    ('discipline','Photography','photographer','en','synonym',1.10,2),
    ('discipline','Photography','photographic','en','synonym',1.05,3),
    ('discipline','Sculpture','sculpture','en','canonical',1.20,1),
    ('discipline','Sculpture','sculptural','en','synonym',1.10,2),
    ('discipline','Sculpture','sculptor','en','synonym',1.10,3),
    ('discipline','Film','film','en','canonical',1.20,1),
    ('discipline','Film','filmmaking','en','synonym',1.15,2),
    ('discipline','Film','cinema','en','synonym',1.15,3),
    ('discipline','Film','video art','en','synonym',1.10,4),
    ('discipline','Film','moving image','en','synonym',1.10,5),
    ('discipline','Performance','performance','en','canonical',1.15,1),
    ('discipline','Performance','performance art','en','synonym',1.15,2),
    ('discipline','Performance','live art','en','synonym',1.05,3),
    ('discipline','Installation','installation','en','canonical',1.15,1),
    ('discipline','Installation','installation art','en','synonym',1.15,2),
    ('discipline','Installation','site specific','en','related',1.00,3),
    ('discipline','Digital Art','digital art','en','canonical',1.15,1),
    ('discipline','Digital Art','new media','en','synonym',1.10,2),
    ('discipline','Digital Art','creative technology','en','related',1.00,3),
    ('discipline','Illustration','illustration','en','canonical',1.10,1),
    ('discipline','Illustration','illustrator','en','synonym',1.05,2),
    ('discipline','Printmaking','printmaking','en','canonical',1.10,1),
    ('discipline','Printmaking','prints','en','related',0.90,2),
    ('discipline','Textiles','textiles','en','canonical',1.20,1),
    ('discipline','Textiles','textile','en','synonym',1.15,2),
    ('discipline','Textiles','fiber art','en','synonym',1.15,3),
    ('discipline','Textiles','fibre art','en','synonym',1.15,4),
    ('discipline','Sound','sound art','en','canonical',1.10,1),
    ('discipline','Sound','sonic art','en','synonym',1.05,2),
    ('discipline','Writing','writing','en','canonical',1.10,1),
    ('discipline','Writing','writer','en','synonym',1.05,2),
    ('discipline','Writing','poetry','en','related',1.00,3),
    ('discipline','Multidisciplinary','multidisciplinary','en','canonical',1.00,1),
    ('discipline','Multidisciplinary','interdisciplinary','en','synonym',1.00,2),
    ('opportunity_type','residency','residency','en','canonical',1.00,1),
    ('opportunity_type','residency','residencies','en','synonym',1.00,2),
    ('opportunity_type','grant','grant','en','canonical',1.00,1),
    ('opportunity_type','grant','grants','en','synonym',1.00,2),
    ('opportunity_type','grant','funding','en','related',0.90,3),
    ('opportunity_type','fellowship','fellowship','en','canonical',1.00,1),
    ('opportunity_type','fellowship','fellowships','en','synonym',1.00,2),
    ('opportunity_type','commission','commission','en','canonical',1.00,1),
    ('opportunity_type','commission','commissions','en','synonym',1.00,2),
    ('opportunity_type','prize_award','competition','en','synonym',1.00,1),
    ('opportunity_type','prize_award','competitions','en','synonym',1.00,2),
    ('opportunity_type','prize_award','prize','en','synonym',1.00,3),
    ('opportunity_type','prize_award','award','en','synonym',1.00,4),
    ('opportunity_type','open_call','open call','en','canonical',1.00,1),
    ('opportunity_type','open_call','open calls','en','synonym',1.00,2),
    ('opportunity_type','open_call','call for artists','en','synonym',1.00,3),
    ('opportunity_type','professional_development','professional development','en','canonical',1.00,1),
    ('opportunity_type','professional_development','workshop','en','related',0.90,2),
    ('location','Worldwide','worldwide','en','canonical',1.00,1),
    ('location','Worldwide','international','en','synonym',0.95,2),
    ('location','Worldwide','global','en','synonym',0.95,3),
    ('location','Asia','asia','en','canonical',1.00,1),
    ('location','Europe','europe','en','canonical',1.00,1),
    ('location','Africa','africa','en','canonical',1.00,1),
    ('location','Latin America','latin america','en','canonical',1.00,1),
    ('location','Latin America','south america','en','related',0.90,2),
    ('location','Caribbean','caribbean','en','canonical',1.00,1),
    ('location','Oceania','oceania','en','canonical',1.00,1),
    ('location','United States','united states','en','canonical',1.00,1),
    ('location','United States','usa','en','synonym',1.00,2),
    ('location','Mexico','mexico','en','canonical',1.00,1),
    ('location','Jamaica','jamaica','en','canonical',1.00,1),
    ('format','online','online','en','canonical',1.00,1),
    ('format','online','remote','en','synonym',1.00,2),
    ('format','online','virtual','en','synonym',1.00,3),
    ('format','in_person','in person','en','canonical',1.00,1),
    ('format','in_person','onsite','en','synonym',1.00,2),
    ('format','hybrid','hybrid','en','canonical',1.00,1),
    ('fee','no_fee','no fee','en','canonical',1.00,1),
    ('fee','no_fee','free to apply','en','synonym',1.00,2)
)
insert into public.artistic_taxonomy_aliases(
  term_id, alias, normalized_alias, language_code, relation_type, match_weight, display_priority
)
select t.id, a.alias, public.normalize_opportunity_search_text(a.alias), a.language_code,
       a.relation_type, a.match_weight, a.display_priority
from aliases a
join public.artistic_taxonomy_terms t
  on t.category = a.category and t.canonical_value = a.canonical_value
where public.normalize_opportunity_search_text(a.alias) <> ''
on conflict (term_id, normalized_alias, language_code) do update
set alias = excluded.alias,
    relation_type = excluded.relation_type,
    match_weight = excluded.match_weight,
    display_priority = excluded.display_priority,
    active = true;

create or replace function public.match_opportunity_search_terms(input_query text)
returns table (
  category text,
  canonical_value text,
  display_label text,
  matched_alias text,
  matched_input text,
  relation_type text,
  match_quality numeric,
  match_method text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select public.normalize_opportunity_search_text(input_query) as normalized_query
  ),
  exact_candidates as (
    select
      t.category,
      t.canonical_value,
      t.display_label,
      a.alias as matched_alias,
      a.normalized_alias as matched_input,
      a.relation_type,
      (a.match_weight * t.search_weight)::numeric as match_quality,
      length(a.normalized_alias) as alias_length
    from input i
    join public.artistic_taxonomy_aliases a
      on a.active
     and (' ' || i.normalized_query || ' ') like ('% ' || a.normalized_alias || ' %')
    join public.artistic_taxonomy_terms t on t.id = a.term_id and t.active
  ),
  phrase_precedence as (
    select candidate.*
    from exact_candidates candidate
    where not exists (
      select 1
      from exact_candidates longer
      where longer.alias_length > candidate.alias_length
        and longer.canonical_value <> candidate.canonical_value
        and (' ' || longer.matched_input || ' ') like ('% ' || candidate.matched_input || ' %')
    )
  ),
  exact_matches as (
    select distinct on (category, canonical_value)
      category, canonical_value, display_label, matched_alias, matched_input,
      relation_type, match_quality, 'exact'::text as match_method
    from phrase_precedence
    order by category, canonical_value, match_quality desc, alias_length desc
  ),
  tokens as (
    select distinct token
    from input i,
    lateral regexp_split_to_table(i.normalized_query, '\s+') token
    where length(token) >= 4
      and not exists (
        select 1 from public.opportunity_search_stop_terms s
        where s.active and s.normalized_term = token
      )
      and not exists (
        select 1 from exact_candidates ec
        where (' ' || ec.matched_input || ' ') like ('% ' || token || ' %')
      )
  ),
  fuzzy_candidates as (
    select
      t.category,
      t.canonical_value,
      t.display_label,
      a.alias as matched_alias,
      tok.token as matched_input,
      a.relation_type,
      (a.match_weight * t.search_weight *
        case
          when extensions.levenshtein(tok.token, a.normalized_alias) = 1 then 0.82
          when extensions.levenshtein(tok.token, a.normalized_alias) = 2 then 0.68
          else 0.55
        end
      )::numeric as match_quality,
      'fuzzy'::text as match_method,
      row_number() over (
        partition by tok.token, t.category
        order by extensions.levenshtein(tok.token, a.normalized_alias),
          a.match_weight * t.search_weight desc,
          length(a.normalized_alias)
      ) as candidate_rank
    from tokens tok
    join public.artistic_taxonomy_aliases a
      on a.active
     and position(' ' in a.normalized_alias) = 0
     and abs(length(tok.token) - length(a.normalized_alias)) <= 2
     and extensions.levenshtein(tok.token, a.normalized_alias) > 0
     and extensions.levenshtein(tok.token, a.normalized_alias)
       <= case when greatest(length(tok.token), length(a.normalized_alias)) >= 8 then 2 else 1 end
    join public.artistic_taxonomy_terms t on t.id = a.term_id and t.active
    where not exists (
      select 1 from exact_matches e
      where e.category = t.category and e.canonical_value = t.canonical_value
    )
  )
  select * from exact_matches
  union all
  select category, canonical_value, display_label, matched_alias, matched_input,
         relation_type, match_quality, match_method
  from fuzzy_candidates
  where candidate_rank = 1 and match_quality >= 0.60;
$$;

create or replace function public.interpret_opportunity_search_query(input_query text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select public.normalize_opportunity_search_text(input_query) as normalized_query
  ),
  matches as (
    select * from public.match_opportunity_search_terms(input_query)
  ),
  matched_words as (
    select distinct word
    from matches m,
    lateral regexp_split_to_table(public.normalize_opportunity_search_text(m.matched_input), '\s+') word
  ),
  residual_words as (
    select token, ordinality
    from input i,
    lateral regexp_split_to_table(i.normalized_query, '\s+') with ordinality as token
    where token <> ''
      and not exists (
        select 1 from public.opportunity_search_stop_terms s
        where s.active and s.normalized_term = token
      )
      and not exists (select 1 from matched_words w where w.word = token)
  ),
  aggregate_values as (
    select
      coalesce(array_agg(distinct canonical_value order by canonical_value)
        filter (where category = 'discipline'), '{}'::text[]) as disciplines,
      coalesce(array_agg(distinct canonical_value order by canonical_value)
        filter (where category = 'opportunity_type'), '{}'::text[]) as opportunity_types,
      coalesce(array_agg(distinct canonical_value order by canonical_value)
        filter (where category = 'location'), '{}'::text[]) as locations,
      coalesce(array_agg(distinct canonical_value order by canonical_value)
        filter (where category = 'format'), '{}'::text[]) as formats,
      coalesce(array_agg(distinct canonical_value order by canonical_value)
        filter (where category = 'fee'), '{}'::text[]) as fee_terms
    from matches
  ),
  display_values as (
    select coalesce(array_agg(label order by priority) filter (where rn <= 3), '{}'::text[]) as labels
    from (
      select initcap(a.alias) as label, a.display_priority as priority,
        row_number() over (order by a.display_priority, a.alias) as rn
      from (
        select distinct t.id
        from matches m
        join public.artistic_taxonomy_terms t
          on t.category = m.category and t.canonical_value = m.canonical_value
        where m.category = 'discipline'
      ) matched_terms
      join public.artistic_taxonomy_aliases a on a.term_id = matched_terms.id and a.active
      where a.language_code = 'en'
        and a.relation_type in ('canonical','synonym')
    ) display_rows
  ),
  corrections as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'input', matched_input,
      'interpreted_as', display_label,
      'canonical_value', canonical_value
    ) order by matched_input) filter (
      where match_method = 'fuzzy' or relation_type = 'common_misspelling'
    ), '[]'::jsonb) as value
    from matches
  )
  select jsonb_build_object(
    'raw_query', coalesce(input_query, ''),
    'normalized_query', i.normalized_query,
    'residual_query', coalesce((select string_agg(token, ' ' order by ordinality) from residual_words), ''),
    'canonical_disciplines', to_jsonb(a.disciplines),
    'opportunity_types', to_jsonb(a.opportunity_types),
    'locations', to_jsonb(a.locations),
    'participation_formats', to_jsonb(a.formats),
    'fee_terms', to_jsonb(a.fee_terms),
    'expanded_labels', to_jsonb(d.labels),
    'corrections', c.value,
    'has_structured_intent',
      cardinality(a.disciplines) + cardinality(a.opportunity_types) +
      cardinality(a.locations) + cardinality(a.formats) + cardinality(a.fee_terms) > 0,
    'summary',
      case
        when cardinality(d.labels) > 0
          then 'Showing ' || array_to_string(d.labels, ', ') || ' opportunities.'
        when i.normalized_query <> ''
          then 'Searching verified opportunity text and structured fields.'
        else ''
      end
  )
  from input i cross join aggregate_values a cross join display_values d cross join corrections c;
$$;

grant execute on function public.match_opportunity_search_terms(text) to anon, authenticated;
grant execute on function public.interpret_opportunity_search_query(text) to anon, authenticated;

insert into public.opportunity_taxonomy_mappings(
  opportunity_id, term_id, mapping_type, source_text, source_url,
  verification_status, last_verified_at
)
select
  o.id,
  t.id,
  'structured_field',
  'Canonical opportunity discipline matches the KLEIO artistic-practice taxonomy.',
  o.canonical_url,
  'confirmed',
  coalesce(o.last_verified_at, now())
from public.opportunities o
join lateral unnest(coalesce(o.disciplines, '{}'::text[])) d on true
join public.artistic_taxonomy_terms t
  on t.category = 'discipline'
 and public.normalize_opportunity_search_text(t.canonical_value) =
     public.normalize_opportunity_search_text(d)
on conflict (opportunity_id, term_id) do update
set mapping_type = excluded.mapping_type,
    source_text = excluded.source_text,
    source_url = excluded.source_url,
    verification_status = excluded.verification_status,
    last_verified_at = excluded.last_verified_at;

create or replace function public.search_opportunities_v2(
  search_query text default null::text,
  opportunity_types text[] default null::text[],
  source_slugs text[] default null::text[],
  applicant_types text[] default null::text[],
  eligible_country text default null::text,
  participation_formats text[] default null::text[],
  discipline_filters text[] default null::text[],
  career_stage_filters text[] default null::text[],
  deadline_from timestamp with time zone default null::timestamp with time zone,
  deadline_to timestamp with time zone default null::timestamp with time zone,
  minimum_funding numeric default null::numeric,
  funding_known_only boolean default false,
  structured_requirements_only boolean default false,
  no_fee_only boolean default false,
  external_only boolean default false,
  limit_count integer default 50,
  offset_count integer default 0
)
returns setof public.opportunities
language sql
stable
security invoker
set search_path = ''
as $function$
  with parsed as (
    select public.interpret_opportunity_search_query(search_query) as value
  ),
  context as (
    select
      coalesce(search_query, '') as raw_query,
      coalesce(value->>'normalized_query', '') as normalized_query,
      coalesce(value->>'residual_query', '') as residual_query,
      coalesce(array(select jsonb_array_elements_text(value->'canonical_disciplines')), '{}'::text[]) as query_disciplines,
      coalesce(array(select jsonb_array_elements_text(value->'opportunity_types')), '{}'::text[]) as query_types,
      coalesce(array(select jsonb_array_elements_text(value->'locations')), '{}'::text[]) as query_locations,
      coalesce(array(select jsonb_array_elements_text(value->'participation_formats')), '{}'::text[]) as query_formats,
      coalesce(array(select jsonb_array_elements_text(value->'fee_terms')), '{}'::text[]) as query_fee_terms
    from parsed
  ),
  candidates as (
    select
      opportunity_row as opportunity_record,
      c.*,
      exists (
        select 1 from unnest(coalesce(opportunity_row.disciplines, '{}'::text[])) d
        where exists (
          select 1 from unnest(c.query_disciplines) qd
          where public.normalize_opportunity_search_text(d) =
                public.normalize_opportunity_search_text(qd)
        )
      ) or exists (
        select 1
        from public.opportunity_taxonomy_mappings mapping_row
        join public.artistic_taxonomy_terms term_row on term_row.id = mapping_row.term_id
        where mapping_row.opportunity_id = opportunity_row.id
          and mapping_row.verification_status = 'confirmed'
          and term_row.category = 'discipline'
          and term_row.canonical_value = any(c.query_disciplines)
      ) as discipline_match,
      opportunity_row.opportunity_type = any(c.query_types) as type_match,
      exists (
        select 1
        from unnest(
          coalesce(opportunity_row.locations, '{}'::text[]) ||
          coalesce(opportunity_row.eligible_regions, '{}'::text[]) ||
          coalesce(opportunity_row.eligible_countries, '{}'::text[])
        ) location_value
        where exists (
          select 1 from unnest(c.query_locations) query_location
          where public.normalize_opportunity_search_text(location_value) =
                public.normalize_opportunity_search_text(query_location)
             or public.normalize_opportunity_search_text(location_value)
                like '%' || public.normalize_opportunity_search_text(query_location) || '%'
        )
      ) as location_match,
      opportunity_row.participation_format = any(c.query_formats)
        or ('online' = any(c.query_formats) and opportunity_row.remote_allowed is true) as format_match,
      (opportunity_row.application_fee = 0 and 'no_fee' = any(c.query_fee_terms)) as fee_match,
      case
        when c.residual_query = '' then false
        else opportunity_row.search_document @@ websearch_to_tsquery('simple', c.residual_query)
      end as residual_fts_match,
      case
        when c.normalized_query = '' then false
        else opportunity_row.search_document @@ websearch_to_tsquery('simple', c.normalized_query)
      end as raw_fts_match,
      greatest(
        extensions.similarity(public.normalize_opportunity_search_text(opportunity_row.title), c.residual_query),
        extensions.similarity(public.normalize_opportunity_search_text(opportunity_row.provider_name), c.residual_query)
      ) as fuzzy_text_score
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
    cross join context c
    where opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
      and opportunity_row.verification_status not in ('needs_review', 'expired', 'rejected')
      and source_row.active
      and (opportunity_types is null or cardinality(opportunity_types) = 0 or opportunity_row.opportunity_type = any(opportunity_types))
      and (source_slugs is null or cardinality(source_slugs) = 0 or source_row.slug = any(source_slugs))
      and (applicant_types is null or cardinality(applicant_types) = 0 or opportunity_row.eligible_applicant_types && applicant_types)
      and (
        nullif(trim(eligible_country), '') is null
        or exists (
          select 1 from unnest(coalesce(opportunity_row.eligible_countries, '{}'::text[])) country_value
          where lower(trim(country_value)) = lower(trim(eligible_country))
        )
        or exists (
          select 1 from unnest(coalesce(opportunity_row.eligible_regions, '{}'::text[])) region_value
          where lower(trim(region_value)) = lower(trim(eligible_country))
        )
      )
      and (participation_formats is null or cardinality(participation_formats) = 0 or opportunity_row.participation_format = any(participation_formats))
      and (
        discipline_filters is null or cardinality(discipline_filters) = 0
        or exists (
          select 1
          from unnest(coalesce(opportunity_row.disciplines, '{}'::text[])) discipline_value
          join unnest(discipline_filters) requested_discipline
            on public.normalize_opportunity_search_text(discipline_value) =
               public.normalize_opportunity_search_text(requested_discipline)
        )
      )
      and (
        career_stage_filters is null or cardinality(career_stage_filters) = 0
        or exists (
          select 1
          from unnest(coalesce(opportunity_row.career_stages, '{}'::text[])) career_value
          join unnest(career_stage_filters) requested_career
            on public.normalize_opportunity_search_text(career_value) =
               public.normalize_opportunity_search_text(requested_career)
        )
      )
      and (deadline_from is null or opportunity_row.deadline_at >= deadline_from)
      and (deadline_to is null or opportunity_row.deadline_at <= deadline_to)
      and (
        minimum_funding is null
        or greatest(coalesce(opportunity_row.award_min, 0), coalesce(opportunity_row.award_max, 0)) >= minimum_funding
      )
      and (
        not funding_known_only
        or opportunity_row.award_min is not null
        or opportunity_row.award_max is not null
        or nullif(trim(opportunity_row.funding_display_text), '') is not null
      )
      and (
        not structured_requirements_only
        or exists (
          select 1 from public.opportunity_requirements requirement_row
          where requirement_row.opportunity_id = opportunity_row.id
            and requirement_row.verification_status = 'confirmed'
        )
      )
      and (not no_fee_only or opportunity_row.application_fee = 0)
      and (not external_only or opportunity_row.application_mode = 'external')
  ),
  ranked as (
    select
      candidate.*,
      (
        case when cardinality(query_disciplines) > 0 and discipline_match then 120 else 0 end +
        case when cardinality(query_types) > 0 and type_match then 30 else 0 end +
        case when cardinality(query_locations) > 0 and location_match then 25 else 0 end +
        case when cardinality(query_formats) > 0 and format_match then 20 else 0 end +
        case when cardinality(query_fee_terms) > 0 and fee_match then 15 else 0 end +
        case when residual_fts_match then 40 else 0 end +
        case when raw_fts_match then 25 else 0 end +
        case when fuzzy_text_score >= 0.45 then fuzzy_text_score * 20 else 0 end
      )::numeric as relevance_score
    from candidates candidate
  )
  select (ranked.opportunity_record).*
  from ranked
  where
    nullif(trim(raw_query), '') is null
    or case
      when cardinality(query_disciplines) > 0 then discipline_match
      when cardinality(query_locations) > 0 then location_match
      when cardinality(query_types) > 0 then type_match
      when cardinality(query_formats) > 0 then format_match
      when cardinality(query_fee_terms) > 0 then fee_match
      else residual_fts_match or raw_fts_match or fuzzy_text_score >= 0.45
    end
  order by
    relevance_score desc,
    case
      when nullif(trim((ranked.opportunity_record).preview_image_path), '') is not null
        or nullif(trim((ranked.opportunity_record).preview_image_url), '') is not null then 1
      else 0
    end desc,
    (ranked.opportunity_record).deadline_at asc nulls last,
    (ranked.opportunity_record).title asc
  limit greatest(1, least(coalesce(limit_count, 50), 100))
  offset greatest(coalesce(offset_count, 0), 0);
$function$;

grant execute on function public.search_opportunities_v2(
  text, text[], text[], text[], text, text[], text[], text[],
  timestamptz, timestamptz, numeric, boolean, boolean, boolean, boolean, integer, integer
) to anon, authenticated;

create or replace function public.diagnose_opportunity_search(input_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_kleio_admin() then
    raise exception 'KLEIO administrator access required';
  end if;

  select jsonb_build_object(
    'interpretation', public.interpret_opportunity_search_query(input_query),
    'visible_results', coalesce((
      select jsonb_agg(jsonb_build_object(
        'external_id', r.external_id,
        'title', r.title,
        'opportunity_type', r.opportunity_type,
        'disciplines', r.disciplines,
        'status', r.status,
        'verification_status', r.verification_status
      ))
      from public.search_opportunities_v2(
        input_query, null, null, null, null, null, null, null,
        null, null, null, false, false, false, false, 100, 0
      ) r
    ), '[]'::jsonb),
    'excluded_related_records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'external_id', o.external_id,
        'title', o.title,
        'status', o.status,
        'verification_status', o.verification_status,
        'exclusion_reason', case
          when o.status not in ('open','forecasted','upcoming') then 'inactive_status'
          when o.deadline_at is not null and o.deadline_at < now() then 'deadline_passed'
          when o.duplicate_of is not null then 'duplicate'
          when o.verification_status in ('needs_review','expired','rejected') then 'verification_hold'
          else 'not_ranked_as_relevant'
        end
      ))
      from public.opportunities o
      where exists (
        select 1 from unnest(coalesce(o.disciplines, '{}'::text[])) d
        where public.normalize_opportunity_search_text(d) = any(
          coalesce(array(
            select jsonb_array_elements_text(
              public.interpret_opportunity_search_query(input_query)->'canonical_disciplines'
            )
          ), '{}'::text[])
        )
      )
      and not exists (
        select 1
        from public.search_opportunities_v2(
          input_query, null, null, null, null, null, null, null,
          null, null, null, false, false, false, false, 100, 0
        ) r
        where r.id = o.id
      )
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.diagnose_opportunity_search(text) from public, anon;
grant execute on function public.diagnose_opportunity_search(text) to authenticated;

create or replace function public.record_opportunity_event(
  target_event_name text,
  target_opportunity_id uuid default null::uuid,
  target_search_query text default ''::text,
  target_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id bigint;
  enriched_metadata jsonb;
begin
  if target_event_name not in (
    'search','zero_results','view','save','unsave','external_application_click',
    'internal_application_start','provider_submission','application_prepare'
  ) then
    raise exception 'Unsupported opportunity event';
  end if;

  enriched_metadata := coalesce(target_metadata, '{}'::jsonb);

  if target_event_name in ('search','zero_results') and nullif(trim(target_search_query), '') is not null then
    enriched_metadata := enriched_metadata || jsonb_build_object(
      'search_interpretation', public.interpret_opportunity_search_query(target_search_query)
    );
  end if;

  insert into public.opportunity_events(
    artist_user_id, opportunity_id, event_name, search_query, metadata
  ) values (
    auth.uid(), target_opportunity_id, target_event_name,
    left(coalesce(target_search_query, ''), 200), enriched_metadata
  ) returning id into event_id;

  return event_id;
end;
$$;

revoke all on function public.record_opportunity_event(text, uuid, text, jsonb) from public;
grant execute on function public.record_opportunity_event(text, uuid, text, jsonb) to authenticated;
