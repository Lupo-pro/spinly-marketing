'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const unauthorized = params.get('error') === 'unauthorized'
  const callbackFailed = params.get('error') === 'callback_failed'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })

    if (error) {
      setStatus('error')
      setError(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold mb-2">Spinly Marketing</h1>
      <p className="text-zinc-400 mb-8">Login admin</p>

      {unauthorized && (
        <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 rounded-lg text-red-300 text-sm">
          Cet email n&apos;est pas admin sur ce projet.
        </div>
      )}
      {callbackFailed && (
        <div className="mb-4 p-3 border border-amber-500/30 bg-amber-500/10 rounded-lg text-amber-300 text-sm">
          Le magic link a échoué ou est expiré. Recommence.
        </div>
      )}

      {status === 'sent' ? (
        <div className="p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-lg text-emerald-300">
          Magic link envoyé. Vérifie tes mails et clique sur le lien.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full px-4 py-3 bg-zinc-100 text-zinc-950 rounded-lg font-medium hover:bg-white disabled:opacity-50 transition"
          >
            {status === 'sending' ? 'Envoi...' : 'Recevoir le magic link'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      )}
    </div>
  )
}
