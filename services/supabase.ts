import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqkyffoburjsxsiqkmsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxa3lmZm9idXJqc3hzaXFrbXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODAwMzMsImV4cCI6MjA3OTk1NjAzM30.TreT2MO0yCK1hXJ_gaN40J15GRetnPAcC7TpTXzj3rU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);