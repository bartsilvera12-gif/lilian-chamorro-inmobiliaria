-- Init schema + tablas para Osorio Property Hub
-- Requisito: TODO debe operar sobre schema osorio_inmuebles
--
-- NOTA IMPORTANTE:
-- Este script crea tablas nuevas. Las tablas antiguas (si existieran) NO se borran por defecto
-- para evitar romper el frontend antes de migrar la lógica.
-- Al final incluyo una sección "OPCIONAL" para eliminar tablas viejas.

BEGIN;

create schema if not exists osorio_inmuebles;

-- Necesario para gen_random_uuid() en Postgres
create extension if not exists pgcrypto;

-- ----------------------------
-- 1) Tablas de referencia
-- ----------------------------

create table if not exists osorio_inmuebles.barrios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  coeficiente numeric(6,4) not null default 1.0,
  precio_m2_min numeric(14,2) not null,
  precio_m2_max numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists osorio_inmuebles.property_types (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  coeficiente numeric(6,4) not null,
  created_at timestamptz not null default now()
);

-- ----------------------------
-- 2) Propiedades + imágenes
-- ----------------------------

create table if not exists osorio_inmuebles.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(14,2) not null,

  operation_type text not null check (operation_type in ('venta', 'alquiler')),
  status text not null check (status in ('disponible', 'vendido', 'alquilado')),

  available_from date,
  available_to date,

  bedrooms integer,
  bathrooms integer,
  area_m2 numeric(12,2),

  barrio_id uuid references osorio_inmuebles.barrios(id) on update cascade on delete restrict,
  property_type_id uuid references osorio_inmuebles.property_types(id) on update cascade on delete restrict,

  location_url text,

  quote_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists osorio_inmuebles.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references osorio_inmuebles.properties(id) on update cascade on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------
-- 3) Cotizaciones
-- ----------------------------

create table if not exists osorio_inmuebles.quotes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references osorio_inmuebles.properties(id) on update cascade on delete cascade,
  nombre text not null,
  telefono text,
  email text,
  mensaje text,
  created_at timestamptz not null default now()
);

-- Trigger: al insertar una cotización, incrementar el contador de la propiedad
create or replace function osorio_inmuebles.increment_quote_count()
returns trigger
language plpgsql
as $$
begin
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
-- 4) Logs de calculadora
-- ----------------------------

create table if not exists osorio_inmuebles.calculator_logs (
  id uuid primary key default gen_random_uuid(),

  barrio_id uuid not null references osorio_inmuebles.barrios(id) on update cascade on delete restrict,
  tipo_propiedad_id uuid not null references osorio_inmuebles.property_types(id) on update cascade on delete restrict,

  superficie numeric(12,2) not null,
  tipo_calle text not null check (tipo_calle in ('asfalto', 'empedrado', 'tierra')),
  cerca_arroyo boolean not null default false,
  urgencia text not null check (urgencia in ('apurado', 'no_apurado')),

  -- Precio de Cierre sugerido (Vreal)
  resultado_precio numeric(16,2) not null,

  created_at timestamptz not null default now()
);

-- ----------------------------
-- 5) Indexes (performance)
-- ----------------------------
create index if not exists barrios_nombre_idx on osorio_inmuebles.barrios(nombre);
create index if not exists properties_barrio_idx on osorio_inmuebles.properties(barrio_id);
create index if not exists properties_type_idx on osorio_inmuebles.properties(property_type_id);
create index if not exists properties_quote_count_idx on osorio_inmuebles.properties(quote_count);
create index if not exists property_images_property_idx on osorio_inmuebles.property_images(property_id);
create index if not exists quotes_property_idx on osorio_inmuebles.quotes(property_id);
create index if not exists calculator_logs_barrio_idx on osorio_inmuebles.calculator_logs(barrio_id);
create index if not exists calculator_logs_type_idx on osorio_inmuebles.calculator_logs(tipo_propiedad_id);

-- ----------------------------
-- 6) Seed: property_types (coeficientes desde el PDF)
-- ----------------------------

insert into osorio_inmuebles.property_types (nombre, coeficiente)
values
  ('Terreno Baldío', 0.90),
  ('Terreno con muralla', 0.91),
  ('Terreno con Casa', 0.93),
  ('Casa (Estándar)', 1.00),
  ('Casa nueva (menos de 10 años)', 1.20),
  ('Casa Vieja (más de 30 años)', 0.95),
  ('Departamento', 1.05)
on conflict (nombre) do update
set coeficiente = excluded.coeficiente;

-- ----------------------------
-- 7) Seed: barrios (datos USD desde "PRECIOS MTS2 por Barrio")
-- ----------------------------
-- Nota sobre coeficiente:
-- El PDF de precios aporta rangos USD (precio_m2_min/max).
-- El PDF de especificaciones aporta coeficientes C_ciudad según categorías/zona.
-- Para los barrios no listados explícitamente en la matriz del segundo PDF, se deja coeficiente por defecto (1.00)
-- para no bloquear inserts. Ajustar coeficiente si tu criterio difiere.

