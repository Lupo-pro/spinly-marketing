import type { Slide } from './generator'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'

export function slideToTemplateUrl(slide: Slide): string {
  const pageNum = String(slide.n).padStart(2, '0')

  switch (slide.type) {
    case 'hook': {
      const { mainTitle, accent } = extractAccent(slide.title)
      const params = new URLSearchParams({
        title: mainTitle,
        titleAccent: accent,
        subtitle: slide.subtitle || '',
        pageNum
      })
      return `${APP_URL}/render/hook?${params.toString()}`
    }

    case 'tesis': {
      const parts = parseTesisTitle(slide.title)
      const params = new URLSearchParams({
        ...parts,
        subtitle: slide.subtitle || '',
        watermark: extractWatermarkFromTesis(slide.title),
        pageNum
      })
      return `${APP_URL}/render/tesis?${params.toString()}`
    }

    case 'senal': {
      const params = new URLSearchParams({
        number: slide.number,
        title: slide.title,
        body: slide.body,
        question: slide.question || '',
        pageNum
      })
      return `${APP_URL}/render/senal?${params.toString()}`
    }

    case 'resumen': {
      const params = new URLSearchParams({
        title: slide.title,
        items: JSON.stringify(slide.items),
        pageNum
      })
      return `${APP_URL}/render/resumen?${params.toString()}`
    }

    case 'proof': {
      const params = new URLSearchParams({
        title: slide.title,
        stats: JSON.stringify(slide.stats),
        pageNum
      })
      return `${APP_URL}/render/proof?${params.toString()}`
    }

    case 'cierre': {
      const params = new URLSearchParams({
        question: slide.title,
        subtitle: slide.subtitle,
        ctaPrimary: slide.cta_primary,
        ctaSecondary: slide.cta_secondary || '',
        pageNum
      })
      return `${APP_URL}/render/cierre?${params.toString()}`
    }
  }
}

function extractAccent(title: string): { mainTitle: string; accent: string } {
  // Convention: *MOT* should appear in gradient color.
  const match = title.match(/^(.*?)\s*\*([^*]+)\*\s*(.*)$/)
  if (match) {
    return {
      mainTitle: (match[1] + ' ' + match[3]).trim(),
      accent: match[2].trim()
    }
  }
  return { mainTitle: title, accent: '' }
}

function parseTesisTitle(title: string) {
  const parts = title.split(/\*([^*]+)\*/g)
  return {
    titlePart1: parts[0] ?? title,
    titleAccent1: parts[1] ?? '',
    titlePart2: parts[2] ?? '',
    titleAccent2: parts[3] ?? '',
    titlePart3: parts[4] ?? ''
  }
}

function extractWatermarkFromTesis(title: string): string {
  const match = title.match(/\*([^*]+)\*/)
  if (match) return match[1].toUpperCase()
  return 'AGENCIA'
}
