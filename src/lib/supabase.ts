import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://maiahdrsksaotaounddc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_U6uJZ1-sriuJBRzusUH0cg_bD7WTYG4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
