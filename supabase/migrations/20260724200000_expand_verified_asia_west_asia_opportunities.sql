begin;

insert into public.opportunity_sources (
  slug, name, base_domain, source_type, ingestion_method, license,
  commercial_reuse_allowed, attribution_required, terms_url,
  update_frequency, active, terms_reviewed_at
)
values
  ('singapore-national-arts-council','Singapore National Arts Council','nac.gov.sg','manual_curation','manual','Official Government of Singapore grant and programme pages. KLEIO stores source-linked factual summaries and requires applicants to confirm the current official guidelines.',null,true,'https://www.nac.gov.sg/terms-of-use','weekly_review',true,now()),
  ('misk-art-institute','Misk Art Institute','miskartinstitute.org','manual_curation','manual','Official Misk Art Institute programme pages. All rights remain with the provider; KLEIO retains attribution and links applicants to the official source.',false,true,'https://miskartinstitute.org/en/terms-and-conditions','weekly_review',true,now()),
  ('arab-fund-arts-culture','Arab Fund for Arts and Culture','arabculturefund.org','manual_curation','manual','Official AFAC programme pages and application forms. KLEIO stores concise source-attributed metadata only and directs applicants to the provider application.',false,true,'https://www.arabculturefund.org/','weekly_review',true,now())
on conflict (slug) do update set
  name=excluded.name, base_domain=excluded.base_domain, source_type=excluded.source_type,
  ingestion_method=excluded.ingestion_method, license=excluded.license,
  commercial_reuse_allowed=excluded.commercial_reuse_allowed,
  attribution_required=excluded.attribution_required, terms_url=excluded.terms_url,
  update_frequency=excluded.update_frequency, active=excluded.active,
  terms_reviewed_at=excluded.terms_reviewed_at, updated_at=now();

