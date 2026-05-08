'use client'

import { useEffect, useState } from 'react'
import { useGlobalShortcuts, GLOBAL_SHORTCUTS_HELP } from '../_hooks/useGlobalShortcuts'
import { SPINLY_BRAND } from '../_styles/brand'

export function GlobalShortcuts() {
  useGlobalShortcuts()
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (target.isContentEditable) return
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }
      if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [helpOpen])

  return (
    <>
      <button
        type="button"
        aria-label="Afficher les raccourcis clavier"
        onClick={() => setHelpOpen((v) => !v)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: SPINLY_BRAND.bg.surface,
          border: `1px solid ${SPINLY_BRAND.border.default}`,
          color: SPINLY_BRAND.text.secondary,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 900,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        ?
      </button>

      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-help-title"
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: SPINLY_BRAND.bg.base,
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              borderRadius: 16,
              padding: 28,
              maxWidth: 420,
              width: '100%',
              color: SPINLY_BRAND.text.primary
            }}
          >
            <h2
              id="shortcuts-help-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                marginBottom: 16,
                fontFamily: 'var(--font-display)'
              }}
            >
              Raccourcis clavier
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {GLOBAL_SHORTCUTS_HELP.map((s) => (
                <li
                  key={s.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: SPINLY_BRAND.bg.surface,
                    borderRadius: 8,
                    border: `1px solid ${SPINLY_BRAND.border.default}`
                  }}
                >
                  <span style={{ fontSize: 13, color: SPINLY_BRAND.text.primary }}>{s.label}</span>
                  <kbd
                    style={{
                      fontFamily: 'var(--font-geist-mono), monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 8px',
                      background: SPINLY_BRAND.bg.surfaceHover,
                      border: `1px solid ${SPINLY_BRAND.border.hover}`,
                      borderRadius: 6,
                      color: SPINLY_BRAND.text.primary,
                      minWidth: 24,
                      textAlign: 'center'
                    }}
                  >
                    {s.key}
                  </kbd>
                </li>
              ))}
            </ul>
            <p
              style={{
                fontSize: 11,
                color: SPINLY_BRAND.text.tertiary,
                marginTop: 16,
                marginBottom: 0,
                textAlign: 'center'
              }}
            >
              Désactivés dans les champs de saisie. Échap pour fermer.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
