import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/server-auth'
import LogoutButton from './_components/LogoutButton'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
            <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/instagram"
            className="block p-6 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition"
          >
            <h2 className="text-lg font-semibold mb-2">Instagram</h2>
            <p className="text-sm text-zinc-400">
              Validation des carrousels générés (drafts → approved → scheduled → published).
            </p>
          </Link>

          <div className="block p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg opacity-50 cursor-not-allowed">
            <h2 className="text-lg font-semibold mb-2">Insights (phase 3)</h2>
            <p className="text-sm text-zinc-400">
              Performance des posts publiés. Pas encore disponible.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
