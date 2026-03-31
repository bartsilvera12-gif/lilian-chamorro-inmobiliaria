import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");

function getConnectionString() {
  // Preferimos un solo env: DATABASE_URL / PG_CONNECTION_STRING
  // Ejemplo DATABASE_URL=postgres://user:pass@host:5432/dbname
  return (
    process.env.PG_CONNECTION_STRING ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    ""
  );
}

function sortMigrations(files) {
  return files.sort((a, b) => {
    const na = Number(a.split("_")[0]);
    const nb = Number(b.split("_")[0]);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

async function main() {
  const connStr = getConnectionString();
  if (!connStr) {
    throw new Error(
      "Falta conexión. Proveé PG_CONNECTION_STRING o DATABASE_URL en el entorno."
    );
  }

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`No existe la carpeta: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"));

  const ordered = sortMigrations(files);

  if (ordered.length === 0) {
    throw new Error("No se encontraron migraciones .sql para ejecutar.");
  }

  const client = new Client({ connectionString: connStr });

  await client.connect();
  try {
    for (const file of ordered) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf8");

      console.log(`Ejecutando ${file}...`);
      // Algunas migraciones ya incluyen BEGIN/COMMIT, pero ejecutar en secuencia es suficiente.
      await client.query(sql);
      console.log(`OK: ${file}`);
    }

    console.log("Todas las migraciones se aplicaron correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error al aplicar migraciones:", err?.message ?? err);
  process.exit(1);
});

