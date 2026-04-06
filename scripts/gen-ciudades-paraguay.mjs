import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statoidsPath =
  process.env.STATOIDS_PATH || path.join(__dirname, "data/paraguay-distritos-statoids.md");

let raw;
try {
  raw = fs.readFileSync(statoidsPath, "utf8");
} catch {
  console.error("Missing Statoids dump at:", statoidsPath);
  console.error("Set STATOIDS_PATH to the markdown file from Statoids distritos list.");
  process.exit(1);
}

// Solo la primera columna de cada fila de la tabla (nombre del distrito).
const names = new Set();
for (const line of raw.split("\n")) {
  if (!line.startsWith("| [")) continue;
  const m = line.match(/^\| \[([^\]]+)\]\(/);
  if (m) names.add(m[1]);
}
names.add("Asunción");

const sorted = [...names].sort((a, b) => a.localeCompare(b, "es"));
function esc(s) {
  return s.replace(/'/g, "''");
}
const values = sorted.map((n) => `  ('${esc(n)}')`).join(",\n");

const sql = `-- Seed: distritos de Paraguay (municipios) + capital Asunción.
-- Referencia: listado de distritos (Statoids, ${sorted.length} nombres únicos).
-- Idempotente: ON CONFLICT (nombre) DO NOTHING.

BEGIN;

DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'lilian_inmobiliaria') THEN
    RAISE NOTICE 'Schema lilian_inmobiliaria no existe; omitido.';
    RETURN;
  END IF;
  IF to_regclass('lilian_inmobiliaria.ciudades') IS NULL THEN
    RAISE NOTICE 'Tabla ciudades no existe; omitido.';
    RETURN;
  END IF;

  INSERT INTO lilian_inmobiliaria.ciudades (nombre)
  VALUES
${values}
  ON CONFLICT (nombre) DO NOTHING;
END $migration$;

COMMIT;
`;

const out = path.join(__dirname, "../supabase/migrations/0017_seed_ciudades_paraguay.sql");
fs.writeFileSync(out, sql, "utf8");
console.log("Wrote", out, "rows:", sorted.length);
