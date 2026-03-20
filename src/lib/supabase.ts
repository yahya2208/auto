import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Hardcoded values to fix ENV loading issues in browser (Vite .env sync delay)
export const supabaseUrl = 'https://ilocxuvtmqlgbcvtqeqr.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsb2N4dXZ0bXFsZ2JjdnRxZXFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIzMjIyMywiZXhwIjoyMDg4ODA4MjIzfQ.cam22bC6sVwjRN2IlVjOSaIWc-HT0WtjCBGa31fNItg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
