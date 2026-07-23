begin;

with translations(external_id, title, summary, description) as (
  values
  ('spain-icaa-screenwriting-2026', 'Feature Film Screenwriting Grants — 2026', 'Grants supporting the development of high-quality screenplays and encouraging feature-film writers. The official call closed July 23, 2026 at 14:00 Spanish peninsular time.', 'The call supports the development of screenplays for feature films. The official page contains the rules, documentation, forms, and access to the government electronic office.'),
  ('ibermusicas-2026-arts-council-england', 'Special Ibermúsicas – Arts Council England Call 2026', 'Support for Ibero-American artists and music projects participating in a performance and exchange circuit in England during 2027.', 'The initiative is organized with LatinoLife and Luma Creations and includes events in London and Liverpool. The call closes July 31, 2026 at 23:59 in the applicant’s country.'),
  ('mexico-carlos-fuentes-2026', 'Carlos Fuentes International Prize for Literary Creation in Spanish 2026', 'An international prize recognizing a literary career in the Spanish language. Nominations must be submitted by eligible institutions by August 14, 2026.', 'This is not an individual self-nomination. Ministries, academies, and educational or cultural institutions connected to Spanish-language literature may submit nominations under the official rules.'),
  ('mexico-fonart-gran-premio-2026', '51st National Grand Prize for Popular Art 2026', 'A national competition for adult Mexican artisans. General work intake closes August 14, 2026; courier or postal submissions must arrive by August 7. The official source states a total prize pool of MXN 2,775,000, not a guaranteed award per participant.', 'For artisans in Mexico who create works using traditional techniques, knowledge, materials, and cultural expressions. Review the official rules for categories, work delivery, and documentary requirements.'),
  ('mexico-fonart-grandes-maestros-2026', '13th National Competition for Great Masters of Mexico’s Craft Heritage 2026', 'A national competition recognizing masterworks of Mexican craft heritage. The official source states a total prize pool of MXN 1,588,000; it is not presented as a guaranteed award per participant. The call closes August 14, 2026.', 'The call is intended for Mexican artisans with specified previous awards. Works must be recent and must not have participated in other competitions; confirm eligible categories and prior distinctions in the official rules.'),
  ('spain-icaa-feature-production-905549', 'General Feature Film Production Grants — Second 2026 Procedure', 'A competitive call financing feature-film projects. The second procedure remains open until September 15, 2026 at 14:00 Spanish peninsular time. Maximum support varies by project type and official conditions; KLEIO does not present a single universal amount.', 'The official call reserves funding for feature-film projects and establishes requirements for production companies, co-productions, Spanish nationality of the project, spending in Spain, accessibility, and sustainability.'),
  ('mexico-fonart-nacimientos-2026', '30th National Mexican Nativity Scenes Competition 2026', 'A national competition for artisans creating traditional Mexican nativity scenes. The official source states a total prize pool of MXN 1,075,000; it is not a guaranteed award per participant. The call closes September 25, 2026.', 'The competition recognizes technical mastery, traditional knowledge and materials, cultural and aesthetic contribution, and biocultural heritage preservation. Consult the rules for categories, delivery, and conditions.'),
  ('ibermusicas-2026-especializacion', 'Artistic and Technical Specialization and Advanced Training Support — Ibermúsicas 2026', 'Support for advanced study, specialization, and professional development in artistic, technical, and music-industry fields.', 'The program may take place at an institution or through individual study with teachers and mentors. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-proyectos-virtuales', 'Virtual Projects Support — Ibermúsicas 2026', 'Support for albums, music videos, broadcasts, collaborations, workshops, podcasts, and other music projects delivered through virtual platforms.', 'The call is for music projects that use virtual tools as their primary platform. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-repertorio', 'Ibero-American Repertoire Promotion Support — Ibermúsicas 2026', 'Support for high-quality recordings of works included in the Ibero-American Sheet Music Catalogue.', 'For orchestras, choirs, ensembles, and other groups interested in performing and sharing Ibero-American repertoire. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-mid-atlantic-arts', 'Special Ibermúsicas – Mid Atlantic Arts Call 2026', 'Support for the circulation of Ibero-American artists in the United States, with particular attention to work-visa costs and processes.', 'Mid Atlantic Arts also supports nonprofit host organizations with contracting, production, and promotion. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-emilia-romagna', 'Special Ibermúsicas – Emilia-Romagna Call 2026', 'Support for binational collaborative music projects between Ibero-America and Emilia-Romagna that strengthen creation, concerts, and artistic exchange.', 'The proposal requires collaboration among participating producers, institutions, or artists. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-canciones', 'Ibermúsicas Song Creation Prize 2026', 'A prize supporting new songs and strengthening the Ibero-American music repertoire.', 'Participation, work format, authorship, and participating countries must be confirmed in the official rules. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-circulacion', 'Music Professionals Mobility Support — Ibermúsicas 2026', 'Support for international performance circulation and exchanges in creation, composition, research, and musical knowledge, with emphasis on travel costs. Support may reach 10,000 in USD or EUR depending on the participating country; confirm the applicable currency and maximum.', 'For music professionals from countries participating in the call. Country participation must be confirmed in the official rules. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-sinfonica', 'Ibermúsicas Prize for Composition of a Symphonic Orchestra Work 2026', 'A prize for new symphonic works that expand the contemporary Ibero-American repertoire.', 'Winning works receive a financial prize and are promoted for premieres with orchestras in participating countries. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-canciones-infancias', 'Ibermúsicas Children’s Song Creation Prize 2026', 'A prize for songs created by a duo, focused on childhood, ecology, and care for the environment.', 'The call invites exploration of languages from Ibero-American countries and Indigenous languages. It closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-programacion', 'Music Programming Support — Ibermúsicas 2026', 'Support for festivals, fairs, markets, venues, schools, orchestras, choirs, and other spaces inviting music professionals from other countries.', 'This line supports international mobility costs connected to music programming. It closes October 1, 2026 at 23:59 in the applicant’s country; confirm participating countries and requirements in the rules.'),
  ('ibermusicas-2026-artistas-residencias', 'Residency Support for Artists and Researchers — Ibermúsicas 2026', 'Support for artists, composers, groups, and researchers undertaking creative or research work with a host institution or ensemble.', 'Residencies must last at least three weeks and may take place anywhere in the world. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('ibermusicas-2026-instituciones-residencias', 'Residency Support for Institutions — Ibermúsicas 2026', 'Support for public or private institutions, organizations, and ensembles inviting music professionals to undertake a creative or research residency.', 'The residency must last at least three weeks. The call closes October 1, 2026 at 23:59 in the applicant’s country.'),
  ('spain-icaa-film-festivals-2026', 'Support for Spanish Films Participating in Festivals — 2026', 'Support for Spanish films participating in festivals. The official call remains open until October 10, 2026.', 'The official page contains the call, documentation, and decisions by period. Applicants should confirm the applicable festival period and beneficiary requirements in the official guidelines.')
)
insert into public.opportunity_translations (
  opportunity_id,
  locale,
  source_language,
  title,
  summary,
  description,
  required_materials,
  requirement_translations,
  source_content_hash,
  translation_method,
  verified_at,
  updated_at
)
select
  opportunity_row.id,
  'en',
  opportunity_row.source_language,
  translation.title,
  translation.summary,
  translation.description,
  opportunity_row.required_materials,
  '{}'::jsonb,
  md5(concat_ws(E'\n', opportunity_row.title, opportunity_row.summary, opportunity_row.description, array_to_string(opportunity_row.required_materials, E'\n'))),
  'human_reviewed_seed',
  now(),
  now()
from translations translation
join public.opportunities opportunity_row
  on opportunity_row.external_id = translation.external_id
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
