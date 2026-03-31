-- Moneda del campo `price` (USD o guaraníes).
-- Schema de negocio: osorio_inmueble
alter table osorio_inmueble.properties
  add column if not exists price_currency text not null default 'PYG';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_price_currency_chk'
  ) then
    alter table osorio_inmueble.properties
      add constraint properties_price_currency_chk
      check (price_currency in ('USD', 'PYG'));
  end if;
end $$;

comment on column osorio_inmueble.properties.price_currency is 'USD o PYG: unidad del valor en price';
