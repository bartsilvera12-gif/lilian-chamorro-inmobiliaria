-- Crea tablas para reseñas y desarrollo (schema requerido por el cliente: osorio_inmueble)

begin;

create schema if not exists osorio_inmueble;

create table if not exists osorio_inmueble.testimonials (
  id uuid primary key default gen_random_uuid(),
  review_es text not null,
  stars int not null check (stars between 1 and 5),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists osorio_inmueble.developments (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  description_es text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

commit;

