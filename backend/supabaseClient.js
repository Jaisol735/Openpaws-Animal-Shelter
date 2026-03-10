import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qnvgwzwoxflnskwozojt.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudmd3endveGZsbnNrd296b2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg0OTI3NSwiZXhwIjoyMDg4NDI1Mjc1fQ.dOOUeFx-y0kuY9qF9LHPy4vZetux8lnXCDpgndKqEKs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
