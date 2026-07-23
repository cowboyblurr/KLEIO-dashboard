begin;

with translations(external_id, title, summary) as (
  values
  ('362939', 'Laboratorio y residencia de industrias creativas cinematográficas — American Film Showcase 2026', 'Programa de diplomacia pública de cinco días vinculado a American Film Showcase 2026 y al mercado del Festival de Cine Asiático Jogja-NETPAC. Confirma los tipos de solicitantes y requisitos en la fuente oficial.'),
  ('362571', 'Programa de Premios de las Becas Nacionales de Patrimonio de la NEA, año fiscal 2027', 'La NEA seleccionará una organización colaboradora para apoyar el programa de Premios de las Becas Nacionales de Patrimonio 2027. La elegibilidad y el alcance completo deben confirmarse en la convocatoria oficial.'),
  ('363271', 'Reel American: El camino hacia los anillos olímpicos', 'Competencia abierta de la Embajada de Estados Unidos en Ammán para implementar un programa cinematográfico de diplomacia pública de 21 meses antes de los Juegos Olímpicos y Paralímpicos de Los Ángeles 2028.'),
  ('362981', 'Programa Internacional de Indemnización de Artes y Artefactos de la NEA 1, año fiscal 2027', 'Programa de la National Endowment for the Arts. La elegibilidad, los montos y el plazo deben confirmarse en las instrucciones oficiales de arts.gov.'),
  ('362676', 'Subvenciones de acuerdos de colaboración, año fiscal 2027', 'Subvenciones de la NEA para agencias estatales y jurisdiccionales de las artes y organizaciones artísticas regionales elegibles.'),
  ('362982', 'Programa Nacional de Indemnización de Artes y Artefactos de la NEA 1, año fiscal 2027', 'Programa de la National Endowment for the Arts. La elegibilidad, los montos y el plazo deben confirmarse en las instrucciones oficiales.'),
  ('362983', 'Programa Internacional de Indemnización de Artes y Artefactos de la NEA 2, año fiscal 2027', 'Programa de la National Endowment for the Arts con plazo declarado del 8 de marzo de 2027. Confirma todos los requisitos en la fuente oficial.'),
  ('362984', 'Programa Nacional de Indemnización de Artes y Artefactos de la NEA 2, año fiscal 2027', 'Programa de la National Endowment for the Arts con plazo declarado del 7 de junio de 2027. Confirma todos los requisitos en la fuente oficial.'),
  ('361554', 'Declaración anual del programa para la representación de Estados Unidos en bienales internacionales de arte', 'Convocatoria de la Oficina de Asuntos Educativos y Culturales para organizaciones sin fines de lucro. La fuente oficial utiliza un plazo continuo o provisional; confirma las fechas antes de solicitar.'),
  ('322814', 'Concurso de pequeñas subvenciones AFCP 2020', 'Registro histórico de una convocatoria del Fondo de Embajadores para la Preservación Cultural. El contenido fuente menciona fechas de 2019–2020; confirma que no se trate de una convocatoria vigente antes de actuar.'),
  ('322815', 'Concurso de pequeñas subvenciones AFCP 2020', 'Registro histórico del Fondo de Embajadores para la Preservación Cultural, con solicitudes electrónicas. La fuente contiene un plazo de 2019; confirma la vigencia antes de actuar.'),
  ('358676', 'Declaración anual de programas de la Sección de Diplomacia Pública de la Embajada de Estados Unidos en El Cairo', 'Invitación a propuestas que fortalezcan los vínculos culturales y el entendimiento mutuo entre Estados Unidos y Egipto mediante programación cultural, económica, educativa y profesional.'),
  ('363225', 'Declaración anual del programa para la representación de Estados Unidos en bienales internacionales de arquitectura', 'Convocatoria de la Oficina de Asuntos Educativos y Culturales para organizaciones sin fines de lucro. La fuente oficial utiliza un plazo continuo o provisional; confirma las fechas antes de solicitar.')
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
  'es',
  opportunity_row.source_language,
  translation.title,
  translation.summary,
  '',
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
