BEGIN;

CREATE TABLE IF NOT EXISTS osorio_inmuebles.success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  description_es TEXT NOT NULL,
  description_en TEXT,
  description_pt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_cases_active_sort
  ON osorio_inmuebles.success_cases (is_active, sort_order, created_at DESC);

ALTER TABLE osorio_inmuebles.success_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "success_cases_select_public" ON osorio_inmuebles.success_cases;
CREATE POLICY "success_cases_select_public"
ON osorio_inmuebles.success_cases
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "success_cases_admin_crud" ON osorio_inmuebles.success_cases;
CREATE POLICY "success_cases_admin_crud"
ON osorio_inmuebles.success_cases
FOR ALL
TO authenticated
USING (osorio_inmuebles.is_osorio_admin())
WITH CHECK (osorio_inmuebles.is_osorio_admin());

COMMIT;
