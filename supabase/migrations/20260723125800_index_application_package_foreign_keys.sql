begin;

create index if not exists application_packages_application_id_idx
  on public.application_packages (application_id)
  where application_id is not null;

create index if not exists application_package_items_requirement_id_idx
  on public.application_package_items (requirement_id)
  where requirement_id is not null;

commit;