with records (
  source_slug, external_id, canonical_url, application_url, guidelines_url,
  title, provider_name, opportunity_type, summary, description,
  disciplines, eligible_applicant_types, eligible_countries, eligible_regions,
  citizenship_requirements, residency_requirements, career_stages,
  age_min, age_max, award_max, currency, deadline_at, deadline_timezone, opens_at,
  remote_allowed, travel_supported, language_requirements, previous_award_restrictions,
  required_materials, participation_format, locations, verification_status,
  funding_display_text, funding_amount_type, funding_source_note, submission_instructions
) as (
  values
  (
    'singapore-national-arts-council','singapore-nac-presentation-participation-2026-08',
    'https://www.nac.gov.sg/support/funding-and-schemes/presentation-and-participation-grant/how-and-when-to-apply',
    'https://oursggrants.gov.sg/',
    'https://www.nac.gov.sg/support/funding-and-schemes/presentation-and-participation-grant/overview',
    'Presentation and Participation Grant — August 2026 cycle','Singapore National Arts Council','grant',
    'Funding for music recording, publishing, exhibitions or performances, and festivals or conferences. The current cycle closes 14 August 2026 at 23:59 Singapore time.',
    'The official NAC programme is open to individuals, organisations, and collectives and supports physical or digital formats. The current general grant cap is S$100,000 per applicant per financial year. Applicants must confirm the precise Singapore eligibility and closure requirements in the current guidelines.',
    array['Visual Arts','Performing Arts','Music','Literary Arts','Publishing','Festivals','Multidisciplinary']::text[],
    array['individual_artist','organization','collective']::text[],array['Singapore']::text[],array['Singapore','Southeast Asia','Asia']::text[],
    array[]::text[],array['Confirm the current Singapore applicant eligibility rules in the official NAC grant guidelines.']::text[],
    array['emerging','mid-career','established']::text[],null::integer,null::integer,100000::numeric,'SGD',
    '2026-08-14 23:59:00+08'::timestamptz,'Asia/Singapore',null::timestamptz,true,null::boolean,array['English']::text[],'',
    array['Application through the OurSG Grants Portal','Current NAC grant guideline requirements','Project and budget information','Supporting materials required by the selected grant category']::text[],
    'hybrid',array['Singapore','Online']::text[],'official_source',
    'Up to S$100,000 per applicant per financial year','conditional_maximum',
    'The cap is stated by NAC; the actual award depends on assessment and eligible project costs.',
    'Submit through the OurSG Grants Portal by 23:59 SGT on 14 August 2026. Late and incomplete applications are not accepted.'
  ),
  (
    'singapore-national-arts-council','singapore-nac-map-productions-2026',
    'https://www.nac.gov.sg/support/funding-and-schemes/multicultural-arts-programme-grant/productions',
    'https://oursggrants.gov.sg/',
    'https://www.nac.gov.sg/support/funding-and-schemes/multicultural-arts-programme-grant/productions',
    'Multicultural Arts Programme Grant — Productions','Singapore National Arts Council','grant',
    'Supports original, adapted, or redeveloped multicultural performing, visual, literary, and multidisciplinary productions. Applications close 15 September 2026 at 23:59 Singapore time.',
    'The programme supports Singapore-led multicultural productions lasting up to 24 months, including collaborations with regional or international partners. For collaborations, the lead applicant must be a Singapore citizen or permanent resident; projects involving foreign collaborators must remain anchored and led by Singaporean artists.',
    array['Visual Arts','Performing Arts','Literary Arts','Multidisciplinary','Cultural Heritage']::text[],
    array['individual_artist','organization','collective']::text[],array['Singapore']::text[],array['Singapore','Southeast Asia','Asia']::text[],
    array['For collaborative proposals, the lead applicant must be a Singapore citizen or permanent resident.']::text[],
    array['Projects involving foreign collaborators must be anchored and led by Singaporean artists.']::text[],
    array['emerging','mid-career','established']::text[],null::integer,null::integer,500000::numeric,'SGD',
    '2026-09-15 23:59:00+08'::timestamptz,'Asia/Singapore','2026-07-15 00:00:00+08'::timestamptz,false,null::boolean,array['English']::text[],'',
    array['CVs of the key artistic team','Relevant samples of past work','Application materials required in the current MAP Grant guidelines','Project plan and realistic budget']::text[],
    'hybrid',array['Singapore']::text[],'official_source',
    'Up to 100% of a realistic budget, capped at S$500,000 per application','conditional_maximum',
    'The cap and percentage are stated by NAC; the actual award depends on assessment and eligible costs.',
    'Submit through the OurSG Grants Portal by 23:59 SGT on 15 September 2026. Late and incomplete applications are not accepted.'
  ),
  (
    'singapore-national-arts-council','singapore-nac-cultural-fellowship-2026',
    'https://www.nac.gov.sg/support/capability-development/nac-cultural-fellowship',
    'https://go.gov.sg/nacculturalfellowship-2026',
    'https://www.nac.gov.sg/support/capability-development/nac-cultural-fellowship',
    'NAC Cultural Fellowship 2026','Singapore National Arts Council','fellowship',
    'A six-month artistic leadership development programme for experienced Singapore practitioners, running October 2026 through March 2027. Applications close 7 August 2026 at 17:00 Singapore time.',
    'The fellowship is designed for artistic directors and associate artists with a substantive body of work and demonstrated local and international presence. It includes coaching, cohort learning, studio conversations, and an optional international learning visit. Performing arts practitioners are especially suited, while multidisciplinary artists may also apply.',
    array['Performing Arts','Multidisciplinary','Artistic Leadership','Professional Development']::text[],
    array['individual_artist']::text[],array['Singapore']::text[],array['Singapore','Southeast Asia','Asia']::text[],
    array['Applicant must be a Singapore citizen or permanent resident.']::text[],
    array['Applicant must be available for the first in-person session on 26 and 27 October 2026.']::text[],
    array['mid-career','established']::text[],null::integer,null::integer,null::numeric,null::text,
    '2026-08-07 17:00:00+08'::timestamptz,'Asia/Singapore',null::timestamptz,false,true,array['English']::text[],'',
    array['Curriculum Vitae covering professional background, milestones, commissioned work, and international engagements','Personal statement of 300 to 500 words addressing the official prompts']::text[],
    'hybrid',array['Singapore','International learning visit']::text[],'official_source',
    'Development programme; no cash award stated on the official call page','not_stated',
    'The official page describes programme participation and an optional learning visit but does not state a cash grant.',
    'Submit the official online form by 17:00 Singapore time on 7 August 2026. Incomplete and late applications are not considered.'
  ),
  (
    'misk-art-institute','misk-art-book-fair-2026',
    'https://miskartinstitute.org/en/exhibitions/art-book-fair-2026',
    'https://miskartinstitute.org/en/exhibitions/art-book-fair-2026',
    'https://miskartinstitute.org/en/exhibitions/art-book-fair-2026',
    'Art Book Fair 2026','Misk Art Institute','open_call',
    'An international open call for publishers, zine makers, artists, designers, illustrators, bookmakers, curators, researchers, and cultural organisations to participate in Misk Art Week in Riyadh. Registration closes 31 August 2026.',
    'The six-day fair focuses on artists books, independent publishing, experimental print production, and contemporary visual culture. Participants must attend in person, manage their own sales, hold publication rights, and maintain sufficient inventory. The provider lists participation fees of SAR 1,500 for publishers and SAR 800 for zines.',
    array['Visual Arts','Artists Books','Publishing','Illustration','Graphic Design','Printmaking','Zines']::text[],
    array['individual_artist','publisher','organization','collective','researcher']::text[],array['Worldwide']::text[],
    array['Global','Saudi Arabia','West Asia','Middle East','Asia']::text[],array[]::text[],
    array['In-person participation in Riyadh is required for the full fair from 5 to 10 December 2026.']::text[],
    array['emerging','mid-career','established']::text[],null::integer,null::integer,null::numeric,null::text,
    '2026-08-31 23:59:00+03'::timestamptz,'Asia/Riyadh — source states the date only; confirm the exact closing time',
    '2026-07-09 00:00:00+03'::timestamptz,false,null::boolean,array['English','Arabic']::text[],
    'Participation fees apply: SAR 1,500 for publishers and SAR 800 for zines.',
    array['Sufficient inventory for the six-day fair','Publishers: at least three to four titles','Zine makers: at least 100 copies per zine title','Artists: at least one book with 100 copies','Clear editorial approach and relevance to contemporary visual culture','Applicants must hold rights to sell and distribute the submitted publications']::text[],
    'in_person',array['Riyadh','Saudi Arabia']::text[],'source_attributed',
    'No grant stated; provider participation fees apply','not_stated',
    'The official page presents participation and sales visibility rather than a funding award.',
    'Apply through the official Misk Art Institute page. The source states a 31 August 2026 deadline but does not publish a closing time; confirm it directly before submission.'
  ),
  (
    'arab-fund-arts-culture','afac-women-in-film-iii-2026',
    'https://www.arabculturefund.org/Programs/78','https://www.arabculturefund.org/Programs/78','https://www.arabculturefund.org/Programs/78',
    'Women in Film III: Training Through Practice','Arab Fund for Arts and Culture / Netflix','professional_development',
    'Training and mentorship for early-career Arab women filmmakers residing in Egypt, Jordan, Kuwait, Saudi Arabia, or the United Arab Emirates. The call closes 29 July 2026.',
    'The programme has two tracks: short-film project teams made up of a writer-director and producer, and individual technical applicants in cinematography, editing, or sound design. It combines weekly online sessions with a five-day in-person workshop or residency in the UAE or Saudi Arabia.',
    array['Film','Screenwriting','Producing','Cinematography','Editing','Sound Design']::text[],
    array['individual_artist','project_team']::text[],array['Egypt','Jordan','Kuwait','Saudi Arabia','United Arab Emirates']::text[],
    array['North Africa','West Asia','Middle East','Africa','Asia']::text[],array['Applicant must be an Arab woman.']::text[],
    array['Applicant must reside in Egypt, Jordan, Kuwait, Saudi Arabia, or the United Arab Emirates.']::text[],
    array['early-career']::text[],23,30,null::numeric,null::text,
    '2026-07-29 23:59:00+03'::timestamptz,'Provider local time — source states the date only; confirm the exact closing time',
    '2026-05-18 00:00:00+03'::timestamptz,true,null::boolean,array['English','Arabic']::text[],
    'Applicants may not have a current open AFAC grant and may not have prior full-length feature-film or television-series credits in the listed roles.',
    array['Project teams: story treatment and draft script for a short fiction narrative film','Individual cinematographers, editors, and sound designers: previous project samples','All supporting materials requested by the selected official application form']::text[],
    'hybrid',array['Online','United Arab Emirates','Saudi Arabia']::text[],'source_attributed',
    'Training, mentorship, and residency participation; no cash award stated','not_stated',
    'The official programme page describes training and capacity-building rather than a cash grant.',
    'Choose either the project-team application or the individual technical-track application on the official AFAC page. The provider states a 29 July 2026 deadline but does not publish a closing time on the programme page; confirm it before submission.'
  )
), upserted as (
  insert into public.opportunities (
    source_id, external_id, canonical_url, application_url, guidelines_url,
    title, provider_name, opportunity_type, summary, description,
    disciplines, eligible_applicant_types, eligible_countries, eligible_regions,
    citizenship_requirements, residency_requirements, career_stages,
    age_min, age_max, award_max, currency, deadline_at, deadline_timezone, opens_at,
    recurring, remote_allowed, travel_supported, accommodation_supported,
    language_requirements, previous_award_restrictions, required_materials,
    participation_format, locations, application_mode, status, verification_status,
    last_verified_at, funding_display_text, funding_amount_type, funding_source_url,
    funding_source_note, funding_verified_at, submission_method, submission_instructions, source_language
  )
  select source_row.id, records.external_id, records.canonical_url, records.application_url, records.guidelines_url,
    records.title, records.provider_name, records.opportunity_type, records.summary, records.description,
    records.disciplines, records.eligible_applicant_types, records.eligible_countries, records.eligible_regions,
    records.citizenship_requirements, records.residency_requirements, records.career_stages,
    records.age_min, records.age_max, records.award_max, records.currency, records.deadline_at, records.deadline_timezone,
    records.opens_at, false, records.remote_allowed, records.travel_supported, null::boolean,
    records.language_requirements, records.previous_award_restrictions, records.required_materials,
    records.participation_format, records.locations, 'external', 'open', records.verification_status,
    now(), records.funding_display_text, records.funding_amount_type, records.canonical_url,
    records.funding_source_note, now(), 'external_portal', records.submission_instructions, 'en'
  from records join public.opportunity_sources source_row on source_row.slug=records.source_slug
  on conflict (source_id,external_id) do update set
    canonical_url=excluded.canonical_url, application_url=excluded.application_url, guidelines_url=excluded.guidelines_url,
    title=excluded.title, provider_name=excluded.provider_name, opportunity_type=excluded.opportunity_type,
    summary=excluded.summary, description=excluded.description, disciplines=excluded.disciplines,
    eligible_applicant_types=excluded.eligible_applicant_types, eligible_countries=excluded.eligible_countries,
    eligible_regions=excluded.eligible_regions, citizenship_requirements=excluded.citizenship_requirements,
    residency_requirements=excluded.residency_requirements, career_stages=excluded.career_stages,
    age_min=excluded.age_min, age_max=excluded.age_max, award_max=excluded.award_max, currency=excluded.currency,
    deadline_at=excluded.deadline_at, deadline_timezone=excluded.deadline_timezone, opens_at=excluded.opens_at,
    remote_allowed=excluded.remote_allowed, travel_supported=excluded.travel_supported,
    language_requirements=excluded.language_requirements, previous_award_restrictions=excluded.previous_award_restrictions,
    required_materials=excluded.required_materials, participation_format=excluded.participation_format,
    locations=excluded.locations, application_mode=excluded.application_mode, status=excluded.status,
    verification_status=excluded.verification_status, last_verified_at=excluded.last_verified_at,
    funding_display_text=excluded.funding_display_text, funding_amount_type=excluded.funding_amount_type,
    funding_source_url=excluded.funding_source_url, funding_source_note=excluded.funding_source_note,
    funding_verified_at=excluded.funding_verified_at, submission_method=excluded.submission_method,
    submission_instructions=excluded.submission_instructions, source_language=excluded.source_language, updated_at=now()
  returning id, source_id, external_id, canonical_url, application_url, guidelines_url, deadline_at, source_language
)
select count(*) from upserted;

