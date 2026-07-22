update public.opportunities opportunity_row
set
  award_min = null,
  award_max = null,
  summary = case opportunity_row.external_id
    when 'mexico-fonart-gran-premio-2026' then 'Concurso nacional para reconocer obras de arte popular y artesanía mexicana. La fuente oficial informa una bolsa total de premios de MXN 2,775,000; no se presenta como un premio garantizado por participante. Cierra el 14 de agosto de 2026.'
    when 'mexico-fonart-grandes-maestros-2026' then 'Concurso nacional para reconocer grandes obras maestras del patrimonio artesanal mexicano. La fuente oficial informa una bolsa total de premios de MXN 1,588,000; no se presenta como un premio garantizado por participante. Cierra el 14 de agosto de 2026.'
    when 'mexico-fonart-nacimientos-2026' then 'Concurso nacional para personas artesanas que elaboran nacimientos mexicanos tradicionales. La fuente oficial informa una bolsa total de premios de MXN 1,075,000; no se presenta como un premio garantizado por participante. Cierra el 25 de septiembre de 2026.'
    else opportunity_row.summary
  end,
  updated_at = now(),
  last_verified_at = now()
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id
  and source_row.slug = 'mexico-cultura'
  and opportunity_row.external_id in (
    'mexico-fonart-gran-premio-2026',
    'mexico-fonart-grandes-maestros-2026',
    'mexico-fonart-nacimientos-2026'
  );
