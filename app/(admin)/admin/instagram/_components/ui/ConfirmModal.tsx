'use client'

import { useEffect, ReactNode } from 'react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default'
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const confirmBg =
    variant === 'destructive' ? 'var(--spinly-error)' : 'var(--spinly-gradient-cta)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--spinly-bg-base)',
          border: '1px solid var(--spinly-border-default)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 440,
          width: '100%',
          color: 'var(--spinly-fg-primary)'
        }}
      >
        <h2 id="confirm-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>
          {title}
        </h2>
        <div
          style={{
            fontSize: 13,
            color: 'var(--spinly-fg-muted)',
            margin: 0,
            marginBottom: 24,
            lineHeight: 1.5
          }}
        >
          {description}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: 'var(--spinly-bg-elevated)',
              border: '1px solid var(--spinly-border-default)',
              color: 'var(--spinly-fg-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              minHeight: 44
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: confirmBg,
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              minHeight: 44
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
