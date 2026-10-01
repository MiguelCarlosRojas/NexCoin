import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) no configuradas en el entorno actual. Por favor configúralas en tu archivo .env local o en el panel de Vercel (Project Settings > Environment Variables).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
