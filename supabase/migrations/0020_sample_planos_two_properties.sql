-- Asigna plano_url de demo a las 2 propiedades más antiguas (ORDER BY created_at ASC).
-- Primera → imagen; segunda → PDF. Idempotente (mismas filas si se re-ejecuta).
-- Reemplazá las URLs cuando subas archivos a Storage.

BEGIN;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.properties') IS NULL THEN
    RAISE NOTICE 'Tabla properties no existe; omitido.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'lilian_inmobiliaria'
      AND table_name = 'properties'
      AND column_name = 'plano_url'
  ) THEN
    RAISE NOTICE 'Columna plano_url no existe; aplicá antes 0016; omitido.';
    RETURN;
  END IF;

  UPDATE lilian_inmobiliaria.properties p
  SET plano_url = CASE r.rn
    WHEN 1 THEN 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80'
    WHEN 2 THEN 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  END
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
    FROM lilian_inmobiliaria.properties
  ) r
  WHERE p.id = r.id AND r.rn IN (1, 2);
END $$;

COMMIT;
