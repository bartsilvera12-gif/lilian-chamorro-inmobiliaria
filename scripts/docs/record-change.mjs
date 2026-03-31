import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

const docsDir = path.join(repoRoot, "docs");
const changesFile = path.join(docsDir, "cambios-recientes.md");

function safeExec(cmd, cwd = repoRoot) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function determineModules(files) {
  const modules = new Set();

  for (const f of files) {
    if (f.startsWith("src/pages/admin/") || f.startsWith("src/components/admin/")) modules.add("Admin panel");
    else if (f.startsWith("src/pages/") || f.startsWith("src/components/home/")) modules.add("Sitio público");
    else if (f.startsWith("src/components/property/")) modules.add("Properties/Quotes UI");
    else if (f.startsWith("src/contexts/")) modules.add("Auth/Language");
    else if (f.startsWith("src/i18n/")) modules.add("i18n (traducciones)");
    else if (f.startsWith("src/lib/")) modules.add("Supabase (cliente/config)");
  }

  return Array.from(modules);
}

function determineNotes(files) {
  const notes = [];

  if (files.some((f) => f.includes("QuoteModal"))) {
    notes.push("`QuoteModal` actualmente tiene un TODO para persistir en Supabase; validar impacto en creación de registros.");
  }

  if (files.some((f) => f.startsWith("src/components/home/") || f.startsWith("src/pages/Properties") || f.startsWith("src/pages/PropertyDetail"))) {
    notes.push("Estas rutas/componentes del público usan `mockData` (MOCK_PROPERTIES / MOCK_NEIGHBORHOODS), no Supabase.");
  }

  if (files.some((f) => f.startsWith("src/pages/admin/") || f.startsWith("src/components/admin/") || f.startsWith("src/contexts/") || f.startsWith("src/lib/"))) {
    notes.push("El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.");
  }

  if (files.some((f) => f.includes("supabase.ts") || f.startsWith("src/lib/"))) {
    notes.push("Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).");
  }

  if (files.some((f) => f.startsWith("src/i18n/"))) {
    notes.push("Afecta la capa de internacionalización: revisar que todas las variantes (es/en/pt) estén completas.");
  }

  if (notes.length === 0) notes.push("Revisar el impacto manualmente según los módulos tocados.");

  return uniq(notes);
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "# Cambios recientes\n\n", "utf8");
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function getCommitMessage() {
  const body = safeExec("git log -1 --pretty=%B");
  if (!body) return "Cambio relevante en el proyecto";
  return body.split(/\r?\n/).find(Boolean) ?? "Cambio relevante en el proyecto";
}

function getChangedFiles() {
  // En un post-commit, HEAD existe.
  // Intentamos diff HEAD~1..HEAD y si no existe HEAD~1 (primer commit) usamos git show.
  const byName = safeExec("git diff --name-only HEAD~1 HEAD");
  if (byName) return byName.split(/\r?\n/).filter(Boolean);

  const fallback = safeExec('git show --name-only --pretty="" HEAD');
  return fallback.split(/\r?\n/).filter(Boolean);
}

function shouldTrack(files) {
  // Trackea principalmente cambios en lógica y UI:
  // - src/
  // - scripts/docs/
  // - package.json (scripts de doc)
  return files.some((f) => f.startsWith("src/") || f.startsWith("scripts/docs/") || f === "package.json");
}

function buildEntry({ date, summary, files, modules, notes }) {
  const filesList = files.map((f) => `- ${f}`).join("\n");
  const modulesLine = modules.length ? modules.map((m) => `- ${m}`).join("\n") : "- (impacto no determinado)";
  const notesList = notes.map((n) => `- ${n}`).join("\n");

  return [
    `### Cambios realizados`,
    `- ${summary}`,
    ``,
    `### Archivos modificados`,
    filesList,
    ``,
    `### Impacto`,
    modulesLine,
    ``,
    `### Notas técnicas`,
    notesList,
    ``,
  ].join("\n");
}

function upsertEntryForDate(content, date, entry) {
  const dateHeader = `## ${date}`;

  const startIdx = content.indexOf(dateHeader);
  if (startIdx === -1) {
    const separator = content.endsWith("\n") ? "" : "\n";
    return content + `${separator}${dateHeader}\n\n${entry}\n`;
  }

  // Insertar antes del siguiente "## " (otro día) o al final.
  const nextHeaderIdx = content.indexOf("\n## ", startIdx + dateHeader.length);
  const insertPos = nextHeaderIdx === -1 ? content.length : nextHeaderIdx + 1; // +1 para mantener el salto de línea
  return content.slice(0, insertPos) + `\n${entry}\n` + content.slice(insertPos);
}

function main() {
  ensureFile(changesFile);

  const allChanged = getChangedFiles();
  const changed = allChanged.filter((f) => !f.includes("node_modules/"));
  if (!shouldTrack(changed)) return;

  const date = new Date().toISOString().slice(0, 10);
  const summary = getCommitMessage();
  const modules = determineModules(changed);
  const notes = determineNotes(changed);

  const entry = buildEntry({
    date,
    summary,
    files: uniq(changed).sort(),
    modules,
    notes,
  });

  const content = readFile(changesFile);
  const next = upsertEntryForDate(content, date, entry);
  writeFile(changesFile, next);
}

main();