delete from public.opportunity_eligibility_rules rule_row
using public.opportunities opportunity_row
where rule_row.opportunity_id=opportunity_row.id
and opportunity_row.external_id in (
  'singapore-nac-presentation-participation-2026-08','singapore-nac-map-productions-2026',
  'singapore-nac-cultural-fellowship-2026','misk-art-book-fair-2026','afac-women-in-film-iii-2026'
);

insert into public.opportunity_eligibility_rules (
  opportunity_id, rule_type, operator, value, requirement_level,
  source_text, source_url, source_field, extraction_method,
  verification_status, last_verified_at, sort_order
)
select opportunity_row.id, rule_data.rule_type, rule_data.operator, rule_data.value,
  rule_data.requirement_level, rule_data.source_text, opportunity_row.canonical_url,
  rule_data.source_field, 'manual_review', rule_data.verification_status, now(), rule_data.sort_order
from public.opportunities opportunity_row
join (values
  ('singapore-nac-presentation-participation-2026-08','applicant_type','in','["individual_artist","organization","collective"]'::jsonb,'required','The official programme overview states that individuals, organisations, and collectives may apply.','official_programme_overview','confirmed',1),
  ('singapore-nac-presentation-participation-2026-08','country_of_residence','in','["Singapore"]'::jsonb,'informational','The programme supports arts practice and participation in Singapore; the precise applicant eligibility must be confirmed in the current grant guidelines.','current_grant_guidelines','ambiguous',2),
  ('singapore-nac-map-productions-2026','citizenship','in','["Singapore citizen","Singapore permanent resident"]'::jsonb,'required','For collaborations, the lead applicant must be a Singapore citizen or permanent resident.','official_collaboration_eligibility','confirmed',1),
  ('singapore-nac-map-productions-2026','country_of_residence','in','["Singapore"]'::jsonb,'required','Collaborative projects must be anchored and led by Singaporean artists.','official_collaboration_eligibility','confirmed',2),
  ('singapore-nac-cultural-fellowship-2026','citizenship','in','["Singapore citizen","Singapore permanent resident"]'::jsonb,'required','The official call is applicable to Singapore citizens or permanent residents.','who_is_this_for','confirmed',1),
  ('singapore-nac-cultural-fellowship-2026','career_stage','in','["mid-career","established"]'::jsonb,'required','Applicants need a substantive professional body of work and demonstrated local and international presence.','who_is_this_for','confirmed',2),
  ('misk-art-book-fair-2026','applicant_type','in','["individual_artist","publisher","organization","collective","researcher"]'::jsonb,'required','The call names publishers, zine makers, artists, designers, illustrators, printers, bookmakers, curators, researchers, and cultural organisations or institutions.','who_is_it_for','confirmed',1),
  ('misk-art-book-fair-2026','participation_format','equals','"in_person"'::jsonb,'required','In-person participation is required for the full six-day fair.','participation_requirements','confirmed',2),
  ('afac-women-in-film-iii-2026','country_of_residence','in','["Egypt","Jordan","Kuwait","Saudi Arabia","United Arab Emirates"]'::jsonb,'required','The call is limited to Arab women residents of the five named countries.','who_can_apply','confirmed',1),
  ('afac-women-in-film-iii-2026','age','greater_than_or_equal','23'::jsonb,'required','Applicants must be at least 23 years old.','who_can_apply','confirmed',2),
  ('afac-women-in-film-iii-2026','age','less_than_or_equal','30'::jsonb,'required','Applicants must be no older than 30.','who_can_apply','confirmed',3),
  ('afac-women-in-film-iii-2026','career_stage','equals','"early-career"'::jsonb,'required','Directors and technical applicants may have worked on no more than one short film outside their studies and may not have full-length feature or TV-series credits in the listed roles.','who_can_apply','confirmed',4)
) as rule_data(external_id,rule_type,operator,value,requirement_level,source_text,source_field,verification_status,sort_order)
on rule_data.external_id=opportunity_row.external_id;

