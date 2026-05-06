import { anthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { getServerSupabase } from '@/lib/supabase/server'

// =============================================================================
// Types
// =============================================================================

export type SlideType = 'hook' | 'tesis' | 'senal' | 'resumen' | 'proof' | 'cierre'

export type Slide =
  | { n: number; type: 'hook'; title: string; subtitle?: string }
  | { n: number; type: 'tesis'; title: string; subtitle: string }
  | { n: number; type: 'senal'; number: string; title: string; body: string; question?: string }
  | {
      n: number
      type: 'resumen'
      title: string
      items: { number: string; title: string; subtitle: string }[]
    }
  | { n: number; type: 'proof'; title: string; stats: { value: string; label: string }[] }
  | {
      n: number
      type: 'cierre'
      title: string
      subtitle: string
      cta_primary: string
      cta_secondary?: string
    }

export interface GeneratedCarousel {
  slides: Slide[]
  caption: string
  hashtags: string[]
}

// =============================================================================
// Prompt système
// =============================================================================

const SYSTEM_PROMPT = `Tu es le content strategist de Spinly, plateforme SaaS B2B qui aide les PME LatAm (cafés, restaurants, salones, hôtels) à obtenir 6x plus de reseñas Google via gamification (roulette + QR code).

Proposition de valeur Spinly :
- 6x plus de reseñas Google vs sans Spinly
- 68% taux de participation des clients
- 30 jours d'essai gratuit
- À partir de 9 USD/mois
- Anti-MLM : pas de produits physiques, pas de recrutement obligatoire pour les vendedores

Ton :
- Espagnol LatAm neutre (Colombie/Mexique/Équateur)
- Tutoyer toujours
- Direct, provocant mais factuel
- Zéro jargon corporate (jamais "sinergias", "ecosistema", "transformación digital", "soluciones integrales")
- Pas d'émojis dans les slides (uniquement 👇 dans le caption si pertinent)
- Phrases courtes. Une idée par phrase.

Inspiration de format : carrousels minimalistes hook → tesis → 5 points numérotés → résumé → proof → CTA, sur fond noir avec accent couleur Spinly.`

const STRUCTURE_RULES = `Structure imposée du carrousel (10 slides) :

Slide 1 (HOOK) — Type "hook"
  - title : 5-12 mots, format "[Nombre] señales/razones/errores/verdades..." OU question provocatrice
  - subtitle (optionnel) : 5-10 mots de mise en bouche
  - CONVENTION ACCENT : entoure d'astérisques *MOT* le mot-clé du titre qui doit apparaître en couleur dégradée. Exemple : "5 señales de que tu agencia te está *estafando*"

Slide 2 (TESIS) — Type "tesis"
  - title : reformulation provocatrice du problème en 10-20 mots
  - subtitle : mise en contexte 1-2 phrases
  - CONVENTION ACCENT : 1 ou 2 astérisques *MOT* dans le titre. Exemple : "Una agencia que falla no siempre lo hace con *números malos*. Lo hace con los *números equivocados*."

Slides 3-7 (SEÑALES 01-05) — Type "senal"
  - number : "01" à "05" (toujours 2 caractères)
  - title : la señal en 4-8 mots, sans astérisques
  - body : 2-3 phrases d'explication
  - question (optionnel) : question rhétorique pour faire réagir

Slide 8 (RESUMEN) — Type "resumen"
  - title : "Las 5 señales que no puedes ignorar" ou variante
  - items : array des 5 señales avec number + title court (5-8 mots) + subtitle court (8-12 mots)

Slide 9 (PROOF) — Type "proof"
  - title : phrase de transition vers Spinly
  - stats : 3 chiffres clés Spinly. Utiliser uniquement les vrais chiffres :
    - "x6", "MÁS RESEÑAS GOOGLE"
    - "68%", "PARTICIPACIÓN CLIENTES"
    - "+150", "NEGOCIOS LATAM"
    - "30 días", "GRATIS"
    - "$9 USD/mes", "DESDE"
    Choisis 3 selon la pertinence par rapport à l'angle.

Slide 10 (CIERRE) — Type "cierre"
  - title : question d'engagement
  - subtitle : appel à l'action contextualisé
  - cta_primary : "Audita tu negocio gratis" → spinly.lat/audit
  - cta_secondary (optionnel) : "Guarda y comparte este post"

CAPTION (200-400 mots) :
- Reprend les 5 points en prose
- Hook engageant en première ligne
- Liste numérotée 01 → 05 avec micro-développement
- CTA final clair vers spinly.lat/audit
- Saut de ligne avant les hashtags (qui seront ajoutés séparément)

HASHTAGS (12-15) :
- Mix : reseñasGoogle, GoogleMaps, MarketingLocal, PymesLatam, EmprendedoresLatam
- 1-2 par pays cible (#PymesColombia, #PymesMexico, #PymesEcuador)
- 2-3 par secteur si pertinent à l'angle (#Cafeterias, #Restaurantes, #Peluquerías)`

// =============================================================================
// Génération
// =============================================================================

export async function generateCarousel(angle: {
  axis: string
  hook: string
  thesis: string
}): Promise<GeneratedCarousel> {
  const userPrompt = `Génère un carrousel Instagram pour Spinly basé sur cet angle :

AXE : ${angle.axis}
HOOK IMPOSÉ (peux le reformuler légèrement mais garder l'angle) : ${angle.hook}
THÈSE : ${angle.thesis}

${STRUCTURE_RULES}

Retourne UNIQUEMENT du JSON valide, sans markdown, sans \`\`\`, sans préambule. Format exact :

{
  "slides": [
    {"n": 1, "type": "hook", "title": "...", "subtitle": "..."},
    {"n": 2, "type": "tesis", "title": "...", "subtitle": "..."},
    {"n": 3, "type": "senal", "number": "01", "title": "...", "body": "...", "question": "..."},
    {"n": 4, "type": "senal", "number": "02", "title": "...", "body": "...", "question": "..."},
    {"n": 5, "type": "senal", "number": "03", "title": "...", "body": "...", "question": "..."},
    {"n": 6, "type": "senal", "number": "04", "title": "...", "body": "...", "question": "..."},
    {"n": 7, "type": "senal", "number": "05", "title": "...", "body": "...", "question": "..."},
    {"n": 8, "type": "resumen", "title": "...", "items": [{"number":"01","title":"...","subtitle":"..."}]},
    {"n": 9, "type": "proof", "title": "...", "stats": [{"value":"...","label":"..."}]},
    {"n": 10, "type": "cierre", "title": "...", "subtitle": "...", "cta_primary": "...", "cta_secondary": "..."}
  ],
  "caption": "...",
  "hashtags": ["#reseñasGoogle", "#PymesLatam"]
}`

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedCarousel

  if (!parsed.slides || parsed.slides.length !== 10) {
    throw new Error(`Expected 10 slides, got ${parsed.slides?.length}`)
  }
  if (!parsed.caption || parsed.caption.length < 100) {
    throw new Error('Caption too short')
  }
  if (!parsed.hashtags || parsed.hashtags.length < 8) {
    throw new Error('Not enough hashtags')
  }

  return parsed
}

// =============================================================================
// Sélection des angles à utiliser
// =============================================================================

export async function selectAnglesForGeneration(count: number = 4) {
  const supabase = getServerSupabase()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400_000).toISOString()

  // Fetch all eligible angles (the bank is small, ~50 rows). We need the full
  // pool so the per-axis balance below has something to diversify against —
  // limiting upfront breaks balance when many candidates share the same axis.
  const { data, error } = await supabase
    .from('ig_angles')
    .select('*')
    .eq('active', true)
    .or(`last_used_at.is.null,last_used_at.lt.${fourteenDaysAgo}`)
    .order('last_used_at', { ascending: true, nullsFirst: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  // Balance par axe : max 1 par axe par batch.
  const seen = new Set<string>()
  const selected: typeof data = []
  for (const angle of data) {
    if (selected.length >= count) break
    if (seen.has(angle.axis)) continue
    seen.add(angle.axis)
    selected.push(angle)
  }
  // Compléter si pas assez d'axes différents.
  for (const angle of data) {
    if (selected.length >= count) break
    if (!selected.includes(angle)) selected.push(angle)
  }

  return selected
}
