-- Tabla `ciudades` (y columnas nuevas) creadas en 0016/0017 después de 0013.
-- `GRANT ALL ON ALL TABLES` de 0013 solo afectaba tablas ya existentes entonces.
-- Sin nuevos GRANT, PostgREST devuelve: permission denied for table ciudades.
-- Idempotente.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'lilian_inmobiliaria') THEN
    RAISE NOTICE 'Schema lilian_inmobiliaria no existe; omitido.';
    RETURN;
  END IF;

  EXECUTE 'GRANT USAGE ON SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';

  EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON ALL ROUTINES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';
END $$;
