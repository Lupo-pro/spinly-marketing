'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateCarousel } from '@/lib/instagram/generator'
import { schedulePost } from '@/lib/instagram/scheduler'
import { getCurrentUser } from '@/lib/supabase/server-auth'

export async function approvePost(postId: string) {
  const user = await getCurrentUser()
  const supabase = getServerSupabase()
  await supabase
    .from('ig_posts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user?.email ?? 'unknown'
    })
    .eq('id', postId)
  revalidatePath('/admin/instagram')
  revalidatePath(`/admin/instagram/${postId}`)
}

export async function rejectPost(postId: string, formData: FormData) {
  const reason = (formData.get('reason') as string) || ''
  const supabase = getServerSupabase()
  await supabase
    .from('ig_posts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', postId)
  revalidatePath('/admin/instagram')
  redirect('/admin/instagram')
}

export async function updatePostContent(postId: string, formData: FormData) {
  const caption = formData.get('caption') as string
  const hashtagsRaw = formData.get('hashtags') as string
  const hashtags = hashtagsRaw
    .split(/\s+/)
    .map((h) => h.trim())
    .filter((h) => h.length > 0)

  const supabase = getServerSupabase()
  await supabase.from('ig_posts').update({ caption, hashtags }).eq('id', postId)
  revalidatePath(`/admin/instagram/${postId}`)
}

export async function renderPostAction(postId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'
  const res = await fetch(`${appUrl}/api/ig/render-post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`
    },
    body: JSON.stringify({ postId }),
    cache: 'no-store'
  })
  const data = await res.json()
  revalidatePath(`/admin/instagram/${postId}`)
  return data as {
    rendered: number
    total: number
    urls: string[]
    errors: { slideN: number; error: string }[]
  }
}

export async function schedulePostAction(postId: string) {
  const supabase = getServerSupabase()
  const { data: post } = await supabase
    .from('ig_posts')
    .select('slide_image_urls, status')
    .eq('id', postId)
    .single()

  if (!post) {
    return { ok: false, error: 'Post not found' } as const
  }
  if (post.status !== 'approved') {
    return { ok: false, error: 'Post must be approved before scheduling' } as const
  }
  if (!post.slide_image_urls || post.slide_image_urls.length !== 10) {
    return { ok: false, error: 'Slides must be rendered before scheduling' } as const
  }

  const result = await schedulePost(postId)
  revalidatePath(`/admin/instagram/${postId}`)
  revalidatePath('/admin/instagram')
  if (!result.ok) return result
  return {
    ok: true as const,
    scheduledFor: result.scheduledFor ? result.scheduledFor.toISOString() : null
  }
}

export async function regeneratePost(postId: string) {
  const supabase = getServerSupabase()
  const { data: post } = await supabase
    .from('ig_posts')
    .select('*, ig_angles(*)')
    .eq('id', postId)
    .single()

  if (!post || !post.ig_angles) throw new Error('Post or angle not found')

  const angle = Array.isArray(post.ig_angles) ? post.ig_angles[0] : post.ig_angles
  const carousel = await generateCarousel({
    axis: angle.axis,
    hook: angle.hook,
    thesis: angle.thesis
  })

  await supabase
    .from('ig_posts')
    .update({
      slides_json: carousel.slides,
      caption: carousel.caption,
      hashtags: carousel.hashtags,
      generated_at: new Date().toISOString()
    })
    .eq('id', postId)

  revalidatePath(`/admin/instagram/${postId}`)
}
