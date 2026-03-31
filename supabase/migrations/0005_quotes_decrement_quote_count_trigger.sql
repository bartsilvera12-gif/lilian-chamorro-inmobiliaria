-- Asegura consistencia:
-- Si un admin elimina una cotización, también se decrementa properties.quote_count.

BEGIN;

create or replace function osorio_inmuebles.decrement_quote_count()
returns trigger
language plpgsql
as $$
begin
  perform set_config('osorio.is_quote_trigger', 'true', true);

  update osorio_inmuebles.properties
  set quote_count = greatest(quote_count - 1, 0)
  where id = old.property_id;

  return old;
end;
$$;

drop trigger if exists trg_decrement_quote_count on osorio_inmuebles.quotes;
create trigger trg_decrement_quote_count
after delete on osorio_inmuebles.quotes
for each row execute function osorio_inmuebles.decrement_quote_count();

COMMIT;

