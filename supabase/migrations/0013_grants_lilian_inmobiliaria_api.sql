-- Permisos para que anon/authenticated puedan usar el schema vía PostgREST
-- (tras exponerlo en Dashboard → API → Exposed schemas).
-- Idempotente: solo aplica si el schema existe.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'lilian_inmobiliaria') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';

    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';
    EXECUTE 'GRANT ALL ON ALL ROUTINES IN SCHEMA lilian_inmobiliaria TO anon, authenticated, service_role';

    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lilian_inmobiliaria GRANT ALL ON TABLES TO anon, authenticated, service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lilian_inmobiliaria GRANT ALL ON SEQUENCES TO anon, authenticated, service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lilian_inmobiliaria GRANT ALL ON ROUTINES TO anon, authenticated, service_role';
  END IF;
END $$;
