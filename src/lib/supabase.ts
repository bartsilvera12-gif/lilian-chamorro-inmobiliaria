import { createClient } from '@supabase/supabase-js';

// Vite solo expone variables con prefijo `VITE_` en `import.meta.env`.
// Por eso soportamos `VITE_*` y, como fallback, también `NEXT_PUBLIC_*` si existieran.
const DEFAULT_SUPABASE_URL = 'https://api.neura.com.py';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc0MTAxNDYxLCJleHAiOjE5MzE3ODE0NjF9.7_wAph8IolPMXtgfpezSwS5XR62IdD__qhqCywLDp3Q';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ??
  DEFAULT_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  DEFAULT_SUPABASE_ANON_KEY;

const BUSINESS_SCHEMA =
  (import.meta.env.VITE_BUSINESS_SCHEMA as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_BUSINESS_SCHEMA as string | undefined) ??
  'osorio_inmueble';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Wrapper para operar exclusivamente sobre el schema requerido.
export const osorio = supabase.schema(BUSINESS_SCHEMA);
