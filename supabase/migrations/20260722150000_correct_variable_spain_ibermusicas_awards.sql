begin;

update public.opportunities opportunity_row
set
  award_min = null,
  award_max = null,
  currency = null,
  summary = 'Convocatoria competitiva para financiar proyectos de largometraje. El segundo procedimiento permanece abierto hasta el 15 de septiembre de 2026 a las 14:00, hora peninsular. La cuantía máxima varía según el tipo de proyecto y las condiciones oficiales; KLEIO no presenta una cifra única como aplicable a todos los proyectos.',
  updated_at = now(),
  last_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id
  and source_row.slug = 'spain-culture-bdns'
  and opportunity_row.external_id = 'spain-icaa-feature-production-905549';

update public.opportunities opportunity_row
set
  award_min = null,
  award_max = null,
  currency = null,
  summary = 'Apoyo para la internacionalización de espectáculos y para intercambios de creación, composición, investigación y saberes musicales, con énfasis en costos de pasajes. La ayuda puede alcanzar hasta 10,000 en USD o EUR según el país participante; confirma la moneda y el máximo aplicable en las bases oficiales.',
  updated_at = now(),
  last_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id
  and source_row.slug = 'ibermusicas'
  and opportunity_row.external_id = 'ibermusicas-2026-circulacion';

commit;
