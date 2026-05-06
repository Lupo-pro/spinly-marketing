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
      // CTAs are hardcoded in the template now; we still pass the legacy
      // ctaPrimary/ctaSecondary fields if present so old carousels keep
      // their data round-trip but the template ignores them.
      const params = new URLSearchParams({
        question: slide.title,
        subtitle: slide.subtitle,
        pageNum
      })
      if (slide.cta_primary) params.set('ctaPrimary', slide.cta_primary)
      if (slide.cta_secondary) params.set('ctaSecondary', slide.cta_secondary)
      return `${APP_URL}/render/cierre?${params.toString()}`
    }

    case 'stat_bombe': {
      const params = new URLSearchParams({
        stat: slide.stat,
        label: slide.label,
        sub: slide.sub || '',
        pageNum
      })
      return `${APP_URL}/render/stat-bombe?${params.toString()}`
    }

    case 'visual_bg': {
      const params = new URLSearchParams({
        bgWord: slide.bgWord,
        titleLines: slide.titleLines,
        accentLine: String(slide.accentLine ?? 0),
        pageNum
      })
      return `${APP_URL}/render/visual-bg?${params.toString()}`
    }

    case 'timeline': {
      const params = new URLSearchParams({
        title: slide.title,
        steps: slide.steps,
        pageNum
      })
      return `${APP_URL}/render/timeline?${params.toString()}`
    }

    case 'question': {
      const params = new URLSearchParams({
        questionLines: slide.questionLines,
        sub: slide.sub || '',
        pageNum
      })
      return `${APP_URL}/render/question?${params.toString()}`
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
