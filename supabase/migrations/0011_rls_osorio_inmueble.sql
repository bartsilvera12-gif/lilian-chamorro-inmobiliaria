-- RLS para schema osorio_inmueble (el que usa el frontend: VITE_BUSINESS_SCHEMA=osorio_inmueble).
-- Las migraciones 0001–0002 aplican políticas sobre osorio_inmuebles (plural); en producción Neura
-- las tablas suelen estar en osorio_inmueble → INSERT en properties falla con "violates row-level security policy".

BEGIN;

-- Admin: fila en profiles del schema de negocio O en public (legacy).
CREATE OR REPLACE FUNCTION osorio_inmueble.is_osorio_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, osorio_inmueble
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM osorio_inmueble.profiles p
    WHERE p.id = auth.uid()
      AND trim(lower(coalesce(p.role, ''))) = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND trim(lower(coalesce(p.role, ''))) = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION osorio_inmueble.is_osorio_admin() TO authenticated;

-- Trigger de quotes: mismo GUC que en 0002
CREATE OR REPLACE FUNCTION osorio_inmueble.increment_quote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = osorio_inmueble, pg_temp
AS $$
BEGIN
  PERFORM set_config('osorio.is_quote_trigger', 'true', true);
  UPDATE osorio_inmueble.properties
  SET quote_count = quote_count + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('osorio_inmueble.quotes') IS NOT NULL
     AND to_regclass('osorio_inmueble.properties') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_increment_quote_count ON osorio_inmueble.quotes;
    CREATE TRIGGER trg_increment_quote_count
      AFTER INSERT ON osorio_inmueble.quotes
      FOR EACH ROW
      EXECUTE FUNCTION osorio_inmueble.increment_quote_count();
  END IF;
END $$;

-- profiles: el admin debe poder leer su fila para is_osorio_admin vía app_metadata no aplica aquí;
-- SECURITY DEFINER ya resuelve la función; igual conviene SELECT propio.
DO $$
BEGIN
  IF to_regclass('osorio_inmueble.profiles') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "profiles_self_select" ON osorio_inmueble.profiles;
    CREATE POLICY "profiles_self_select"
      ON osorio_inmueble.profiles
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- barrios / property_types
DO $$
BEGIN
  IF to_regclass('osorio_inmueble.barrios') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.barrios ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "barrios_select_public" ON osorio_inmueble.barrios;
    CREATE POLICY "barrios_select_public"
      ON osorio_inmueble.barrios FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "barrios_admin_crud" ON osorio_inmueble.barrios;
    CREATE POLICY "barrios_admin_crud"
      ON osorio_inmueble.barrios FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
  END IF;

  IF to_regclass('osorio_inmueble.property_types') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.property_types ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "property_types_select_public" ON osorio_inmueble.property_types;
    CREATE POLICY "property_types_select_public"
      ON osorio_inmueble.property_types FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "property_types_admin_crud" ON osorio_inmueble.property_types;
    CREATE POLICY "property_types_admin_crud"
      ON osorio_inmueble.property_types FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
  END IF;
END $$;

-- properties
DO $$
BEGIN
  IF to_regclass('osorio_inmueble.properties') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.properties ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "properties_select_public" ON osorio_inmueble.properties;
    CREATE POLICY "properties_select_public"
      ON osorio_inmueble.properties FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "properties_admin_crud" ON osorio_inmueble.properties;
    CREATE POLICY "properties_admin_crud"
      ON osorio_inmueble.properties FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
    DROP POLICY IF EXISTS "properties_trigger_quote_count_update" ON osorio_inmueble.properties;
    CREATE POLICY "properties_trigger_quote_count_update"
      ON osorio_inmueble.properties FOR UPDATE TO anon, authenticated
      USING (current_setting('osorio.is_quote_trigger', true) = 'true')
      WITH CHECK (current_setting('osorio.is_quote_trigger', true) = 'true');
  END IF;
END $$;

-- property_images
DO $$
BEGIN
  IF to_regclass('osorio_inmueble.property_images') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.property_images ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "property_images_select_public" ON osorio_inmueble.property_images;
    CREATE POLICY "property_images_select_public"
      ON osorio_inmueble.property_images FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "property_images_admin_crud" ON osorio_inmueble.property_images;
    CREATE POLICY "property_images_admin_crud"
      ON osorio_inmueble.property_images FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
  END IF;
END $$;

-- quotes / calculator_logs
DO $$
BEGIN
  IF to_regclass('osorio_inmueble.quotes') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.quotes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "quotes_insert_public" ON osorio_inmueble.quotes;
    CREATE POLICY "quotes_insert_public"
      ON osorio_inmueble.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS "quotes_select_admin" ON osorio_inmueble.quotes;
    CREATE POLICY "quotes_select_admin"
      ON osorio_inmueble.quotes FOR SELECT TO authenticated
      USING (osorio_inmueble.is_osorio_admin());
    DROP POLICY IF EXISTS "quotes_admin_crud" ON osorio_inmueble.quotes;
    CREATE POLICY "quotes_admin_crud"
      ON osorio_inmueble.quotes FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
  END IF;

  IF to_regclass('osorio_inmueble.calculator_logs') IS NOT NULL THEN
    ALTER TABLE osorio_inmueble.calculator_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "calculator_logs_insert_public" ON osorio_inmueble.calculator_logs;
    CREATE POLICY "calculator_logs_insert_public"
      ON osorio_inmueble.calculator_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS "calculator_logs_select_admin" ON osorio_inmueble.calculator_logs;
    CREATE POLICY "calculator_logs_select_admin"
      ON osorio_inmueble.calculator_logs FOR SELECT TO authenticated
      USING (osorio_inmueble.is_osorio_admin());
    DROP POLICY IF EXISTS "calculator_logs_admin_crud" ON osorio_inmueble.calculator_logs;
    CREATE POLICY "calculator_logs_admin_crud"
      ON osorio_inmueble.calculator_logs FOR ALL TO authenticated
      USING (osorio_inmueble.is_osorio_admin())
      WITH CHECK (osorio_inmueble.is_osorio_admin());
  END IF;
END $$;

COMMIT;