update public.opportunity_source_snapshots snapshot_row set is_current=false
from public.opportunities opportunity_row
where snapshot_row.opportunity_id=opportunity_row.id and snapshot_row.is_current
and opportunity_row.external_id in (
  'singapore-nac-presentation-participation-2026-08','singapore-nac-map-productions-2026',
  'singapore-nac-cultural-fellowship-2026','misk-art-book-fair-2026','afac-women-in-film-iii-2026'
);

insert into public.opportunity_source_snapshots (opportunity_id,source_id,fetched_at,raw_data,checksum,is_current)
select opportunity_row.id, opportunity_row.source_id, now(),
  jsonb_build_object(
    'source_url',opportunity_row.canonical_url,'application_url',opportunity_row.application_url,
    'guidelines_url',opportunity_row.guidelines_url,'review_method','manual_official_source_review',
    'verified_at',now(),
    'deadline_time_note',case when opportunity_row.external_id in ('misk-art-book-fair-2026','afac-women-in-film-iii-2026')
      then 'The source states a deadline date without a closing time. KLEIO normalizes the date to 23:59 provider-local time for sorting and tells artists to confirm the exact time.'
      else 'The source states the closing time explicitly.' end,
    'language',opportunity_row.source_language
  ),
  encode(digest(opportunity_row.external_id||'|'||opportunity_row.canonical_url||'|'||coalesce(opportunity_row.deadline_at::text,''),'sha256'),'hex'),true
from public.opportunities opportunity_row
where opportunity_row.external_id in (
  'singapore-nac-presentation-participation-2026-08','singapore-nac-map-productions-2026',
  'singapore-nac-cultural-fellowship-2026','misk-art-book-fair-2026','afac-women-in-film-iii-2026'
);

commit;
