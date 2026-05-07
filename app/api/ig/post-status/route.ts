import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// Lightweight read-only endpoint the Pilot UI polls every ~2s during the
// approve flow to follow the render → schedule → publish progression.
export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
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
  const {
    data: { user }
  } = await supabaseAuth.auth.getUser()
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('ig_posts')
    .select(
      'status, slide_image_urls, content_type, pilot_scheduled_at, pilot_platforms, pe_post_id, pe_status, pe_scheduled_for'
    )
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const expected = data.content_type === 'carousel' ? 10 : 1
  const slideCount = Array.isArray(data.slide_image_urls) ? data.slide_image_urls.length : 0

  return NextResponse.json({
    status: data.status,
    has_render: slideCount === expected,
    slide_count: slideCount,
    is_scheduled: !!data.pilot_scheduled_at && !!data.pe_post_id,
    pilot_scheduled_at: data.pilot_scheduled_at,
    pilot_platforms: data.pilot_platforms,
    pe_status: data.pe_status,
    pe_scheduled_for: data.pe_scheduled_for,
    pe_post_id: data.pe_post_id
  })
}
