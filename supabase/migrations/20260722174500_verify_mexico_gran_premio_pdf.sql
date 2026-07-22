do $$
declare
  opportunity_uuid uuid;
  official_pdf constant text := 'https://convocatorias.cultura.gob.mx/public/assets/uploads/recursos/convocatorias/arte-popular-2026.pdf';
begin
  select o.id into opportunity_uuid
  from public.opportunities o
  join public.opportunity_sources s on s.id = o.source_id
  where s.slug = 'mexico-cultura'
    and o.external_id = 'mexico-fonart-gran-premio-2026'
  limit 1;

  if opportunity_uuid is null then
    return;
  end if;

  update public.opportunities
  set summary = 'Concurso nacional para personas artesanas mexicanas mayores de edad. La recepción general de obras cierra el 14 de agosto de 2026; los envíos por paquetería o correo postal deben recibirse antes, el 7 de agosto. La fuente oficial informa una bolsa total de MXN 2,775,000, no un premio garantizado por participante.',
      guidelines_url = official_pdf,
      age_min = 18,
      previous_award_restrictions = 'La convocatoria excluye varias categorías de personas ganadoras de concursos anteriores y determinadas personas trabajadoras del sector público o de instituciones artesanales. Confirma todas las exclusiones en las bases oficiales.',
      required_materials = array[
        'Artwork marked GP26',
        'Official identification',
        'CURP',
        'Proof of address',
        'Color photograph of artwork',
        'Technical data sheet'
      ]::text[],
      last_verified_at = now(),
      updated_at = now()
  where id = opportunity_uuid;

  delete from public.opportunity_eligibility_rules
  where opportunity_id = opportunity_uuid
    and extraction_method = 'manual_review'
    and rule_type = 'age';

  insert into public.opportunity_eligibility_rules (
    opportunity_id,
    rule_type,
    operator,
    value,
    requirement_level,
    source_text,
    source_url,
    source_field,
    extraction_method,
    verification_status,
    last_verified_at,
    sort_order
  ) values (
    opportunity_uuid,
    'age',
    'greater_than_or_equal',
    '18'::jsonb,
    'required',
    'The official guidelines state that participants must be adult Mexican artisans.',
    official_pdf,
    'Base primera: personas participantes',
    'manual_review',
    'confirmed',
    now(),
    20
  );

  delete from public.opportunity_requirements
  where opportunity_id = opportunity_uuid
    and extraction_method = 'manual_review';

  insert into public.opportunity_requirements (
    opportunity_id,
    material_key,
    label,
    required,
    source_text,
    source_url,
    extraction_method,
    verification_status,
    last_verified_at,
    sort_order
  ) values
    (opportunity_uuid, 'artwork_marked_gp26', 'Artwork in acceptable condition and marked GP26', true, 'The work must be in acceptable condition and marked GP26 in a discreet location.', official_pdf, 'manual_review', 'confirmed', now(), 10),
    (opportunity_uuid, 'official_identification', 'Official identification', true, 'A legible copy of current official identification is required.', official_pdf, 'manual_review', 'confirmed', now(), 20),
    (opportunity_uuid, 'curp', 'Certified CURP', true, 'A certified and current copy of the CURP is required.', official_pdf, 'manual_review', 'confirmed', now(), 30),
    (opportunity_uuid, 'proof_of_address', 'Proof of address', true, 'Proof of address or residence issued within the stated period is required.', official_pdf, 'manual_review', 'confirmed', now(), 40),
    (opportunity_uuid, 'artwork_photograph', 'Color photograph of the artwork', true, 'A printed and digital color photograph of the work is required.', official_pdf, 'manual_review', 'confirmed', now(), 50),
    (opportunity_uuid, 'technical_data_sheet', 'Technical data sheet for the artwork', true, 'A technical data sheet describing the work, authorship, materials, process, dimensions, and relevant cultural information is required.', official_pdf, 'manual_review', 'confirmed', now(), 60);
end
$$;
