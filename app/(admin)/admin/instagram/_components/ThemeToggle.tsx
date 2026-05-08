'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'spinly-theme'

function readStored(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = readStored()
    setTheme(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage may be disabled */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
      aria-pressed={theme === 'light'}
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--spinly-bg-elevated, rgba(255,255,255,0.05))',
        border: '1px solid var(--spinly-border-default, rgba(255,255,255,0.12))',
        color: 'var(--spinly-fg-primary, #FFFFFF)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 900,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 150ms ease'
      }}
    >
      {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  )
}

/** Inline script that pre-applies theme before first paint to avoid FOUC. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`
