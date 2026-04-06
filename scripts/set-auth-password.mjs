/**
 * Cambia la contraseña de un usuario en Supabase Auth (tabla auth.users).
 * No afecta solo un schema de negocio: Auth es a nivel proyecto.
 *
 * Requisitos:
 *   SUPABASE_URL o VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (solo local; nunca en el front ni en git)
 *
 * Variables para esta ejecución:
 *   AUTH_USER_ID       UUID del usuario (auth.users.id)
 *   AUTH_NEW_PASSWORD  Nueva contraseña
 *
 * PowerShell:
 *   $env:AUTH_USER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *   $env:AUTH_NEW_PASSWORD="TuContraseña"
 *   node scripts/set-auth-password.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnvFile(name) {
  const p = path.join(root, name);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const url =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.AUTH_USER_ID?.trim();
const newPassword = process.env.AUTH_NEW_PASSWORD;

if (!url || !serviceKey) {
  console.error('Falta SUPABASE_URL (o VITE_SUPABASE_URL) y/o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!userId || !newPassword) {
  console.error('Definí AUTH_USER_ID y AUTH_NEW_PASSWORD en el entorno.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: newPassword,
});

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('Contraseña actualizada para:', data.user?.id ?? userId, data.user?.email ?? '');
