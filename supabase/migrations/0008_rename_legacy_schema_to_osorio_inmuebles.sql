-- Renombra el schema legacy "Osorio_Inmuebles" (identificador con mayúsculas) a osorio_inmuebles.
-- Útil en bases ya desplegadas antes del cambio a un nombre compatible con PostgREST.
-- En instalaciones nuevas (0001+ ya con osorio_inmuebles) este bloque no hace nada.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'Osorio_Inmuebles'
  ) THEN
    EXECUTE 'ALTER SCHEMA "Osorio_Inmuebles" RENAME TO osorio_inmuebles';
  END IF;
END $$;

COMMIT;
