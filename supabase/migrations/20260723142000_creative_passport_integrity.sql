begin;

alter table public.artist_profiles
  add column if not exists profile_image_path text not null default '',
  add column if not exists profile_image_position_x smallint not null default 50,
  add column if not exists profile_image_position_y smallint not null default 50;

alter table public.artist_profiles
  drop constraint if exists artist_profiles_profile_image_position_x_check,
  drop constraint if exists artist_profiles_profile_image_position_y_check;

alter table public.artist_profiles
  add constraint artist_profiles_profile_image_position_x_check check (profile_image_position_x between 0 and 100),
  add constraint artist_profiles_profile_image_position_y_check check (profile_image_position_y between 0 and 100);

alter table public.opportunities
  add column if not exists source_language text not null default 'en';

alter table public.opportunities
  drop constraint if exists opportunities_source_language_check;

alter table public.opportunities
  add constraint opportunities_source_language_check check (source_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

update public.opportunities
set source_language = 'es'
where id in (
  '903c5c86-625e-43d3-9ecf-2a2fb35ec114',
  '7eaa300d-7fb7-49a7-a736-2ef469267649',
  '4633958e-c580-43b8-a76b-1f2c70afa246',
  'ca116472-7c2a-411f-a895-3416c2a57154',
  'c78af6bc-ac13-416d-aa2b-0fe97d277e8b',
  'c23b2805-8436-4f09-8618-48f4f7257445',
  '949e8926-a3be-44e4-9ce7-96066001bd82',
  '50b7c25c-18c7-45bf-ac48-8e8bd988723f',
  '238baf80-e1f8-4449-b2e0-0d7ba6ecbf70',
  'f06985b7-5029-47a8-b966-1e34bcc84c61',
  '799f0037-24b2-459e-b41e-1744bb3ea0a9',
  'edaa1631-7393-4bbc-a658-4604dbcfe45a',
  'f712f6d9-4429-42c5-be5c-53ac2287ec31',
  '6399747b-739b-4fd4-8497-e71ab1a27009',
  '9fc2ed6f-2585-477c-9d04-d618c878a71b',
  'c782d8cd-5e1c-4a67-924e-2de49bb6a9a1',
  '9bddc8ea-7429-4f30-95ac-de5906bac24a',
  'b0ca80cb-6981-48d7-b0f0-df46e3ee55e5',
  'b8fdc26f-7cee-44df-a8d9-05c34c9ce737',
  '648aafe0-3e14-4783-b3a2-fc2aa2425589'
);

create table if not exists public.opportunity_translations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  locale text not null,
  source_language text not null,
  title text not null default '',
  summary text not null default '',
  description text not null default '',
  required_materials text[] not null default '{}',
  requirement_translations jsonb not null default '{}'::jsonb,
  source_content_hash text not null,
  translation_method text not null default 'human_reviewed_seed',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, locale),
  constraint opportunity_translations_locale_check check (locale in ('en', 'es')),
  constraint opportunity_translations_language_check check (source_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint opportunity_translations_method_check check (translation_method in ('human_reviewed_seed', 'human_reviewed', 'machine_review_required'))
);

create index if not exists opportunity_translations_opportunity_locale_idx
  on public.opportunity_translations (opportunity_id, locale);

alter table public.opportunity_translations enable row level security;

drop policy if exists "opportunity_translations_anon_read" on public.opportunity_translations;
create policy "opportunity_translations_anon_read"
on public.opportunity_translations
for select
to anon
using (
  exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_translations.opportunity_id
      and opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
  )
);

drop policy if exists "opportunity_translations_authenticated_read" on public.opportunity_translations;
create policy "opportunity_translations_authenticated_read"
on public.opportunity_translations
for select
to authenticated
using (
  public.is_kleio_admin()
  or exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_translations.opportunity_id
      and opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
  )
);

drop policy if exists "opportunity_translations_admin_manage" on public.opportunity_translations;
create policy "opportunity_translations_admin_manage"
on public.opportunity_translations
for all
to authenticated
using (public.is_kleio_admin())
with check (public.is_kleio_admin());

