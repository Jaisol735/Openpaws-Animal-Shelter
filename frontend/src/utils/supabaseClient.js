import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qnvgwzwoxflnskwozojt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_sRaqPIwjVhJbUq-9U3rMlw_eJg_wKWZ';

export const supabase = createClient(supabaseUrl, supabaseKey);