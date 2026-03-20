import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://temp.supabase.co';
const supabaseAnonKey = envKey || 'missing';

if (!envUrl || !envUrl.startsWith('http')) {
  console.error('[SUPABASE] CRITICAL: VITE_SUPABASE_URL is missing or invalid in .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
