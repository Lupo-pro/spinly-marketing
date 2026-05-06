import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from './_components/PostCard'

export const dynamic = 'force-dynamic'

const COLUMNS: { status: string; label: string }[] = [
  { status: 'draft', label: 'Drafts' },
  { status: 'approved', label: 'Approved' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'published', label: 'Published' }
]

export default async function InstagramKanban() {
  const supabase = getServerSupabase()
  const { data } = await supabase
    .from('ig_posts')
    .select('id, status, slides_json, generated_at, ig_angles(axis)')
    .in('status', COLUMNS.map((c) => c.status))
    .order('generated_at', { ascending: false })

  const posts = (data ?? []) as unknown as (PostCardData & { status: string })[]

  const byStatus: Record<string, (PostCardData & { status: string })[]> = {}
  for (const c of COLUMNS) byStatus[c.status] = []
  for (const p of posts) {
    if (byStatus[p.status]) byStatus[p.status].push(p)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
              ← Admin
            </Link>
            <h1 className="text-3xl font-bold mt-2">Instagram</h1>
            <p className="text-sm text-zinc-500 mt-1">Pipeline de validation des carrousels</p>
          </div>
          <Link
            href="/admin/instagram/account"
            className="text-sm text-zinc-400 hover:text-zinc-100 px-3 py-2 border border-zinc-800 hover:border-zinc-600 rounded-lg transition"
          >
            Compte & monitoring →
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <section key={col.status} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <header className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                  {col.label}
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                  {byStatus[col.status].length}
                </span>
              </header>
              <div className="space-y-2">
                {byStatus[col.status].length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-6">Vide</p>
                ) : (
                  byStatus[col.status].map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
