import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseKey);
