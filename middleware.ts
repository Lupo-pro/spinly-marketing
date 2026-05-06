import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isRender = path.startsWith('/render')
  const isAdmin = path.startsWith('/admin')

  if (!isRender && !isAdmin) {
    return NextResponse.next()
  }

  // Internal Puppeteer caller: bypass auth on /render/* via secret header.
  if (isRender) {
    const renderSecret = req.headers.get('x-render-secret')
    if (renderSecret && renderSecret === process.env.CRON_SECRET) {
      return NextResponse.next()
    }
    // Fall through to admin auth — Lupo can preview templates in his browser.
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/render/:path*']
}
