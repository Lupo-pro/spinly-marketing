import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import { getNextSlots } from '@/lib/instagram/scheduler'

export const dynamic = 'force-dynamic'

function maskToken(token: string | null | undefined): string {
  if (!token || token.length < 20) return '(non configuré)'
  return `${token.slice(0, 10)}…${token.slice(-5)}`
}

function daysUntil(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = new Date(iso).getTime() - Date.now()
  if (ms < 0) return 'expiré'
  const days = Math.floor(ms / 86400_000)
  const hours = Math.floor((ms % 86400_000) / 3600_000)
  return `${days}j ${hours}h`
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return "il y a < 1 min"
  if (ms < 3600_000) return `il y a ${Math.floor(ms / 60_000)} min`
  if (ms < 86400_000) return `il y a ${Math.floor(ms / 3600_000)} h`
  return `il y a ${Math.floor(ms / 86400_000)} j`
}

const PHASE_LABEL: Record<string, string> = {
  phase_1: 'Phase 1 — warmup doux (1 post/jour, lun-ven)',
  phase_2: 'Phase 2 — accélération (2 posts/jour)',
  full: 'Full — calendrier complet'
}

export default async function AccountPage() {
  const supabase = getServerSupabase()

  const { data: account } = await supabase
    .from('ig_account')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!account) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/instagram" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Instagram
          </Link>
          <h1 className="text-3xl font-bold mt-2 mb-8">Compte Instagram</h1>
          <div className="p-6 border border-amber-500/30 bg-amber-500/10 rounded-lg text-amber-200">
            Aucun compte IG configuré. Lance{' '}
            <code className="text-amber-100 bg-amber-500/20 px-1 rounded">
              npm run setup:ig-account -- --ig-user-id=… --fb-page-id=… --access-token=… --app-id=…
            </code>{' '}
            avec tes credentials Meta.
          </div>
        </div>
      </main>
    )
  }

  const { data: logs } = await supabase
    .from('ig_publish_logs')
    .select('*')
    .order('attempted_at', { ascending: false })
    .limit(20)

  let nextSlots: Date[] = []
  try {
    nextSlots = await getNextSlots(5)
  } catch {
    // getAccount() can throw if RLS misbehaves — page already handled the missing-account case
  }

  const warmupStart = new Date(account.warmup_started_at)
  const daysSinceStart = Math.floor((Date.now() - warmupStart.getTime()) / 86400_000)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link href="/admin/instagram" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Instagram
          </Link>
          <h1 className="text-3xl font-bold mt-2">Compte Instagram</h1>
          <p className="text-sm text-zinc-500 mt-1">
            État du token, warmup, slots et historique de publication.
          </p>
        </header>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            Compte
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <dt className="text-zinc-500">IG User ID</dt>
            <dd className="font-mono">{account.ig_user_id ?? '—'}</dd>
            <dt className="text-zinc-500">FB Page ID</dt>
            <dd className="font-mono">{account.fb_page_id ?? '—'}</dd>
            <dt className="text-zinc-500">App ID</dt>
            <dd className="font-mono">{account.app_id ?? '—'}</dd>
            <dt className="text-zinc-500">Actif</dt>
            <dd>{account.active ? 'oui' : 'non'}</dd>
          </dl>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            Token
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <dt className="text-zinc-500">Access token</dt>
            <dd className="font-mono">{maskToken(account.access_token)}</dd>
            <dt className="text-zinc-500">Expire dans</dt>
            <dd>{daysUntil(account.token_expires_at)}</dd>
            <dt className="text-zinc-500">Dernier refresh</dt>
            <dd>{relativeTime(account.last_token_refresh_at)}</dd>
          </dl>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            Warmup
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <dt className="text-zinc-500">Phase</dt>
            <dd>{PHASE_LABEL[account.warmup_phase] ?? account.warmup_phase}</dd>
            <dt className="text-zinc-500">Démarré le</dt>
            <dd>{warmupStart.toLocaleDateString('fr-FR')} ({daysSinceStart} j)</dd>
            <dt className="text-zinc-500">Posts publiés</dt>
            <dd className="text-emerald-300 font-mono">{account.posts_published_count ?? 0}</dd>
            <dt className="text-zinc-500">Échecs</dt>
            <dd className="text-rose-300 font-mono">{account.posts_failed_count ?? 0}</dd>
          </dl>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            5 prochains slots libres
          </h2>
          {nextSlots.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun slot dans les 14 prochains jours.</p>
          ) : (
            <ul className="space-y-2">
              {nextSlots.map((slot, i) => (
                <li key={i} className="text-sm font-mono text-zinc-300">
                  {slot.toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Bogota'
                  })}{' '}
                  <span className="text-zinc-600">(Colombia)</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-4">
            20 dernières tentatives
          </h2>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune publication encore.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-zinc-500 text-left">
                <tr>
                  <th className="pb-2 font-medium">Quand</th>
                  <th className="pb-2 font-medium">Post</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-zinc-800">
                    <td className="py-2 font-mono text-zinc-400">{relativeTime(log.attempted_at)}</td>
                    <td className="py-2 font-mono text-zinc-400">
                      {log.post_id?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="py-2">
                      {log.success ? (
                        <span className="text-emerald-300">OK</span>
                      ) : (
                        <span className="text-rose-300">{log.meta_response_code ?? 'fail'}</span>
                      )}
                    </td>
                    <td className="py-2 text-zinc-500 truncate max-w-xs">
                      {log.error_message ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  )
}
