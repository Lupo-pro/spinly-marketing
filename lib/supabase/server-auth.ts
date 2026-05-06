import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read-only Server Component / Server Action helper.
// Cookies are read-only in Server Components, so set/remove are no-ops here.
export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {}
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
