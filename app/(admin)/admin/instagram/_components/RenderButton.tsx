'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { renderPostAction } from '../actions'
import { SPINLY_BRAND } from '../_styles/brand'

export default function RenderButton({
  postId,
  hasUrls
}: {
  postId: string
  hasUrls: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [hover, setHover] = useState(false)

  function handleClick() {
    setError('')
    startTransition(async () => {
      try {
        const result = await renderPostAction(postId)
        if (result.errors && result.errors.length > 0) {
          setError(`${result.errors.length} slide(s) ont échoué`)
        }
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: '10px 16px',
          background: SPINLY_BRAND.gradientWarm,
          color: '#FFFFFF',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.4 : hover ? 0.9 : 1,
          minHeight: 44,
          transition: 'opacity 0.15s ease'
        }}
      >
        {isPending ? 'Rendu en cours…' : hasUrls ? 'Re-render slides' : 'Render slides'}
      </button>
      {error && (
        <p
          style={{
            color: SPINLY_BRAND.status.failed.fg,
            fontSize: 13,
            marginTop: 8
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