grant select on public.opportunity_translations to anon, authenticated;
grant insert, update, delete on public.opportunity_translations to authenticated;

-- The private artist-assets bucket remains private. Owners can remove their own files.
drop policy if exists "artist_assets_delete_own" on storage.objects;
create policy "artist_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artist-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Signed-in institution users may read only the exact profile-image object referenced by an artist profile.
-- CVs, portfolio originals, and unrelated artist files remain owner-only.
drop policy if exists "artist_profile_images_authenticated_read" on storage.objects;
create policy "artist_profile_images_authenticated_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'artist-assets'
  and exists (
    select 1 from public.artist_profiles artist_profile
    where artist_profile.profile_image_path = storage.objects.name
      and artist_profile.profile_image_path <> ''
  )
);

with translations(opportunity_id, locale, title, summary, description) as (
  values
  ('903c5c86-625e-43d3-9ecf-2a2fb35ec114'::uuid, 'en', 'Feature Film Screenwriting Grants — 2026', 'Grants supporting the development of high-quality screenplays and encouraging feature-film writers. The official call closed July 23, 2026 at 14:00 Spanish peninsular time.', 'The call supports the development of screenplays for feature films. The official page contains the rules, documentation, forms, and access to the government electronic office.'),
  ('7eaa300d-7fb7-49a7-a736-2ef469267649'::uuid, 'en', 'Special Ibermúsicas – Arts Council England Call 2026', 'Support for Ibero-American artists and music projects participating in a performance and exchange circuit in England during 2027.', 'The initiative is organized with LatinoLife and Luma Creations and includes events in London and Liverpool. The call closes July 31, 2026 at 23:59 in the applicant’s country.'),
  ('4633958e-c580-43b8-a76b-1f2c70afa246'::uuid, 'en', 'Carlos Fuentes International Prize for Literary Creation in Spanish 2026', 'An international prize recognizing a literary career in the Spanish language. Nominations must be submitted by eligible institutions by August 14, 2026.', 'This is not an individual self-nomination. Ministries, academies, and educational or cultural institutions connected to Spanish-language literature may submit nominations under the official rules.'),
  ('ca116472-7c2a-411f-a895-3416c2a57154'::uuid, 'en', '51st National Grand Prize for Popular Art 2026', 'A national competition for adult Mexican artisans. General work intake closes August 14, 2026; courier or postal submissions must arrive by August 7. The official source states a total prize pool of MXN 2,775,000, not a guaranteed award per participant.', 'For artisans in Mexico who create works using traditional techniques, knowledge, materials, and cultural expressions. Review the official rules for categories, work delivery, and documentary requirements.'),
  ('c78af6bc-ac13-416d-aa2b-0fe97d277e8b'::uuid, 'en', '13th National Competition for Great Masters of Mexico’s Craft Heritage 2026', 'A national competition recognizing masterworks of Mexican craft heritage. The official source states a total prize pool of MXN 1,588,000; it is not presented as a guaranteed award per participant. The call closes August 14, 2026.', 'The call is intended for Mexican artisans with specified previous awards. Works must be recent and must not have participated in other competitions; confirm eligible categories and prior distinctions in the official rules.'),
  ('c23b2805-8436-4f09-8618-48f4f7257445'::uuid, 'en', 'General Feature Film Production Grants — Second 2026 Procedure', 'A competitive call financing feature-film projects. The second procedure remains open until September 15, 2026 at 14:00 Spanish peninsular time. Maximum support varies by project type and official conditions; KLEIO does not present a single universal amount.', 'The official call reserves funding for feature-film projects and establishes requirements for production companies, co-productions, Spanish nationality of the project, spending in Spain, accessibility, and sustainability.'),
  ('949e8926-a3be-44e4-9ce7-96066001bd82'::uuid, 'en', '30th National Mexican Nativity Scenes Competition 2026', 'A national competition for artisans creating traditional Mexican nativity scenes. The official source states a total prize pool of MXN 1,075,000; it is not a guaranteed award per participant. The call closes September 25, 2026.', 'The competition recognizes technical mastery, traditional knowledge and materials, cultural and aesthetic contribution, and biocultural heritage preservation. Consult the rules for categories, delivery, and conditions.'),
  ('50b7c25c-18c7-45bf-ac48-8e8bd988723f'::uuid, 'en', 'Artistic and Technical Specialization and Advanced Training Support — Ibermúsicas 2026', 'Support for advanced study, specialization, and professional development in artistic, technical, and music-industry fields.', 'The program may take place at an institution or through individual study with teachers and mentors. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('238baf80-e1f8-4449-b2e0-0d7ba6ecbf70'::uuid, 'en', 'Virtual Projects Support — Ibermúsicas 2026', 'Support for albums, music videos, broadcasts, collaborations, workshops, podcasts, and other music projects delivered through virtual platforms.', 'The call is for music projects that use virtual tools as their primary platform. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('f06985b7-5029-47a8-b966-1e34bcc84c61'::uuid, 'en', 'Ibero-American Repertoire Promotion Support — Ibermúsicas 2026', 'Support for high-quality recordings of works included in the Ibero-American Sheet Music Catalogue.', 'For orchestras, choirs, ensembles, and other groups interested in performing and sharing Ibero-American repertoire. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('799f0037-24b2-459e-b41e-1744bb3ea0a9'::uuid, 'en', 'Special Ibermúsicas – Mid Atlantic Arts Call 2026', 'Support for the circulation of Ibero-American artists in the United States, with particular attention to work-visa costs and processes.', 'Mid Atlantic Arts also supports nonprofit host organizations with contracting, production, and promotion. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('edaa1631-7393-4bbc-a658-4604dbcfe45a'::uuid, 'en', 'Special Ibermúsicas – Emilia-Romagna Call 2026', 'Support for binational collaborative music projects between Ibero-America and Emilia-Romagna that strengthen creation, concerts, and artistic exchange.', 'The proposal requires collaboration among participating producers, institutions, or artists. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('f712f6d9-4429-42c5-be5c-53ac2287ec31'::uuid, 'en', 'Ibermúsicas Song Creation Prize 2026', 'A prize supporting new songs and strengthening the Ibero-American music repertoire.', 'Participation, work format, authorship, and participating countries must be confirmed in the official rules. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('6399747b-739b-4fd4-8497-e71ab1a27009'::uuid, 'en', 'Music Professionals Mobility Support — Ibermúsicas 2026', 'Support for international performance circulation and exchanges in creation, composition, research, and musical knowledge, with emphasis on travel costs. Support may reach 10,000 in USD or EUR depending on the participating country; confirm the applicable currency and maximum.', 'For music professionals from countries participating in the call. Country participation must be confirmed in the official rules. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('9fc2ed6f-2585-477c-9d04-d618c878a71b'::uuid, 'en', 'Ibermúsicas Prize for Composition of a Symphonic Orchestra Work 2026', 'A prize for new symphonic works that expand the contemporary Ibero-American repertoire.', 'Winning works receive a financial prize and are promoted for premieres with orchestras in participating countries. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('c782d8cd-5e1c-4a67-924e-2de49bb6a9a1'::uuid, 'en', 'Ibermúsicas Children’s Song Creation Prize 2026', 'A prize for songs created by a duo, focused on childhood, ecology, and care for the environment.', 'The call invites exploration of languages from Ibero-American countries and Indigenous languages. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('9bddc8ea-7429-4f30-95ac-de5906bac24a'::uuid, 'en', 'Music Programming Support — Ibermúsicas 2026', 'Support for festivals, fairs, markets, venues, schools, orchestras, choirs, and other spaces inviting music professionals from other countries.', 'This line supports international mobility costs connected to music programming. It closes October 1, 2026 at 23:59 in the applicant’s country; confirm participating countries and requirements in the rules.'),
  ('b0ca80cb-6981-48d7-b0f0-df46e3ee55e5'::uuid, 'en', 'Residency Support for Artists and Researchers — Ibermúsicas 2026', 'Support for artists, composers, groups, and researchers undertaking creative or research work with a host institution or ensemble.', 'Residencies must last at least three weeks and may take place anywhere in the world. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('b8fdc26f-7cee-44df-a8d9-05c34c9ce737'::uuid, 'en', 'Residency Support for Institutions — Ibermúsicas 2026', 'Support for public or private institutions, organizations, and ensembles inviting music professionals to undertake a creative or research residency.', 'The residency must last at least three weeks. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('648aafe0-3e14-4783-b3a2-fc2aa2425589'::uuid, 'en', 'Support for Spanish Films Participating in Festivals — 2026', 'Support for Spanish films participating in festivals. The official call remains open until October 10, 2026.', 'The official page contains the call, documentation, and decisions by period. Applicants should confirm the applicable festival period and beneficiary requirements in the official guidelines.')
)
insert into public.opportunity_translations (
  opportunity_id, locale, source_language, title, summary, description, required_materials,
  requirement_translations, source_content_hash, translation_method, verified_at, updated_at
)
select opportunity_row.id, translation.locale, opportunity_row.source_language, translation.title, translation.summary, translation.description,
  opportunity_row.required_materials, '{}'::jsonb,
  md5(concat_ws(E'\n', opportunity_row.title, opportunity_row.summary, opportunity_row.description, array_to_string(opportunity_row.required_materials, E'\n'))),
  'human_reviewed_seed', now(), now()
from translations translation
join public.opportunities opportunity_row on opportunity_row.id = translation.opportunity_id
on conflict (opportunity_id, locale) do update set
  source_language = excluded.source_language,
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  required_materials = excluded.required_materials,
  source_content_hash = excluded.source_content_hash,
  translation_method = excluded.translation_method,
  verified_at = excluded.verified_at,
  updated_at = excluded.updated_at;

-- Spanish interface summaries for current English-language opportunities. Full descriptions intentionally
-- remain source-language text unless a reviewed translation is present.
with translations(opportunity_id, locale, title, summary) as (
  values
  ('2e931b35-5083-4418-8504-4de09d0e78c8'::uuid, 'es', 'Laboratorio y residencia de industrias creativas cinematográficas — American Film Showcase 2026', 'Programa de diplomacia pública de cinco días vinculado a American Film Showcase 2026 y al mercado del Festival de Cine Asiático Jogja-NETPAC. Confirma los tipos de solicitantes y requisitos en la fuente oficial.'),
  ('043cc9f4-1a7b-42e2-9263-96aee2b7a62b'::uuid, 'es', 'Programa de Premios de las Becas Nacionales de Patrimonio de la NEA, año fiscal 2027', 'La NEA seleccionará una organización colaboradora para apoyar el programa de Premios de las Becas Nacionales de Patrimonio 2027. La elegibilidad y el alcance completo deben confirmarse en la convocatoria oficial.'),
  ('6a5cb56a-05a4-4294-875a-989162e446de'::uuid, 'es', 'Reel American: El camino hacia los anillos olímpicos', 'Competencia abierta de la Embajada de Estados Unidos en Ammán para implementar un programa cinematográfico de diplomacia pública de 21 meses antes de los Juegos Olímpicos y Paralímpicos de Los Ángeles 2028.'),
  ('31101408-2181-4890-b97c-20a26ea0326c'::uuid, 'es', 'Programa Internacional de Indemnización de Artes y Artefactos de la NEA 1, año fiscal 2027', 'Programa de la National Endowment for the Arts. La elegibilidad, los montos y el plazo deben confirmarse en las instrucciones oficiales de arts.gov.'),
  ('1d3c5206-a253-4ebf-94f9-eeb910675fa5'::uuid, 'es', 'Subvenciones de acuerdos de colaboración, año fiscal 2027', 'Subvenciones de la NEA para agencias estatales y jurisdiccionales de las artes y organizaciones artísticas regionales elegibles.'),
  ('ebc142a5-3132-48de-9d47-f9c5f78ce7bd'::uuid, 'es', 'Programa Nacional de Indemnización de Artes y Artefactos de la NEA 1, año fiscal 2027', 'Programa de la National Endowment for the Arts. La elegibilidad, los montos y el plazo deben confirmarse en las instrucciones oficiales.'),
  ('1470893f-5956-4d05-8ddc-e27f2a15c673'::uuid, 'es', 'Programa Internacional de Indemnización de Artes y Artefactos de la NEA 2, año fiscal 2027', 'Programa de la National Endowment for the Arts con plazo declarado del 8 de marzo de 2027. Confirma todos los requisitos en la fuente oficial.'),
  ('c75adf87-700d-425b-8e59-be926cd0f764'::uuid, 'es', 'Programa Nacional de Indemnización de Artes y Artefactos de la NEA 2, año fiscal 2027', 'Programa de la National Endowment for the Arts con plazo declarado del 7 de junio de 2027. Confirma todos los requisitos en la fuente oficial.'),
  ('0a396dba-c536-44cd-9887-fc5ef71649d8'::uuid, 'es', 'Declaración anual del programa para la representación de Estados Unidos en bienales internacionales de arte', 'Convocatoria de la Oficina de Asuntos Educativos y Culturales para organizaciones sin fines de lucro. La fuente oficial utiliza un plazo continuo o provisional; confirma las fechas antes de solicitar.'),
  ('88c6f28e-dbf5-49bf-893a-c2d47f655f95'::uuid, 'es', 'Concurso de pequeñas subvenciones AFCP 2020', 'Registro histórico de una convocatoria del Fondo de Embajadores para la Preservación Cultural. El contenido fuente menciona fechas de 2019–2020; confirma que no se trate de una convocatoria vigente antes de actuar.'),
  ('63fa0c7c-3fd1-46dc-8966-690f31f89dad'::uuid, 'es', 'Concurso de pequeñas subvenciones AFCP 2020', 'Registro histórico del Fondo de Embajadores para la Preservación Cultural, con solicitudes electrónicas. La fuente contiene un plazo de 2019; confirma la vigencia antes de actuar.'),
  ('787b2bed-75b5-4969-9977-303cc6db4851'::uuid, 'es', 'Declaración anual de programas de la Sección de Diplomacia Pública de la Embajada de Estados Unidos en El Cairo', 'Invitación a propuestas que fortalezcan los vínculos culturales y el entendimiento mutuo entre Estados Unidos y Egipto mediante programación cultural, económica, educativa y profesional.'),
  ('153f9130-884e-4957-a500-120f32abd832'::uuid, 'es', 'Declaración anual del programa para la representación de Estados Unidos en bienales internacionales de arquitectura', 'Convocatoria de la Oficina de Asuntos Educativos y Culturales para organizaciones sin fines de lucro. La fuente oficial utiliza un plazo continuo o provisional; confirma las fechas antes de solicitar.')
)
insert into public.opportunity_translations (
  opportunity_id, locale, source_language, title, summary, description, required_materials,
  requirement_translations, source_content_hash, translation_method, verified_at, updated_at
)
select opportunity_row.id, translation.locale, opportunity_row.source_language, translation.title, translation.summary, '',
  opportunity_row.required_materials, '{}'::jsonb,
  md5(concat_ws(E'\n', opportunity_row.title, opportunity_row.summary, opportunity_row.description, array_to_string(opportunity_row.required_materials, E'\n'))),
  'human_reviewed_seed', now(), now()
from translations translation
join public.opportunities opportunity_row on opportunity_row.id = translation.opportunity_id
on conflict (opportunity_id, locale) do update set
  source_language = excluded.source_language,
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  required_materials = excluded.required_materials,
  source_content_hash = excluded.source_content_hash,
  translation_method = excluded.translation_method,
  verified_at = excluded.verified_at,
  updated_at = excluded.updated_at;

commit;