insert into osorio_inmuebles.barrios (nombre, coeficiente, precio_m2_min, precio_m2_max)
values
  ('La Encarnación', 1.00, 380.00, 450.00),
  ('Itá Pytã Punta', 1.00, 220.00, 280.00),

  ('Sajonia', 1.00, 300.00, 480.00),
  ('San Antonio', 1.00, 180.00, 250.00),
  ('Dr. Francia', 1.00, 180.00, 250.00),
  ('Tacumbú', 0.75, 180.00, 250.00),

  ('Barrio Obrero', 0.75, 210.00, 210.00),

  ('La Catedral / San Roque (Sector Catedral)', 1.00, 400.00, 450.00),
  ('General Díaz', 1.00, 350.00, 350.00),
  ('San Blas', 1.00, 310.00, 335.00),

  ('San Jorge', 1.00, 480.00, 550.00),
  ('Ytay', 1.00, 420.00, 420.00),
  ('Santa María', 1.00, 330.00, 330.00),
  ('Marangatú', 1.00, 310.00, 335.00),

  ('Manorá', 1.10, 786.00, 1217.00),
  ('Las Lomas (Carmelitas)', 1.00, 742.00, 742.00),
  ('Mariscal López', 1.00, 713.00, 713.00),
  ('Las Mercedes', 1.00, 590.00, 590.00),
  ('Mburicaó', 1.00, 530.00, 530.00),
  ('Jara', 1.00, 460.00, 460.00),
  ('Virgen del Huerto', 1.00, 400.00, 400.00),
  ('San Roque', 1.00, 400.00, 400.00),
  ('Ciudad Nueva', 1.00, 370.00, 370.00),
  ('Pinozá', 1.00, 370.00, 370.00),

  ('Villa Morra', 1.00, 748.00, 748.00),
  ('Recoleta', 1.00, 580.00, 663.00),
  ('San Cristóbal', 1.10, 450.00, 650.00),

  ('Los Laureles', 0.90, 490.00, 560.00),
  ('Mcal. Estigarribia', 0.90, 490.00, 560.00),

  ('San Vicente', 1.00, 350.00, 410.00),
  ('Tembetary', 1.00, 350.00, 410.00),

  ('San Pablo', 1.00, 190.00, 259.00),
  ('Hipódromo', 1.00, 190.00, 259.00),
  ('Terminal', 1.00, 190.00, 259.00),
  ('Nazareth', 0.75, 190.00, 259.00),

  ('Mburucuyá', 1.00, 550.00, 650.00),
  ('Santísima Trinidad / Salvador del Mundo', 1.00, 480.00, 480.00),
  ('Mbocayaty', 1.00, 350.00, 450.00),
  ('Santa Rosa', 1.00, 350.00, 450.00),
  ('Bella Vista', 1.00, 350.00, 450.00),
  ('Zeballos Cué', 1.00, 101.00, 101.00),

  ('Loma Pytá', 1.00, 185.00, 298.00),

  ('Ricardo Brugada (Chacarita)', 0.35, 110.00, 130.00),
  ('Ricardo Brugada (San Roque)', 0.35, 120.00, 120.00),

  ('Iturbe', 1.00, 350.00, 380.00),
  ('Tablada Nueva', 1.00, 180.00, 240.00),

  ('Santo Domingo', 1.00, 680.00, 750.00),
  ('Cañada del Ybyray', 1.00, 700.00, 740.00),
  ('Virgen de la Asunción', 1.00, 260.00, 300.00),

  ('Botánico', 1.00, 150.00, 220.00),
  ('Virgen de Fátima', 1.00, 150.00, 220.00),
  ('San Rafael', 1.00, 150.00, 220.00),

  ('Bernardino Caballero', 1.00, 494.00, 494.00),
  ('Vista Alegre', 1.00, 430.00, 430.00),
  ('Madame Lynch', 1.00, 400.00, 550.00),
  ('Pettirossi', 1.00, 220.00, 250.00),
  ('Santa Librada / Itá Enramada', 1.00, 160.00, 210.00),
  ('Republicano', 0.35, 90.00, 130.00)
on conflict (nombre) do update
set
  coeficiente = excluded.coeficiente,
  precio_m2_min = excluded.precio_m2_min,
  precio_m2_max = excluded.precio_m2_max;

COMMIT;

-- ==========================================================
-- OPCIONAL: Eliminar tablas antiguas (DESPUES de migrar el frontend)
-- ==========================================================
-- Si tu objetivo es realmente reemplazar el flujo existente por el nuevo,
-- ejecuta (con cuidado) las drops después de refactorizar el frontend para que:
-- - consulte siempre schema osorio_inmuebles
-- - use las tablas nuevas (barrios, properties, quotes, etc.)
--
-- Ejemplos (ajusta nombres/esquemas según tu BD real):
--
-- DROP TABLE IF EXISTS public.product_images_inmobiliaria;
-- DROP TABLE IF EXISTS public.products_inmobiliaria;
-- DROP TABLE IF EXISTS public.neighborhoods;
-- DROP TABLE IF EXISTS public.quotes;

