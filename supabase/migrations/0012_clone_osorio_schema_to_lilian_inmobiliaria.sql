-- Crea y sincroniza el schema de negocio `lilian_inmobiliaria`
-- copiando estructura + datos desde el schema fuente existente de Osorio.
-- Fuente preferida: osorio_inmueble; fallback: osorio_inmuebles.

BEGIN;

CREATE SCHEMA IF NOT EXISTS lilian_inmobiliaria;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  source_schema text;
  table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'osorio_inmueble') THEN
    source_schema := 'osorio_inmueble';
  ELSIF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'osorio_inmuebles') THEN
    source_schema := 'osorio_inmuebles';
  ELSE
    RAISE EXCEPTION 'No existe schema fuente osorio_inmueble/osorio_inmuebles';
  END IF;

  FOR table_name IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = source_schema
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS lilian_inmobiliaria.%I (LIKE %I.%I INCLUDING ALL)',
      table_name, source_schema, table_name
    );

    EXECUTE format(
      'INSERT INTO lilian_inmobiliaria.%I SELECT * FROM %I.%I WHERE NOT EXISTS (SELECT 1 FROM lilian_inmobiliaria.%I LIMIT 1)',
      table_name, source_schema, table_name, table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION lilian_inmobiliaria.is_lilian_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, lilian_inmobiliaria
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM lilian_inmobiliaria.profiles p
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

GRANT EXECUTE ON FUNCTION lilian_inmobiliaria.is_lilian_admin() TO authenticated;

CREATE OR REPLACE FUNCTION lilian_inmobiliaria.increment_quote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = lilian_inmobiliaria, pg_temp
AS $$
BEGIN
  PERFORM set_config('lilian.is_quote_trigger', 'true', true);
  UPDATE lilian_inmobiliaria.properties
  SET quote_count = quote_count + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION lilian_inmobiliaria.decrement_quote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = lilian_inmobiliaria, pg_temp
AS $$
BEGIN
  PERFORM set_config('lilian.is_quote_trigger', 'true', true);
  UPDATE lilian_inmobiliaria.properties
  SET quote_count = GREATEST(quote_count - 1, 0)
  WHERE id = OLD.property_id;
  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.quotes') IS NOT NULL
     AND to_regclass('lilian_inmobiliaria.properties') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_increment_quote_count ON lilian_inmobiliaria.quotes;
    CREATE TRIGGER trg_increment_quote_count
      AFTER INSERT ON lilian_inmobiliaria.quotes
      FOR EACH ROW
      EXECUTE FUNCTION lilian_inmobiliaria.increment_quote_count();

    DROP TRIGGER IF EXISTS trg_decrement_quote_count ON lilian_inmobiliaria.quotes;
    CREATE TRIGGER trg_decrement_quote_count
      AFTER DELETE ON lilian_inmobiliaria.quotes
      FOR EACH ROW
      EXECUTE FUNCTION lilian_inmobiliaria.decrement_quote_count();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.profiles') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "profiles_self_select" ON lilian_inmobiliaria.profiles;
    CREATE POLICY "profiles_self_select"
      ON lilian_inmobiliaria.profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.barrios') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.barrios ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "barrios_select_public" ON lilian_inmobiliaria.barrios;
    CREATE POLICY "barrios_select_public"
      ON lilian_inmobiliaria.barrios FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "barrios_admin_crud" ON lilian_inmobiliaria.barrios;
    CREATE POLICY "barrios_admin_crud"
      ON lilian_inmobiliaria.barrios FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;

  IF to_regclass('lilian_inmobiliaria.property_types') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.property_types ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "property_types_select_public" ON lilian_inmobiliaria.property_types;
    CREATE POLICY "property_types_select_public"
      ON lilian_inmobiliaria.property_types FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "property_types_admin_crud" ON lilian_inmobiliaria.property_types;
    CREATE POLICY "property_types_admin_crud"
      ON lilian_inmobiliaria.property_types FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.properties') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.properties ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "properties_select_public" ON lilian_inmobiliaria.properties;
    CREATE POLICY "properties_select_public"
      ON lilian_inmobiliaria.properties FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "properties_admin_crud" ON lilian_inmobiliaria.properties;
    CREATE POLICY "properties_admin_crud"
      ON lilian_inmobiliaria.properties FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
    DROP POLICY IF EXISTS "properties_trigger_quote_count_update" ON lilian_inmobiliaria.properties;
    CREATE POLICY "properties_trigger_quote_count_update"
      ON lilian_inmobiliaria.properties FOR UPDATE TO anon, authenticated
      USING (current_setting('lilian.is_quote_trigger', true) = 'true')
      WITH CHECK (current_setting('lilian.is_quote_trigger', true) = 'true');
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.property_images') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.property_images ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "property_images_select_public" ON lilian_inmobiliaria.property_images;
    CREATE POLICY "property_images_select_public"
      ON lilian_inmobiliaria.property_images FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "property_images_admin_crud" ON lilian_inmobiliaria.property_images;
    CREATE POLICY "property_images_admin_crud"
      ON lilian_inmobiliaria.property_images FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.quotes') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.quotes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "quotes_insert_public" ON lilian_inmobiliaria.quotes;
    CREATE POLICY "quotes_insert_public"
      ON lilian_inmobiliaria.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS "quotes_select_admin" ON lilian_inmobiliaria.quotes;
    CREATE POLICY "quotes_select_admin"
      ON lilian_inmobiliaria.quotes FOR SELECT TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin());
    DROP POLICY IF EXISTS "quotes_admin_crud" ON lilian_inmobiliaria.quotes;
    CREATE POLICY "quotes_admin_crud"
      ON lilian_inmobiliaria.quotes FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;

  IF to_regclass('lilian_inmobiliaria.calculator_logs') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.calculator_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "calculator_logs_insert_public" ON lilian_inmobiliaria.calculator_logs;
    CREATE POLICY "calculator_logs_insert_public"
      ON lilian_inmobiliaria.calculator_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS "calculator_logs_select_admin" ON lilian_inmobiliaria.calculator_logs;
    CREATE POLICY "calculator_logs_select_admin"
      ON lilian_inmobiliaria.calculator_logs FOR SELECT TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin());
    DROP POLICY IF EXISTS "calculator_logs_admin_crud" ON lilian_inmobiliaria.calculator_logs;
    CREATE POLICY "calculator_logs_admin_crud"
      ON lilian_inmobiliaria.calculator_logs FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.success_cases') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.success_cases ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "success_cases_select_public" ON lilian_inmobiliaria.success_cases;
    CREATE POLICY "success_cases_select_public"
      ON lilian_inmobiliaria.success_cases FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "success_cases_admin_crud" ON lilian_inmobiliaria.success_cases;
    CREATE POLICY "success_cases_admin_crud"
      ON lilian_inmobiliaria.success_cases FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;

  IF to_regclass('lilian_inmobiliaria.testimonials') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.testimonials ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "testimonials_select_public" ON lilian_inmobiliaria.testimonials;
    CREATE POLICY "testimonials_select_public"
      ON lilian_inmobiliaria.testimonials FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "testimonials_admin_crud" ON lilian_inmobiliaria.testimonials;
    CREATE POLICY "testimonials_admin_crud"
      ON lilian_inmobiliaria.testimonials FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;

  IF to_regclass('lilian_inmobiliaria.developments') IS NOT NULL THEN
    ALTER TABLE lilian_inmobiliaria.developments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "developments_select_public" ON lilian_inmobiliaria.developments;
    CREATE POLICY "developments_select_public"
      ON lilian_inmobiliaria.developments FOR SELECT TO anon, authenticated USING (true);
    DROP POLICY IF EXISTS "developments_admin_crud" ON lilian_inmobiliaria.developments;
    CREATE POLICY "developments_admin_crud"
      ON lilian_inmobiliaria.developments FOR ALL TO authenticated
      USING (lilian_inmobiliaria.is_lilian_admin())
      WITH CHECK (lilian_inmobiliaria.is_lilian_admin());
  END IF;
END $$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "storage_property_images_admin_write_lilian" ON storage.objects;
CREATE POLICY "storage_property_images_admin_write_lilian"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'property-images'
  AND lilian_inmobiliaria.is_lilian_admin()
)
WITH CHECK (
  bucket_id = 'property-images'
  AND lilian_inmobiliaria.is_lilian_admin()
);

COMMIT;
