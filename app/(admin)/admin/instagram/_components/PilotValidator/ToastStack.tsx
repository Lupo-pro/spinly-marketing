import type { Toast } from './types'

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(74, 222, 128, 0.95)',
            color: '#FFF',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            lineHeight: 1.4
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
