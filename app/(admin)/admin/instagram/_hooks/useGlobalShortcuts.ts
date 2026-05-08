'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type Shortcut = {
  key: string
  label: string
  action: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export const SPINLY_GENERATE_EVENT = 'spinly:generate-now'

export function useGlobalShortcuts(extra?: Shortcut[]) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: 'g',
        label: 'Generate Now',
        action: () => {
          if (pathname === '/admin/instagram') {
            window.dispatchEvent(new CustomEvent(SPINLY_GENERATE_EVENT))
          } else {
            router.push('/admin/instagram')
          }
        }
      },
      { key: 'r', label: 'Refresh', action: () => router.refresh() },
      { key: 'p', label: 'Mode Pilot', action: () => router.push('/admin/instagram/pilot') },
      { key: 's', label: 'Stats', action: () => router.push('/admin/instagram/stats') },
      { key: 'c', label: 'Calendar', action: () => router.push('/admin/instagram/calendar') },
      { key: 'h', label: 'Home (Studio)', action: () => router.push('/admin/instagram') },
      ...(extra ?? [])
    ]

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const k = e.key.toLowerCase()
      const match = shortcuts.find((s) => s.key === k)
      if (match) {
        e.preventDefault()
        match.action()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, pathname, extra])
}

export const GLOBAL_SHORTCUTS_HELP: { key: string; label: string }[] = [
  { key: 'G', label: 'Generate Now' },
  { key: 'R', label: 'Refresh' },
  { key: 'P', label: 'Mode Pilot' },
  { key: 'S', label: 'Stats' },
  { key: 'C', label: 'Calendar' },
  { key: 'H', label: 'Home (Studio)' },
  { key: '?', label: 'Afficher l\'aide' }
]
