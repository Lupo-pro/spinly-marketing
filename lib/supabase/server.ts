import { createClient } from '@supabase/supabase-js'

// Service-role client. Server-only — bypasses RLS.
// Use only in API routes, Server Actions, and crons.
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
