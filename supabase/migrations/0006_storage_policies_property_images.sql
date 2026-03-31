-- Policies para Supabase Storage (storage.objects) en bucket `property-images`
-- Objetivo:
-- - Lectura pública: permitir que el frontend cargue imágenes desde URL pública
-- - Escritura admin: permitir upload/delete/update desde el panel

BEGIN;

alter table storage.objects enable row level security;

-- Lectura pública (o al menos anon/authenticated)
drop policy if exists "storage_property_images_select_public" on storage.objects;
create policy "storage_property_images_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'property-images');

-- Escritura admin
drop policy if exists "storage_property_images_admin_write" on storage.objects;
create policy "storage_property_images_admin_write"
on storage.objects
for all
to authenticated
using (osorio_inmuebles.is_osorio_admin())
with check (osorio_inmuebles.is_osorio_admin());

COMMIT;

