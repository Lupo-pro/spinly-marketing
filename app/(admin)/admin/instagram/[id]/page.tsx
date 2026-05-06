import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSupabase } from '@/lib/supabase/server'
import type { Slide } from '@/lib/instagram/generator'
import SlidePreview from '../_components/SlidePreview'
import RenderButton from '../_components/RenderButton'
import SlidesGrid from '../_components/SlidesGrid'
import ScheduleButton from '../_components/ScheduleButton'
import PostActions from './_components/PostActions'
import { updatePostContent } from '../actions'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
  failed: 'Failed'
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  scheduled: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  published: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
}

export default async function PostValidationPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { data: post } = await supabase
    .from('ig_posts')
    .select('*, ig_angles(axis, hook, thesis)')
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  const slides = (post.slides_json ?? []) as Slide[]
  const hashtagsString = (post.hashtags ?? []).join(' ')
  const angle = Array.isArray(post.ig_angles) ? post.ig_angles[0] : post.ig_angles
  const statusClass = STATUS_COLOR[post.status] ?? STATUS_COLOR.draft
  const slideUrls = (post.slide_image_urls ?? []) as string[]

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/instagram" className="text-sm text-zinc-500 hover:text-zinc-300">
              ← Instagram
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl font-bold">Validation carrousel</h1>
              <span className={`text-xs px-2 py-1 rounded border ${statusClass}`}>
                {STATUS_LABEL[post.status] ?? post.status}
              </span>
            </div>
            {angle && (
              <p className="text-sm text-zinc-500 mt-1">
                <span className="font-mono">{angle.axis}</span> · {angle.hook}
              </p>
            )}
          </div>
        </header>

        <PostActions postId={post.id} status={post.status} />

        <section className="mt-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Visuels rendus
            </h2>
            <RenderButton postId={post.id} hasUrls={slideUrls.length > 0} />
          </div>
          <SlidesGrid urls={slideUrls} />
        </section>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            Publication
          </h2>
          {post.ig_permalink && (
            <div className="mb-4 text-sm">
              <a
                href={post.ig_permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-300 hover:text-violet-200 underline"
              >
                Voir sur Instagram ↗
              </a>
            </div>
          )}
          <ScheduleButton
            postId={post.id}
            status={post.status}
            hasRendered={slideUrls.length === 10}
            scheduledFor={post.scheduled_for}
          />
          {post.last_publish_error && (
            <p className="text-xs text-rose-400 mt-3">
              Dernière erreur de publication : {post.last_publish_error}
            </p>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            10 slides (texte)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide) => (
              <SlidePreview key={slide.n} slide={slide} />
            ))}
          </div>
        </section>

        <PostEditForm postId={post.id} caption={post.caption} hashtagsString={hashtagsString} />

        {post.rejection_reason && (
          <section className="mt-6 p-4 border border-rose-500/30 bg-rose-500/10 rounded-lg">
            <h3 className="text-sm font-semibold text-rose-300 mb-1">Raison du rejet</h3>
            <p className="text-sm text-rose-200">{post.rejection_reason}</p>
          </section>
        )}
      </div>
    </main>
  )
}

function PostEditForm({
  postId,
  caption,
  hashtagsString
}: {
  postId: string
  caption: string
  hashtagsString: string
}) {
  const update = updatePostContent.bind(null, postId)
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
        Caption + Hashtags
      </h2>
      <form action={update} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Caption</label>
          <textarea
            name="caption"
            defaultValue={caption}
            rows={10}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Hashtags (séparés par espaces)
          </label>
          <textarea
            name="hashtags"
            defaultValue={hashtagsString}
            rows={3}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-lg text-sm font-medium hover:bg-white transition"
        >
          Sauver les changements
        </button>
      </form>
    </section>
  )
}
