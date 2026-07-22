begin;

create or replace function public.enforce_official_opportunity_trust()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_slug text;
  relevance_text text;
begin
  select source_row.slug into source_slug
  from public.opportunity_sources source_row
  where source_row.id = new.source_id;

  if source_slug = 'grants-gov' then
    relevance_text := lower(concat_ws(' ', new.title, new.provider_name, new.summary, new.description));
    if relevance_text !~ '(art|artist|cultur|creative|heritage|museum|film|media|audiovisual|design|architect|music|dance|theat|photograph|exhibition|craft)' then
      new.status := 'archived';
      new.verification_status := 'needs_review';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_official_trust_guard on public.opportunities;
create trigger opportunities_official_trust_guard
before insert or update of source_id, title, provider_name, summary, description, status, verification_status
on public.opportunities
for each row execute function public.enforce_official_opportunity_trust();

create or replace function public.enforce_official_rule_ambiguity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_slug text;
  cleaned_values jsonb;
begin
  select source_row.slug into source_slug
  from public.opportunities opportunity_row
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.id = new.opportunity_id;

  if source_slug = 'grants-gov'
     and new.extraction_method = 'official_api_field'
     and new.source_text ilike '%Others (see text field entitled%'
  then
    select coalesce(jsonb_agg(value_text), '[]'::jsonb)
    into cleaned_values
    from jsonb_array_elements_text(new.value) value_text
    where value_text not like 'others_%';
    new.value := cleaned_values;
    new.verification_status := 'ambiguous';
  end if;
  return new;
end;
$$;

drop trigger if exists opportunity_rules_official_ambiguity_guard on public.opportunity_eligibility_rules;
create trigger opportunity_rules_official_ambiguity_guard
before insert or update of opportunity_id, extraction_method, source_text, value, verification_status
on public.opportunity_eligibility_rules
for each row execute function public.enforce_official_rule_ambiguity();

update public.opportunities opportunity_row
set title = opportunity_row.title
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id and source_row.slug = 'grants-gov';

update public.opportunity_eligibility_rules rule_row
set source_text = rule_row.source_text
from public.opportunities opportunity_row
join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
where opportunity_row.id = rule_row.opportunity_id
  and source_row.slug = 'grants-gov'
  and rule_row.extraction_method = 'official_api_field';

commit;
