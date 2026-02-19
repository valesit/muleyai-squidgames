import { createClient } from "@supabase/supabase-js";

// Fallback only so build (e.g. on Vercel) succeeds when env is not yet set; runtime must have real values
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTIwMDB9.dummy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
