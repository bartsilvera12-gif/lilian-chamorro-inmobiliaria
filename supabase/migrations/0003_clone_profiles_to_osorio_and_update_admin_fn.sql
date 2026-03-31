-- Clona la tabla public.profiles a osorio_inmuebles.profiles
-- y actualiza la función is_osorio_admin() para usar el schema osorio_inmuebles.
-- Esto reduce la dependencia de "public" para el control de acceso admin.

BEGIN;

create schema if not exists osorio_inmuebles;

-- Crear clon estructural
-- (incluye columnas, constraints y defaults)
create table if not exists osorio_inmuebles.profiles (like public.profiles including all);

-- Copiar datos existentes (si ya existía, no sobrescribimos para evitar sorpresas)
insert into osorio_inmuebles.profiles
select *
from public.profiles
on conflict (id) do nothing;

-- Asegurar RLS mínimo en la copia
alter table osorio_inmuebles.profiles enable row level security;

drop policy if exists "profiles_self_select" on osorio_inmuebles.profiles;
create policy "profiles_self_select"
on osorio_inmuebles.profiles
for select
to authenticated
using (id = auth.uid());

-- Actualizar helper admin fn para que consulte desde osorio_inmuebles
create or replace function osorio_inmuebles.is_osorio_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from osorio_inmuebles.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

COMMIT;

