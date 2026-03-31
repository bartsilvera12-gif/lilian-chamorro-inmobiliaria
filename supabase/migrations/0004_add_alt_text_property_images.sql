-- Ajuste de compatibilidad:
-- El admin actual permite editar un campo alt_text para imágenes.
-- La tabla property_images (creada en 0001) no lo incluía; lo agregamos para evitar errores.

BEGIN;

alter table osorio_inmuebles.property_images
add column if not exists alt_text text;

COMMIT;

