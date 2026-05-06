import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorDescription = searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`)
  }

  if (code) {
    const cookieStore = cookies()
    const response = NextResponse.redirect(`${origin}/admin`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            response.cookies.set({ name, value, ...options })
          },
          remove: (name, options) => {
            response.cookies.set({ name, value: '', ...options })
          }
        }
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }

    return response
  }

  return NextResponse.redirect(`${origin}/login`)
}
