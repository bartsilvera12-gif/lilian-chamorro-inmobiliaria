-- Ciudades (referencia), barrios.ciudad_id, plano y planes de pago en propiedades.
-- Idempotente. Schema: lilian_inmobiliaria.

BEGIN;

DO $$
DECLARE
  v_asuncion uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'lilian_inmobiliaria') THEN
    RAISE NOTICE 'Schema lilian_inmobiliaria no existe; omitido.';
    RETURN;
  END IF;

  -- Tabla ciudades
  CREATE TABLE IF NOT EXISTS lilian_inmobiliaria.ciudades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  INSERT INTO lilian_inmobiliaria.ciudades (nombre)
  VALUES ('Asunción')
  ON CONFLICT (nombre) DO NOTHING;

  SELECT id INTO v_asuncion FROM lilian_inmobiliaria.ciudades WHERE nombre = 'Asunción' LIMIT 1;

  -- Barrio pertenece a ciudad
  IF to_regclass('lilian_inmobiliaria.barrios') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.barrios
      ADD COLUMN IF NOT EXISTS ciudad_id uuid REFERENCES lilian_inmobiliaria.ciudades(id) ON UPDATE CASCADE ON DELETE RESTRICT;

    IF v_asuncion IS NOT NULL THEN
      UPDATE lilian_inmobiliaria.barrios SET ciudad_id = v_asuncion WHERE ciudad_id IS NULL;
    END IF;
  END IF;

  -- Propiedad: plano (URL imagen o PDF) y planes de cuotas (jsonb)
  IF to_regclass('lilian_inmobiliaria.properties') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.properties ADD COLUMN IF NOT EXISTS plano_url text;
    ALTER TABLE lilian_inmobiliaria.properties
      ADD COLUMN IF NOT EXISTS payment_plans jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- RLS ciudades (mismo patrón que barrios)
  ALTER TABLE lilian_inmobiliaria.ciudades ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "ciudades_select_public" ON lilian_inmobiliaria.ciudades;
  CREATE POLICY "ciudades_select_public"
    ON lilian_inmobiliaria.ciudades FOR SELECT TO anon, authenticated USING (true);

  DROP POLICY IF EXISTS "ciudades_admin_crud" ON lilian_inmobiliaria.ciudades;
  CREATE POLICY "ciudades_admin_crud"
    ON lilian_inmobiliaria.ciudades FOR ALL TO authenticated
    USING (lilian_inmobiliaria.is_lilian_admin())
    WITH CHECK (lilian_inmobiliaria.is_lilian_admin());

END $$;

COMMIT;
