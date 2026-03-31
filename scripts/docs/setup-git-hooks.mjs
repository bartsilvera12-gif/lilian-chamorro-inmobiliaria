import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

function safeExec(cmd) {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function main() {
  const gitDir = safeExec("git rev-parse --git-dir");
  if (!gitDir) {
    console.error("No se pudo determinar el .git dir. Asegurate de estar en un repo git.");
    process.exit(1);
  }

  const hookPath = path.join(repoRoot, gitDir, "hooks", "post-commit");
  const recordScript = path.join(repoRoot, "scripts", "docs", "record-change.mjs");

  const hook = [
    "#!/bin/sh",
    "# Hook post-commit: registra cambios en docs/cambios-recientes.md",
    `node "${recordScript}" >/dev/null 2>&1 || true`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  fs.writeFileSync(hookPath, hook, { encoding: "utf8" });

  // Intentar marcar como ejecutable (en Windows puede no aplicar, pero no rompe nada).
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    // ignore
  }

  console.log("Git hook instalado: post-commit");
  console.log(`- Archivo: ${hookPath}`);
}

main();

