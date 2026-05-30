import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHJzc2Nyc3FkYmZld3BtZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTI2NTksImV4cCI6MjA5NTcyODY1OX0.qBtfyL9mpzwLVHgq_Unvm99Q63T_IVloSHTte-xlArw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});
