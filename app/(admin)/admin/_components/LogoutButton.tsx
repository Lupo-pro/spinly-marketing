'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-50 transition"
    >
      {busy ? '...' : 'Logout'}
    </button>
  )
}
