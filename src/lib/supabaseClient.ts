import { createClient } from '@supabase/supabase-js';

// Safe fallback URL and key so createClient never throws "supabaseUrl is required" during build or unconfigured environments
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) no configuradas en el entorno actual. Por favor configúralas en tu archivo .env local o en el panel de Vercel (Project Settings > Environment Variables).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
