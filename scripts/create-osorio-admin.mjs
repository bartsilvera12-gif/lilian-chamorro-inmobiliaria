/**
 * Crea (o actualiza) usuario en Auth + fila admin en lilian_inmobiliaria.profiles.
 *
 * Requisitos en .env.local (o variables de entorno):
 *   VITE_SUPABASE_URL o SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Settings → API → service_role; NO subir a git)
 *
 * Opcional:
 *   VITE_BUSINESS_SCHEMA=lilian_inmobiliaria  (default: lilian_inmobiliaria)
 *
 * Credenciales del admin (mejor pasarlas solo en la línea de comando):
 *   LILIAN_ADMIN_EMAIL
 *   LILIAN_ADMIN_PASSWORD
 *   LILIAN_ADMIN_FULL_NAME  (opcional)
 *   LILIAN_STORE_ID         (opcional, si profiles.store_id es NOT NULL)
 *
 * UUID fijo en Auth (opcional; p. ej. para alinear con otro entorno):
 *   LILIAN_AUTH_USER_ID     (o AUTH_USER_ID) — se pasa a createUser; si ya existe, se actualiza email/contraseña.
 *
 * Compatibilidad legacy (también soportado):
 *   OSORIO_ADMIN_EMAIL / OSORIO_ADMIN_PASSWORD / OSORIO_ADMIN_FULL_NAME / OSORIO_STORE_ID
 *
 * Ejemplo (PowerShell):
 *   $env:LILIAN_ADMIN_EMAIL="admin@dominio.com"
 *   $env:LILIAN_ADMIN_PASSWORD="TuContraseñaSegura"
 *   node scripts/create-osorio-admin.mjs
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
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema =
  process.env.VITE_BUSINESS_SCHEMA ||
  process.env.NEXT_PUBLIC_BUSINESS_SCHEMA ||
  'lilian_inmobiliaria';

const email =
  process.env.LILIAN_ADMIN_EMAIL?.trim() ||
  process.env.OSORIO_ADMIN_EMAIL?.trim();
const password =
  process.env.LILIAN_ADMIN_PASSWORD ||
  process.env.OSORIO_ADMIN_PASSWORD;
const fullName =
  process.env.LILIAN_ADMIN_FULL_NAME?.trim() ||
  process.env.OSORIO_ADMIN_FULL_NAME?.trim() ||
  'Administrador LILIAN';
const storeId =
  process.env.LILIAN_STORE_ID?.trim() ||
  process.env.OSORIO_STORE_ID?.trim() ||
  null;

const fixedUserId =
  process.env.LILIAN_AUTH_USER_ID?.trim() ||
  process.env.AUTH_USER_ID?.trim() ||
  null;

if (!url || !serviceKey) {
  console.error(
    'Falta VITE_SUPABASE_URL (o SUPABASE_URL) y/o SUPABASE_SERVICE_ROLE_KEY en .env.local',
  );
  process.exit(1);
}

if (!email || !password) {
  console.error(
    'Definí LILIAN_ADMIN_EMAIL y LILIAN_ADMIN_PASSWORD (variables de entorno).',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isAlreadyRegistered(err) {
  const m = err?.message?.toLowerCase() || '';
  return (
    m.includes('already') ||
    m.includes('registered') ||
    m.includes('exists') ||
    err?.status === 422
  );
}

async function findUserIdByEmail(target) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const u = data.users.find(
      (x) => x.email?.toLowerCase() === target.toLowerCase(),
    );
    if (u) return u.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

let userId;

const createPayload = {
  email,
  password,
  email_confirm: true,
};
if (fixedUserId) {
  createPayload.id = fixedUserId;
}

const created = await supabase.auth.admin.createUser(createPayload);

if (!created.error && created.data?.user?.id) {
  userId = created.data.user.id;
  console.log('Usuario creado en Auth:', email, 'id=', userId);
} else if (fixedUserId && created.error) {
  const existing = await supabase.auth.admin.getUserById(fixedUserId);
  if (!existing.error && existing.data?.user) {
    userId = fixedUserId;
    const upd = await supabase.auth.admin.updateUserById(fixedUserId, {
      email,
      password,
      email_confirm: true,
    });
    if (upd.error) {
      console.error('Error actualizando usuario existente (id fijo):', upd.error.message);
      process.exit(1);
    }
    console.log(
      'Ya existía usuario con LILIAN_AUTH_USER_ID; email, contraseña y confirmación actualizados:',
      email,
    );
  } else if (isAlreadyRegistered(created.error)) {
    userId = await findUserIdByEmail(email);
    if (!userId) {
      console.error('No se encontró el usuario existente:', created.error.message);
      process.exit(1);
    }
    if (fixedUserId && userId !== fixedUserId) {
      console.error(
        'Conflicto: el email pertenece a otro id (' +
          userId +
          ') distinto de LILIAN_AUTH_USER_ID (' +
          fixedUserId +
          '). Revisá email o id.',
      );
      process.exit(1);
    }
    const upd = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (upd.error) {
      console.error('Error actualizando contraseña:', upd.error.message);
      process.exit(1);
    }
    console.log('Usuario ya existía; contraseña y email_confirm actualizados:', email);
  } else {
    console.error('Auth:', created.error?.message || created.error);
    process.exit(1);
  }
} else if (created.error && isAlreadyRegistered(created.error)) {
  userId = await findUserIdByEmail(email);
  if (!userId) {
    console.error('No se encontró el usuario existente:', created.error.message);
    process.exit(1);
  }
  if (fixedUserId && userId !== fixedUserId) {
    console.error(
      'Conflicto: el email pertenece a otro id (' +
        userId +
        ') distinto de LILIAN_AUTH_USER_ID (' +
        fixedUserId +
        ').',
    );
    process.exit(1);
  }
  const upd = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (upd.error) {
    console.error('Error actualizando contraseña:', upd.error.message);
    process.exit(1);
  }
  console.log('Usuario ya existía; contraseña y email_confirm actualizados:', email);
} else {
  console.error('Auth:', created.error?.message || created.error);
  process.exit(1);
}

const osorio = supabase.schema(schema);
const row = {
  id: userId,
  email,
  full_name: fullName,
  role: 'admin',
  ...(storeId !== null ? { store_id: storeId } : { store_id: null }),
};

const { error: pErr } = await osorio.from('profiles').upsert(row, {
  onConflict: 'id',
});

if (pErr) {
  console.error('Error en profiles (' + schema + '):', pErr.message, pErr);
  process.exit(1);
}

console.log('Perfil admin listo en', schema + '.profiles', 'id=', userId);
