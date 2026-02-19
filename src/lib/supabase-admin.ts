import { createClient } from "@supabase/supabase-js";

// Fallback only so build (e.g. on Vercel) succeeds when env is not yet set; runtime must have real values
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjAwMH0.dummy";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
