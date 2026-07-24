alter table public.opportunities
  add column if not exists original_title text not null default '',
  add column if not exists accepted_application_languages text[] not null default '{}'::text[],
  add column if not exists application_fee_currency text,
  add column if not exists eligibility_scope text not null default 'unspecified',
  add column if not exists visa_supported boolean,
  add column if not exists insurance_supported boolean,
  add column if not exists production_supported boolean,
  add column if not exists living_stipend_text text not null default '',
  add column if not exists translation_status text not null default 'source_language',
  add column if not exists human_translation_review_required boolean not null default false,
  add column if not exists institutional_verification_level text not null default 'official_source',
  add column if not exists financial_terms_verified boolean not null default false,
  add column if not exists rights_terms_verified boolean not null default false,
  add column if not exists logistics_notes text not null default '',
  add column if not exists translation_notes text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'opportunities_eligibility_scope_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_eligibility_scope_check
      check (eligibility_scope = any (array[
        'unspecified','worldwide','regional','country_specific',
        'residency_based','citizenship_based','diaspora','partnership_based'
      ]::text[]));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'opportunities_translation_status_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_translation_status_check
      check (translation_status = any (array[
        'source_language','reviewed_translation',
        'machine_translation_review_required','translation_required'
      ]::text[]));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'opportunities_institutional_verification_level_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_institutional_verification_level_check
      check (institutional_verification_level = any (array[
        'official_source','official_source_plus_terms',
        'secondary_source_only','due_diligence_required'
      ]::text[]));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'opportunities_application_fee_currency_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_application_fee_currency_check
      check (
        application_fee_currency is null
        or application_fee_currency ~ '^[A-Z]{3}$'
      );
  end if;
end
$$;

create index if not exists opportunities_accepted_application_languages_idx
  on public.opportunities using gin (accepted_application_languages);

create or replace function public.refresh_opportunity_search_document()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.search_document :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.original_title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.provider_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.disciplines, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.locations, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_regions, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_countries, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_applicant_types, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.citizenship_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.residency_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.language_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.accepted_application_languages, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.source_language, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.eligibility_scope, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.logistics_notes, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.translation_notes, '')), 'C');
  return new;
end;
$function$;

drop trigger if exists opportunities_search_document on public.opportunities;
create trigger opportunities_search_document
before insert or update of
  title,
  original_title,
  provider_name,
  summary,
  description,
  disciplines,
  locations,
  eligible_applicant_types,
  eligible_countries,
  eligible_regions,
  citizenship_requirements,
  residency_requirements,
  language_requirements,
  accepted_application_languages,
  source_language,
  eligibility_scope,
  logistics_notes,
  translation_notes
on public.opportunities
for each row execute function public.refresh_opportunity_search_document();

update public.opportunities
set
  original_title = case when original_title = '' then title else original_title end,
  search_document =
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(nullif(original_title, ''), title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(provider_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(disciplines, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(locations, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(eligible_regions, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(eligible_countries, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(eligible_applicant_types, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(citizenship_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(residency_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(language_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(accepted_application_languages, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(source_language, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(eligibility_scope, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(logistics_notes, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(translation_notes, '')), 'C');
