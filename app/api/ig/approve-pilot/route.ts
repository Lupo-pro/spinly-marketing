import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'

// Phase 16.1 — async approve.
// This route is the *synchronous* half: it acquires an atomic lock on the
// post (status='approved' + pilot_processing=true) and fires a self-call to
// /api/ig/process-approved for the heavy work (render → schedule → publish).
// Should return well under 500ms so Lupo can swipe-validate at full speed.
export const maxDuration = 10
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => ({}))
  const postId = body?.postId as string | undefined
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const supabase = getServerSupabase()

  const { data: post, error: fetchErr } = await supabase
    .from('ig_posts')
    .select('id, status, content_type, pilot_processing')
    .eq('id', postId)
    .single()
  if (fetchErr || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (post.status === 'approved') {
    return NextResponse.json(
      { error: 'Already approved', status: post.status },
      { status: 409 }
    )
  }
  if (post.status === 'rejected') {
    return NextResponse.json(
      { error: 'Already rejected', status: post.status },
      { status: 409 }
    )
  }
  if (post.pilot_processing) {
    return NextResponse.json({ error: 'Already processing' }, { status: 409 })
  }

  // Atomic lock — succeeds only if the row is still status='draft'. If two
  // concurrent approve clicks race, the second one's UPDATE matches no rows.
  const nowIso = new Date().toISOString()
  const { data: locked, error: lockErr } = await supabase
    .from('ig_posts')
    .update({
      status: 'approved',
      approved_at: nowIso,
      approved_by: user.email ?? 'unknown',
      pilot_processing: true,
      pilot_processing_started_at: nowIso,
      pilot_error: null
    })
    .eq('id', postId)
    .eq('status', 'draft')
    .select('id')

  if (lockErr) {
    return NextResponse.json(
      { error: `Failed to acquire lock: ${lockErr.message}` },
      { status: 500 }
    )
  }
  if (!locked || locked.length === 0) {
    return NextResponse.json(
      { error: 'Concurrent approve detected. Reload the page.' },
      { status: 409 }
    )
  }

  // Fire-and-forget the heavy worker. We do NOT await — the response below
  // is what Lupo's UI is waiting on. The naked fetch is dispatched before
  // the function instance is released; the watchdog in pe-status-poll
  // catches anything that gets killed mid-flight.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const internalSecret = process.env.INTERNAL_PROCESS_SECRET || process.env.CRON_SECRET || ''

  fetch(`${baseUrl}/api/ig/process-approved`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${internalSecret}`
    },
    body: JSON.stringify({ postId }),
    cache: 'no-store'
  }).catch((err) => {
    console.error(`[approve-pilot] failed to enqueue process-approved for ${postId}:`, err)
    // Watchdog rattrapera ce post au prochain pe-status-poll cron.
  })

  return NextResponse.json({
    ok: true,
    postId,
    status: 'queued',
    message: 'Approved — render + schedule + publish running in background.'
  })
}
