-- Row Level Security (RLS) policies para osorio_inmuebles
-- Objetivo:
-- - Público (anon): SELECT para leer barrios/tipos/propiedades/imágenes y INSERT para quotes/calculadora.
-- - Admin (role admin en profiles): CRUD sobre tablas de negocio.
-- - Trigger de quotes: puede incrementar properties.quote_count sin permitir updates arbitrarios.

BEGIN;

-- Helper: es admin según profiles (asumimos que "profiles" está en el schema public, como lo usa el frontend actual).
-- Si luego migran profiles a osorio_inmuebles, se ajusta esta función.
create or replace function osorio_inmuebles.is_osorio_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Reescribir trigger function para marcar el contexto de ejecución.
-- Usamos un GUC (setting local) para que la policy de UPDATE en properties permita
-- SOLO el incremento del contador cuando viene del trigger de quotes.
create or replace function osorio_inmuebles.increment_quote_count()
returns trigger
language plpgsql
as $$
begin
  perform set_config('osorio.is_quote_trigger', 'true', true);

  update osorio_inmuebles.properties
  set quote_count = quote_count + 1
  where id = new.property_id;

  return new;
end;
$$;

drop trigger if exists trg_increment_quote_count on osorio_inmuebles.quotes;
create trigger trg_increment_quote_count
after insert on osorio_inmuebles.quotes
for each row execute function osorio_inmuebles.increment_quote_count();

-- ----------------------------
-- Enable RLS
-- ----------------------------
alter table osorio_inmuebles.barrios enable row level security;
alter table osorio_inmuebles.property_types enable row level security;
alter table osorio_inmuebles.properties enable row level security;
alter table osorio_inmuebles.property_images enable row level security;
alter table osorio_inmuebles.quotes enable row level security;
alter table osorio_inmuebles.calculator_logs enable row level security;

-- ==========================================================
-- Policies: barrios
-- ==========================================================
drop policy if exists "barrios_select_public" on osorio_inmuebles.barrios;
create policy "barrios_select_public"
on osorio_inmuebles.barrios
for select
to anon, authenticated
using (true);

drop policy if exists "barrios_admin_crud" on osorio_inmuebles.barrios;
create policy "barrios_admin_crud"
on osorio_inmuebles.barrios
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

-- ==========================================================
-- Policies: property_types
-- ==========================================================
drop policy if exists "property_types_select_public" on osorio_inmuebles.property_types;
create policy "property_types_select_public"
on osorio_inmuebles.property_types
for select
to anon, authenticated
using (true);

drop policy if exists "property_types_admin_crud" on osorio_inmuebles.property_types;
create policy "property_types_admin_crud"
on osorio_inmuebles.property_types
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

-- ==========================================================
-- Policies: properties
-- ==========================================================
drop policy if exists "properties_select_public" on osorio_inmuebles.properties;
create policy "properties_select_public"
on osorio_inmuebles.properties
for select
to anon, authenticated
using (true);

-- Admin CRUD sobre properties
drop policy if exists "properties_admin_crud" on osorio_inmuebles.properties;
create policy "properties_admin_crud"
on osorio_inmuebles.properties
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

-- UPDATE permitido SOLO al trigger de quotes para incrementar quote_count
drop policy if exists "properties_trigger_quote_count_update" on osorio_inmuebles.properties;
create policy "properties_trigger_quote_count_update"
on osorio_inmuebles.properties
for update
to anon, authenticated
using (current_setting('osorio.is_quote_trigger', true) = 'true')
with check (current_setting('osorio.is_quote_trigger', true) = 'true');

-- ==========================================================
-- Policies: property_images
-- ==========================================================
drop policy if exists "property_images_select_public" on osorio_inmuebles.property_images;
create policy "property_images_select_public"
on osorio_inmuebles.property_images
for select
to anon, authenticated
using (true);

drop policy if exists "property_images_admin_crud" on osorio_inmuebles.property_images;
create policy "property_images_admin_crud"
on osorio_inmuebles.property_images
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

-- ==========================================================
-- Policies: quotes
-- ==========================================================
drop policy if exists "quotes_insert_public" on osorio_inmuebles.quotes;
create policy "quotes_insert_public"
on osorio_inmuebles.quotes
for insert
to anon, authenticated
with check (true);

-- Admin puede leer quotes
drop policy if exists "quotes_select_admin" on osorio_inmuebles.quotes;
create policy "quotes_select_admin"
on osorio_inmuebles.quotes
for select
to authenticated
using (osorio_inmuebles.is_osorio_admin());

-- Admin CRUD (si luego lo necesitás)
drop policy if exists "quotes_admin_crud" on osorio_inmuebles.quotes;
create policy "quotes_admin_crud"
on osorio_inmuebles.quotes
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

-- ==========================================================
-- Policies: calculator_logs
-- ==========================================================
drop policy if exists "calculator_logs_insert_public" on osorio_inmuebles.calculator_logs;
create policy "calculator_logs_insert_public"
on osorio_inmuebles.calculator_logs
for insert
to anon, authenticated
with check (true);

drop policy if exists "calculator_logs_select_admin" on osorio_inmuebles.calculator_logs;
create policy "calculator_logs_select_admin"
on osorio_inmuebles.calculator_logs
for select
to authenticated
using (osorio_inmuebles.is_osorio_admin());

drop policy if exists "calculator_logs_admin_crud" on osorio_inmuebles.calculator_logs;
create policy "calculator_logs_admin_crud"
on osorio_inmuebles.calculator_logs
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

COMMIT;

