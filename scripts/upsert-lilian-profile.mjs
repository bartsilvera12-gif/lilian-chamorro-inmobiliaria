/**
 * Inserta o actualiza una fila en lilian_inmobiliaria.profiles para un usuario
 * que ya existe en auth.users (no crea usuario en Auth).
 *
 * .env / .env.local:
 *   VITE_SUPABASE_URL o SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VITE_BUSINESS_SCHEMA  (default: lilian_inmobiliaria)
 *
 * Variables de esta corrida:
 *   AUTH_USER_ID o LILIAN_AUTH_USER_ID  — UUID del usuario
 *   LILIAN_PROFILE_ROLE                — opcional, default: admin
 *   LILIAN_PROFILE_FULL_NAME           — opcional; si falta, usa metadata de Auth o parte del email
 *
 *   node scripts/upsert-lilian-profile.mjs
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
const schema =
  process.env.VITE_BUSINESS_SCHEMA ||
  process.env.NEXT_PUBLIC_BUSINESS_SCHEMA ||
  'lilian_inmobiliaria';

const userId =
  process.env.AUTH_USER_ID?.trim() ||
  process.env.LILIAN_AUTH_USER_ID?.trim();
const role =
  process.env.LILIAN_PROFILE_ROLE?.trim() || 'admin';
let fullName = process.env.LILIAN_PROFILE_FULL_NAME?.trim() || '';

if (!url || !serviceKey) {
  console.error('Falta SUPABASE_URL (o VITE_SUPABASE_URL) y/o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!userId) {
  console.error('Definí AUTH_USER_ID o LILIAN_AUTH_USER_ID.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: got, error: gErr } = await supabase.auth.admin.getUserById(userId);
if (gErr || !got?.user) {
  console.error('No existe ese usuario en auth.users:', gErr?.message || gErr);
  process.exit(1);
}

const u = got.user;
const email = u.email ?? '';
if (!fullName) {
  const meta = u.user_metadata || {};
  fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (email ? email.split('@')[0] : 'Usuario');
}

const osorio = supabase.schema(schema);
const row = {
  id: userId,
  email,
  full_name: fullName,
  role,
  store_id: null,
};

const { error: pErr } = await osorio.from('profiles').upsert(row, {
  onConflict: 'id',
});

if (pErr) {
  console.error('Error en profiles (' + schema + '):', pErr.message, pErr);
  process.exit(1);
}

console.log('Listo: profiles en', schema, 'id=', userId, 'email=', email, 'role=', role);
