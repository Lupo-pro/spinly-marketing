import { anthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { getServerSupabase } from '@/lib/supabase/server'

// =============================================================================
// Types
// =============================================================================

export type ContentType = 'carousel' | 'single_post' | 'story'

export type SlideType =
  | 'hook'
  | 'tesis'
  | 'senal'
  | 'resumen'
  | 'proof'
  | 'cierre'
  | 'stat_bombe'
  | 'visual_bg'
  | 'timeline'
  | 'question'

// Standalone slide types eligible for single_post mode.
export const SINGLE_POST_TYPES = ['stat_bombe', 'question', 'tesis', 'visual_bg', 'hook'] as const
export type SinglePostType = (typeof SINGLE_POST_TYPES)[number]

// Story-only slide types (Phase 11). 1080×1920 vertical, never paginated.
export const STORY_TYPES = ['story_stat', 'story_question', 'story_teaser'] as const
export type StoryType = (typeof STORY_TYPES)[number]

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
      // CTAs are hardcoded on the rendered slide since Phase 8 (A. GUARDA ESTO +
      // B. AUDITÁ GRATIS). These fields kept optional to stay backward-compatible
      // with already-stored carousels generated before the rework.
      cta_primary?: string
      cta_secondary?: string
    }
  | { n: number; type: 'stat_bombe'; stat: string; label: string; sub?: string }
  | { n: number; type: 'visual_bg'; bgWord: string; titleLines: string; accentLine?: number }
  | { n: number; type: 'timeline'; title: string; steps: string }
  | { n: number; type: 'question'; questionLines: string; sub?: string }
  | {
      n: number
      type: 'story_stat'
      stat: string
      label: string
      sub?: string
      cta?: string
      ctaUrl?: string
    }
  | {
      n: number
      type: 'story_question'
      questionLines: string
      sub?: string
      cta?: string
      ctaUrl?: string
    }
  | { n: number; type: 'story_teaser'; title: string; teaserText?: string }

export interface GeneratedCarousel {
  slides: Slide[]
  caption: string
  hashtags: string[]
}

// Phase 10: Haiku now returns BOTH a carousel (10 slides) and a single_post
// (1 standalone slide reusing one of the 5 SINGLE_POST_TYPES). They share
// the caption + hashtags. The single_post is a *condensed synthesis* of the
// carousel — it must read on its own without referencing other slides.
export type SinglePostSlide =
  | { type: 'stat_bombe'; stat: string; label: string; sub?: string }
  | { type: 'question'; questionLines: string; sub?: string }
  | { type: 'tesis'; title: string; subtitle: string }
  | { type: 'visual_bg'; bgWord: string; titleLines: string; accentLine?: number }
  | { type: 'hook'; title: string; subtitle?: string }

// Phase 11: Haiku also returns a story slide (1080×1920 vertical, no
// pagination). Like single_post it shares caption+hashtags with the carousel.
export type StorySlide =
  | { type: 'story_stat'; stat: string; label: string; sub?: string; cta?: string; ctaUrl?: string }
  | {
      type: 'story_question'
      questionLines: string
      sub?: string
      cta?: string
      ctaUrl?: string
    }
  | { type: 'story_teaser'; title: string; teaserText?: string }

export interface GeneratedDraft {
  carousel: GeneratedCarousel
  // single_post and story are best-effort. If Haiku fails to produce one,
  // the pipeline still ships whatever's valid and logs a warning.
  single_post: SinglePostSlide | null
  story: StorySlide | null
  caption: string
  hashtags: string[]
}

// =============================================================================
// Prompt système
// =============================================================================

const SYSTEM_PROMPT = `Tu es le content strategist de Spinly, plateforme SaaS B2B qui aide les PME LatAm (cafés, restaurants, salones, hôtels) à obtenir 6x plus de reseñas Google via gamification (roulette + QR code).

═══════════════════════════════════════════════════════════════════
🎯 AUDIENCE — TU ÉCRIS UNIQUEMENT POUR DES DUEÑOS DE NEGOCIOS LOCALES

VERTICALES CIBLES (cite-les toujours par leur nom concret) :

PRIMAIRES (priorité haute) :
- Cafés, cafeterías, panaderías
- Restaurantes, pizzerías, parrilladas, asaderos
- Hoteles, hostales, posadas, glamping
- Spas, salones de belleza, barberías, peluquerías

SECONDAIRES (mentionne aussi pour varier) :
- Gimnasios, centros de fitness, estudios de yoga, crossfit
- Tiendas de barrio, boutiques, mini-mercados
- Clínicas dentales, consultorios médicos
- Talleres mecánicos, autolavados

GÉOGRAPHIE : LatAm — surtout Colombia, Ecuador, México, Perú.

⚠️ TU NE PARLES JAMAIS À :
- ❌ Los vendedores Spinly (ça c'est le webinaire/page séparée, pas Instagram)
- ❌ Los empleados o staff de los negocios
- ❌ Las agencias de marketing (sauf pour les attaquer du POV du dueño)
- ❌ Los clientes finales des cafés/restos (ce ne sont pas tes lecteurs)

⚠️ FRASES INTERDITES (NE GÉNÈRE JAMAIS) :
- "Por qué no logras vender Spinly"
- "Cómo cerrar más clientes para tu negocio Spinly"
- "Tu comisión / tu pipeline / tu pago / tu MRR como vendedor"
- "Recluta más vendedores"
- "Las agencias no quieren que tú [como vendedor]..."
- "Spinly te paga..." (quand tu parles à un vendeur)
- Toute référence aux commissions, paiements aux vendedores, recrutement

✅ FRASES À PRIVILÉGIER :
- "Tu cafetería pierde [X] reseñas cada mes"
- "Por qué tu restaurante bajó en Google Maps"
- "Lo que el spa de tu competencia hace que tú no haces"
- "Tu hotel tiene 4.2 estrellas. ¿Por qué aparece en página 3?"
- "Esto es lo que pasa cuando un cliente NO deja reseña en tu gym"
- "El error #1 que cometen los dueños de barberías con Google"

VARIE SIEMPRE le type de business mentionné dans le hook. Pas toujours
des cafés. Mélange : restaurante, hotel, spa, peluquería, gym, panadería,
parrilla, autolavado, boutique, etc.
═══════════════════════════════════════════════════════════════════

TON MIXTE — règle de variation selon le type de hook :

POUR LES HOOKS QUESTIONS / PROVOCATIONS / DIAGNOSTIC :
→ Tutoyement direct, parle au dueño en face
- "¿Cuándo fue la última vez que tu spa recibió reseña?"
- "Tu hotel tiene 4.5⭐ pero Google no te ve"
- "Por qué tu barbería pierde clientes cada noche"

POUR LES HOOKS STAT / DATA / RÉVÉLATION :
→ Voix professionnelle distante, comme un journaliste qui rapporte
- "El 78% de los restaurantes LatAm pierden reseñas cada mes"
- "Los cafés que dominan Google Maps tienen 1 cosa en común"
- "Datos de 150+ negocios revelan un patrón inesperado"

JAMAIS LES DEUX EN MÊME TEMPS dans le même hook.

Proposition de valeur Spinly (à intégrer dans les caps/proof, jamais en hook) :
- 6x plus de reseñas Google vs sans Spinly
- 68% taux de participation des clients
- 30 jours d'essai gratuit
- À partir de 9 USD/mois

Ton général :
- Espagnol LatAm neutre (Colombia/México/Ecuador)
- Tutoyer (cf. règle ton mixte ci-dessus)
- Direct, provocant mais factuel
- Zéro jargon corporate (jamais "sinergias", "ecosistema", "transformación digital", "soluciones integrales")
- Pas d'émojis dans les slides (uniquement 👇 dans le caption si pertinent)
- Phrases courtes. Une idée par phrase.

Inspiration de format : carrousels minimalistes hook → tesis → 5 points numérotés → résumé → proof → CTA, sur fond noir avec accent couleur Spinly.`

const STRUCTURE_RULES = `Structure du carrousel (10 slides). Tu disposes de 10 templates — varie pour créer du rythme visuel, ne reste pas bloqué sur la séquence "hook → 5 senales → resumen".

CONVENTION ACCENT (vaut pour TOUS les templates qui ont des champs textes) :
- Entoure un mot-clé d'astérisques *MOT* pour le mettre en couleur dégradée Spinly.
- Pour le HOOK : place *mot* à la FIN du titre (jamais au milieu — il passe sur une ligne séparée en gros).
- Pour les autres : 1-2 *mot* libres dans le texte, place-les naturellement.

TEMPLATES DISPONIBLES (10) :

1. **hook** — Slide d'accroche
   { "type": "hook", "title": "5 SEÑALES DE QUE TU AGENCIA TE ESTÁ *ESTAFANDO*", "subtitle": "Estas señales no mienten." }

2. **tesis** — Punchline qui pose la thèse, 1-2 mots accentués
   { "type": "tesis", "title": "El problema no son los *números malos*. Son los *números equivocados*.", "subtitle": "Estas son las 5 señales que debes conocer." }

3. **senal** — Argument numéroté (01-05)
   { "type": "senal", "number": "01", "title": "Solo te muestran resultados buenos", "body": "Una buena agencia te muestra TODO. Errores, pruebas, pérdidas.", "question": "¿Tu agencia te muestra los errores que cometió?" }

4. **resumen** — Récap des 5 points
   { "type": "resumen", "title": "Las 5 señales que no puedes ignorar.", "items": [{"number":"01","title":"...","subtitle":"..."}, ...x5] }

5. **proof** — 3 stats verticales (x6, 68%, +150, 30 días, $9 USD/mes)
   { "type": "proof", "title": "Spinly te da lo que tu agencia no.", "stats": [{"value":"x6","label":"MÁS RESEÑAS GOOGLE"}, {"value":"68%","label":"PARTICIPACIÓN CLIENTES"}, {"value":"+150","label":"NEGOCIOS LATAM"}] }

6. **cierre** — Slide finale OBLIGATOIRE en position 10. Les CTAs sont hardcodés (GUARDA + AUDITÁ), tu fournis juste la question + le sous-titre :
   { "type": "cierre", "title": "¿IDENTIFICASTE ALGUNA DE ESTAS 5 SEÑALES?", "subtitle": "Audita tu Google gratis. En 24 hs tienes el diagnóstico." }

7. **stat_bombe** — UN chiffre énorme + label + sub. Idéal slide 9 (avant cierre) ou en remplacement d'un proof.
   { "type": "stat_bombe", "stat": "x6", "label": "MÁS RESEÑAS\\nEN GOOGLE MAPS", "sub": "vs cafés sin Spinly" }
   - "stat" : court (3-5 caractères, ex "x6", "+150", "68%", "9$")
   - "label" : 1-2 lignes en MAJUSCULES, séparées par \\n
   - "sub" optionnel : phrase courte en bas

8. **visual_bg** — Mot répété en background + 3-4 lignes punch. Alternative à tesis ou hook puissant.
   { "type": "visual_bg", "bgWord": "RESEÑAS", "titleLines": "EL PROBLEMA|NO ES TU CAFÉ.|SON LAS RESEÑAS.", "accentLine": 2 }
   - "bgWord" : 1 seul mot court (max 12 caractères), MAJUSCULES
   - "titleLines" : 2 à 4 lignes séparées par |
   - "accentLine" : index 0-based de la ligne en dégradé (typiquement la dernière)

9. **timeline** — 3 à 5 étapes numérotées, idéal pour expliquer un process
   { "type": "timeline", "title": "CÓMO FUNCIONA|SPINLY EN *5 PASOS*.", "steps": "Tu cliente escanea el QR^en la mesa o en la barra|Juega la ruleta^y gana un premio real|Deja reseña Google^automáticamente|Recibe cupón^en su email|Tu negocio sube^en Google Maps" }
   - "title" : 1-2 lignes séparées par |, *mot* possible
   - "steps" : 3-5 étapes séparées par |, chaque étape "title^subtitle"

10. **question** — Énorme ? en background + question piercante
    { "type": "question", "questionLines": "¿CUÁNTAS|RESEÑAS PERDISTE|ESTE MES|SIN *PEDIRLAS*?", "sub": "Tu competencia las pidió.\\nTú no." }
    - "questionLines" : 2 à 5 lignes courtes séparées par |
    - "sub" optionnel : 1-2 lignes (séparées par \\n)

PATTERNS RECOMMANDÉS (choisis-en un selon l'angle, ou compose ton propre mix) :

PATTERN A — "Razones" classique (5 raisons numérotées)
1.hook 2.tesis 3-7.senal x5 8.resumen 9.stat_bombe 10.cierre

PATTERN B — "Pédagogique" (comment ça marche)
1.hook 2.question 3.tesis 4-6.senal x3 7.timeline 8.proof 9.visual_bg 10.cierre

PATTERN C — "Provocation"
1.question 2.visual_bg 3-5.senal x3 6.timeline 7.stat_bombe 8.tesis 9.proof 10.cierre

PATTERN D — "Mini-formation" (variété maximale, peu de senales)
1.hook 2.tesis 3.senal 4.visual_bg 5.senal 6.stat_bombe 7.timeline 8.senal 9.proof 10.cierre

RÈGLES :
- La slide 10 est TOUJOURS un cierre
- La slide 1 est généralement hook OU question (rôle d'accroche)
- Si tu utilises des senales, numérote 01,02,03... séquentiellement
- Évite 2 fois le même template d'affilée (sauf senales numérotées)
- bgWord (visual_bg) : 1 seul mot court, MAJUSCULES
- Reste 100% espagnol naturel LatAm. Pas d'anglicismes techniques

═══════════════════════════════════════════════════════════════════
PATRONES DE HOOKS — UTILISA UNA VARIEDAD MÁXIMA

Cada draft DEBE usar un patrón DIFERENTE del último draft del mismo angle.
Aquí están les 20 patrones disponibles. Rota entre ellos para evitar la
repetición.

CATÉGORIE A — STAT-DRIVEN (numéros qui choquent)
1. "[X]% de [cible] [verbe d'inaction]"
   → "78% de los cafés latam pierden reseñas cada mes"
2. "[Chiffre brut] [unité] después: [révélation]"
   → "150 cafés después. Esto es lo que tienen en común."
3. "[X] vs [Y]: la diferencia que [conséquence]"
   → "12 vs 87 reseñas: por qué tu competidor te gana"
4. "Tu [chose] vale [montant]. ¿Lo sabías?"
   → "Tu ficha Google vale $1,200/mes en clientes perdidos"

CATÉGORIE B — PROVOCATION (qui dérange)
5. "Tu [acteur interne] no es [accusation]. Es que [vraie raison]"
   → "Tu mesero no es vago. Es que nadie le explica los 5 miedos."
6. "El [mensonge classique] es mentira. Aquí está [vérité]"
   → "El '4.8 estrellas basta' es mentira. Aquí está lo que realmente importa."
7. "Si [situation actuelle], estás [conséquence négative]"
   → "Si pides reseñas verbalmente, estás regalando dinero a Google."
8. "[Catégorie de gens] no entienden [insight]"
   → "Los dueños de cafés no entienden cómo Google los penaliza"

CATÉGORIE C — COUNTER-INTUITIF (renverse la croyance)
9. "El problema nunca fue [X]. Es [Y]"
   → "El problema nunca fue tu café. Son las reseñas."
10. "Lo que pensabas: [X]. La realidad: [Y]"
    → "Pensabas que más reseñas = más estrellas. No. La recencia importa más."
11. "Más [chose] no es la solución. La solución es [autre chose]"
    → "Más publicidad no es la solución. Lo es más reseñas recientes."

CATÉGORIE D — QUESTION (interpelle directement)
12. "¿Cuántas [chose] [verbe] sin [action] este mes?"
    → "¿Cuántas reseñas perdiste sin pedirlas este mes?"
13. "¿Por qué [conséquence] aunque [contexte positif]?"
    → "¿Por qué bajas en Google aunque tienes 5 estrellas?"
14. "¿Cuándo fue la última vez que [action critique]?"
    → "¿Cuándo fue la última vez que un cliente te dejó reseña sin pedir?"
15. "¿Sabes [fait étonnant]?"
    → "¿Sabes que Google penaliza las reseñas viejas más que las negativas?"

CATÉGORIE E — RÉVÉLATION (insider knowledge)
16. "Lo que pasa cuando [scénario] (y tú no lo ves)"
    → "Lo que pasa cuando un cliente NO deja reseña (y tú no lo sabes)"
17. "El secreto [adjectif] de [cible qui réussit]"
    → "El secreto incómodo de los cafés que dominan Google Maps"
18. "[Tendance/changement] que casi nadie notó"
    → "El cambio de Google Maps de febrero que casi nadie notó"

CATÉGORIE F — PROMESSE (résultat concret)
19. "[X] cosas que [cible] puede [résultat] hoy mismo"
    → "3 cosas que tu negocio puede automatizar con IA hoy mismo"
20. "Cómo pasar de [état initial] a [état désiré] en [délai]"
    → "Cómo pasar de 23 a 90 reseñas en 60 días sin pedir nada"

REGLA CRUCIAL :
- Si el campo \`recent_hooks\` está presente en el contexto, mira los patrones
  que cada uno utilizaba.
- Para tu nuevo hook, elige un patrón DIFERENTE de los recent_hooks.
- Si por algún motivo necesitas reusar un patrón (4+ posts du même axe),
  reutilízalo en último recurso.

VARIA AUSSI :
- Los números : 3, 5, 7, 12, 30, 68%, 78%, x6, 150, 12,847. Pas toujours 5.
- Las cifras hipotéticas vs cifras Spinly réels
- Las longueurs : courte (5 mots) vs longue (12+ mots)
- L'emoji : 0 ou 1 max, jamais en début
═══════════════════════════════════════════════════════════════════

CAPTION (200-400 mots) :
- Hook engageant en première ligne
- Reprend les points clés en prose (numérotation possible si applicable)
- CTA final clair vers spinly.lat/audit
- Saut de ligne avant les hashtags

HASHTAGS (12-15) :
- Mix : reseñasGoogle, GoogleMaps, MarketingLocal, PymesLatam, EmprendedoresLatam
- 1-2 par pays cible (#PymesColombia, #PymesMexico, #PymesEcuador)
- 2-3 par secteur si pertinent (#Cafeterias, #Restaurantes, #Peluquerías)`

// =============================================================================
// Génération
// =============================================================================

// Phase 19.5 — pick a single_post / story template that is under-used for the
// given axis, so we don't keep getting `stat_bombe` on every google_algo post
// or `story_question` on every anti_agencias post. Scans the last 20 published
// posts of the axis, picks the slide-type with the lowest count (random tie-
// break). Cheap query (1 row scan, axis bank is small).
export async function pickUnderusedTemplates(axis: string): Promise<{
  singlePostType: SinglePostType
  storyType: StoryType
}> {
  const supabase = getServerSupabase()
  const { data } = await supabase
    .from('ig_posts')
    .select('content_type, slides_json, ig_angles!inner(axis)')
    .eq('ig_angles.axis', axis)
    .order('generated_at', { ascending: false })
    .limit(20)

  const singleCounts: Record<string, number> = {}
  const storyCounts: Record<string, number> = {}
  for (const p of data ?? []) {
    const slides = Array.isArray(p.slides_json) ? p.slides_json : []
    const t = (slides[0] as { type?: string } | undefined)?.type
    if (!t) continue
    if (
      p.content_type === 'single_post' &&
      (SINGLE_POST_TYPES as readonly string[]).includes(t)
    ) {
      singleCounts[t] = (singleCounts[t] ?? 0) + 1
    } else if (
      p.content_type === 'story' &&
      (STORY_TYPES as readonly string[]).includes(t)
    ) {
      storyCounts[t] = (storyCounts[t] ?? 0) + 1
    }
  }

  const pickLeast = <T extends string>(
    types: readonly T[],
    counts: Record<string, number>
  ): T => {
    const min = Math.min(...types.map((t) => counts[t] ?? 0))
    const candidates = types.filter((t) => (counts[t] ?? 0) === min)
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  return {
    singlePostType: pickLeast(SINGLE_POST_TYPES, singleCounts),
    storyType: pickLeast(STORY_TYPES, storyCounts)
  }
}

export interface GenerateDraftOptions {
  // When set, force Haiku to use these template types for the standalone
  // single_post / story slide. Used by the cron to break per-axis
  // template lock-in (Phase 19.5).
  preferSinglePostType?: SinglePostType
  preferStoryType?: StoryType
}

export async function generateDraft(
  angle: {
    axis: string
    hook: string
    thesis: string
  },
  options: GenerateDraftOptions = {}
): Promise<GeneratedDraft> {
  // Phase 17 — fetch the last 3 hooks of the same axis so Haiku knows which
  // patterns to avoid. Best-effort: any DB error or missing column degrades
  // silently to "no recent_hooks context" and we generate normally.
  let recentHooksBlock = ''
  try {
    const supabase = getServerSupabase()
    const { data: recentDrafts } = await supabase
      .from('ig_posts')
      .select('caption, slides_json, ig_angles!inner(axis)')
      .eq('ig_angles.axis', angle.axis)
      .order('generated_at', { ascending: false })
      .limit(3)

    const recentHooks = (recentDrafts ?? [])
      .map((d) => {
        // Prefer the actual hook slide title; fall back to first caption line.
        const slides = Array.isArray(d.slides_json) ? d.slides_json : []
        const hookSlide = slides.find(
          (s: unknown) =>
            typeof s === 'object' &&
            s !== null &&
            (s as { type?: string }).type === 'hook'
        ) as { title?: string } | undefined
        const fromSlide = hookSlide?.title?.trim()
        const fromCaption = d.caption?.split('\n')[0]?.trim()
        return (fromSlide || fromCaption || '').slice(0, 160)
      })
      .filter((h) => h.length > 0)

    if (recentHooks.length > 0) {
      recentHooksBlock =
        `\n\n## HOOKS RÉCENTS DE CET ANGLE (${angle.axis}) — NE REPRENDS PAS LE MÊME PATTERN\n` +
        recentHooks.map((h, i) => `${i + 1}. "${h}"`).join('\n') +
        `\n\nIdentifica el patrón (de los 20 patrones del system prompt) que cada uno usaba, y elige otro patrón para tu nuevo hook.\n`
    }
  } catch (err) {
    console.warn(
      '[generator] recent_hooks fetch failed, generating without context:',
      err instanceof Error ? err.message : err
    )
  }

  // Phase 19.5 — template rotation hint. If the cron pre-picked a least-used
  // template type for this axis, we inject it here as an OVERRIDE so Haiku
  // stops defaulting to stat_bombe / story_question on every post.
  const templateOverrideBlock =
    options.preferSinglePostType || options.preferStoryType
      ? `\n\n## TEMPLATES IMPOSÉS POUR CETTE GÉNÉRATION (rotation pour cet axe)\n` +
        (options.preferSinglePostType
          ? `- single_post.type DOIT être "${options.preferSinglePostType}" (sous-utilisé pour cet axe).\n`
          : '') +
        (options.preferStoryType
          ? `- story.type DOIT être "${options.preferStoryType}" (sous-utilisé pour cet axe).\n`
          : '') +
        `Adapte le contenu à ces templates ; n'override PAS la consigne.\n`
      : ''

  const userPrompt = `Génère un carrousel Instagram pour Spinly basé sur cet angle :

AXE : ${angle.axis}
HOOK IMPOSÉ (peux le reformuler légèrement mais garder l'angle) : ${angle.hook}
THÈSE : ${angle.thesis}${recentHooksBlock}${templateOverrideBlock}

${STRUCTURE_RULES}

Retourne UNIQUEMENT du JSON valide, sans markdown, sans \`\`\`, sans préambule. Choisis le PATTERN le plus pertinent pour cet angle (A/B/C/D ou ton propre mix), n'utilise PAS forcément 5 senales d'affilée — varie pour créer du rythme visuel.

Format exemple (PATTERN B avec mix de templates + single_post stat_bombe — adapte selon ton angle) :

{
  "carousel": {
    "slides": [
      {"n": 1, "type": "hook", "title": "Tu mesero no pide reseñas. Aquí *5 razones*", "subtitle": "Y la solución no es darle un bonus."},
      {"n": 2, "type": "question", "questionLines": "¿CUÁNTAS|RESEÑAS PERDISTE|ESTE MES|SIN *PEDIRLAS*?", "sub": "Tu competencia las pidió.\\nTú no."},
      {"n": 3, "type": "tesis", "title": "El problema no es tu *equipo*. Es la *fricción*.", "subtitle": "Pedir reseñas a viva voz no escala. Hay que automatizar."},
      {"n": 4, "type": "senal", "number": "01", "title": "Le da pena pedir", "body": "El mesero se siente mendigo cuando pide una reseña.", "question": "¿Tu equipo se siente cómodo pidiéndolas?"},
      {"n": 5, "type": "senal", "number": "02", "title": "Olvida en 30 segundos", "body": "Pide la reseña al final del servicio. Cliente promete y olvida.", "question": ""},
      {"n": 6, "type": "senal", "number": "03", "title": "No tiene incentivo", "body": "El mesero no gana nada cuando una reseña llega.", "question": ""},
      {"n": 7, "type": "timeline", "title": "CÓMO FUNCIONA|SPINLY EN *5 PASOS*.", "steps": "Cliente escanea QR^en la mesa|Juega la ruleta^y gana un premio|Deja reseña^automáticamente|Recibe cupón^en su email|Tu negocio sube^en Google Maps"},
      {"n": 8, "type": "stat_bombe", "stat": "68%", "label": "DE TUS CLIENTES\\nDEJARÁN RESEÑA", "sub": "si gamificas la experiencia"},
      {"n": 9, "type": "visual_bg", "bgWord": "RESEÑAS", "titleLines": "150 NEGOCIOS LATAM|YA MULTIPLICAN|*x6* SUS RESEÑAS.", "accentLine": 2},
      {"n": 10, "type": "cierre", "title": "¿Tu mesero todavía pide reseñas a viva voz?", "subtitle": "Audita tu Google gratis. En 24 hs tienes el diagnóstico."}
    ]
  },
  "single_post": {
    "type": "stat_bombe",
    "stat": "68%",
    "label": "DE TUS CLIENTES\\nDEJARÁN RESEÑA",
    "sub": "si gamificas la experiencia · spinly.lat"
  },
  "story": {
    "type": "story_teaser",
    "title": "TU MESERO NO PIDE|RESEÑAS. AQUÍ|*5 RAZONES*.",
    "teaserText": "El post completo en mi feed."
  },
  "caption": "...",
  "hashtags": ["#reseñasGoogle", "#PymesLatam"]
}

IMPORTANT : la slide 10 est TOUJOURS de type "cierre". Les CTAs sont hardcodés (A. GUARDA ESTO + B. AUDITÁ GRATIS) — tu fournis juste title + subtitle.

PHASE 10 — TU DOIS AUSSI GÉNÉRER UN single_post :

En plus du carrousel, tu génères 1 SLIDE STANDALONE qui résume l'angle de manière condensée. Ce single_post sera publié SEUL sur Instagram (pas dans un carrousel) — il doit donc être COMPRIS sans contexte.

Choisis 1 type parmi ces 5 selon ce qui colle le mieux à l'angle :
- "stat_bombe" si tu as une stat forte (x6, +150, 68%, 30 días, $9 USD/mes)
- "question" si l'angle est provocant
- "tesis" si tu as une punchline qui se suffit
- "visual_bg" si tu veux un effet visuel maximum
- "hook" si le hook du carrousel se tient seul

Mêmes champs que dans le carrousel (sauf que pas de "n" puisque c'est 1 slide). Pas de référence "voir slide X" ou "détails plus loin".

PHASE 11 — TU DOIS AUSSI GÉNÉRER UNE story (1080×1920 verticale) :

3 templates story dispos :

1. **story_stat** — Chiffre énorme + label + CTA en bas
   { "type": "story_stat", "stat": "x6", "label": "MÁS RESEÑAS\\nEN GOOGLE", "sub": "vs cafés sin Spinly", "cta": "audita gratis", "ctaUrl": "spinly.lat/audit" }
   - "stat" court (3-5 caractères)
   - "label" 1-2 lignes en MAJUSCULES, séparées par \\n
   - "sub" optionnel, "cta"/"ctaUrl" optionnels (défaut "audita gratis" / "spinly.lat/audit")

2. **story_question** — Question piercante + énorme ? en background + CTA
   { "type": "story_question", "questionLines": "¿CUÁNTAS|RESEÑAS PERDISTE|SIN *PEDIRLAS*?", "sub": "Tu competencia las pidió. Tú no.", "cta": "audita gratis", "ctaUrl": "spinly.lat/audit" }
   - "questionLines" 2-5 lignes courtes séparées par |, *mot* possible

3. **story_teaser** — Annonce le post du feed avec flèche "ver en el feed"
   { "type": "story_teaser", "title": "TU MESERO NO PIDE|RESEÑAS. AQUÍ|*5 RAZONES*.", "teaserText": "El post completo en mi feed." }
   - "title" max 4 lignes séparées par |, *mot* accentué
   - Pas de CTA — le but est de driver vers le feed

RÈGLES STORY :
- 3 sec d'attention max sur Instagram → phrases ULTRA courtes
- Choisis le type selon l'angle :
  - story_stat si tu as une stat qui parle seule (x6, +150, 68%)
  - story_question si tu veux interpeller (provocation)
  - story_teaser pour driver vers le post du feed (recommandé 1 fois sur 2)
- La story est COMPLÉMENTAIRE au carousel et au single_post — pas une copie

FORMAT JSON FINAL (carousel + single_post + story + caption + hashtags) :

{
  "carousel": { "slides": [...10 slides...] },
  "single_post": { "type": "...", ... },
  "story": { "type": "...", ... },
  "caption": "...",
  "hashtags": ["#...", "#..."]
}

Tous partagent les MÊMES caption et hashtags (pas besoin de les répéter).`

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedDraft> & {
    slides?: Slide[] // legacy shape support
  }

  // Carousel: required, must be 10 slides. Accept both new shape (carousel.slides)
  // and legacy flat shape ({slides: [...]}) so a stale Haiku response still works.
  const carouselSlides = parsed.carousel?.slides ?? parsed.slides
  if (!carouselSlides || carouselSlides.length !== 10) {
    throw new Error(`Expected 10 carousel slides, got ${carouselSlides?.length ?? 0}`)
  }
  if (!parsed.caption || parsed.caption.length < 100) {
    throw new Error('Caption too short')
  }
  if (!parsed.hashtags || parsed.hashtags.length < 8) {
    throw new Error('Not enough hashtags')
  }

  // single_post: best-effort. If Haiku omits it or returns an invalid type,
  // we keep the carousel and ship single_post=null — the cron will skip the
  // second insert and just create the carousel.
  let singlePost: SinglePostSlide | null = null
  if (parsed.single_post && parsed.single_post.type) {
    const t = parsed.single_post.type
    if ((SINGLE_POST_TYPES as readonly string[]).includes(t)) {
      singlePost = parsed.single_post as SinglePostSlide
    } else {
      console.warn(`[generator] single_post type "${t}" not in SINGLE_POST_TYPES, skipping`)
    }
  }

  // story: same best-effort pattern as single_post.
  let story: StorySlide | null = null
  if (parsed.story && parsed.story.type) {
    const t = parsed.story.type
    if ((STORY_TYPES as readonly string[]).includes(t)) {
      story = parsed.story as StorySlide
    } else {
      console.warn(`[generator] story type "${t}" not in STORY_TYPES, skipping`)
    }
  }

  return {
    carousel: {
      slides: carouselSlides,
      caption: parsed.caption,
      hashtags: parsed.hashtags
    },
    single_post: singlePost,
    story,
    caption: parsed.caption,
    hashtags: parsed.hashtags
  }
}

// =============================================================================
// Sélection des angles à utiliser
// =============================================================================

// When all active angles of an axis have been used at least this many times,
// we reactivate previously deactivated angles for that axis to inject fresh
// hooks into the rotation. Tweak based on bank growth / generation cadence.
const REACTIVATION_THRESHOLD = 2

export async function selectAnglesForGeneration(count: number = 4) {
  const supabase = getServerSupabase()

  // Bank is small (~100 rows). Fetch everything so we can compute per-axis
  // exhaustion and reactivate inactives ourselves before selecting.
  const { data: all, error } = await supabase.from('ig_angles').select('*')
  if (error) throw error
  if (!all || all.length === 0) return []

  // Per-axis exhaustion check : if an axis has no active angle, OR all its
  // active angles have used_count >= threshold, flip its inactive angles back
  // on so the rotation keeps producing fresh content instead of looping.
  const minUsedActiveByAxis = new Map<string, number>()
  const inactiveIdsByAxis = new Map<string, string[]>()
  for (const a of all) {
    if (a.active) {
      const used = a.used_count ?? 0
      const cur = minUsedActiveByAxis.get(a.axis)
      if (cur === undefined || used < cur) minUsedActiveByAxis.set(a.axis, used)
    } else {
      const arr = inactiveIdsByAxis.get(a.axis) ?? []
      arr.push(a.id)
      inactiveIdsByAxis.set(a.axis, arr)
    }
  }

  const idsToReactivate: string[] = []
  inactiveIdsByAxis.forEach((ids, axis) => {
    const minUsed = minUsedActiveByAxis.get(axis)
    if (minUsed === undefined || minUsed >= REACTIVATION_THRESHOLD) {
      idsToReactivate.push(...ids)
    }
  })
  if (idsToReactivate.length > 0) {
    const { error: reactErr } = await supabase
      .from('ig_angles')
      .update({ active: true })
      .in('id', idsToReactivate)
    if (reactErr) {
      console.warn('[selectAngles] reactivation failed:', reactErr.message)
    } else {
      for (const a of all) if (idsToReactivate.includes(a.id)) a.active = true
    }
  }

  // Sort eligible (active) by used_count ASC, then last_used_at ASC (nulls
  // first — never-used angles win). This is the rotation priority.
  const eligible = all
    .filter((a) => a.active)
    .sort((a, b) => {
      const u = (a.used_count ?? 0) - (b.used_count ?? 0)
      if (u !== 0) return u
      const at = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
      const bt = b.last_used_at ? new Date(b.last_used_at).getTime() : 0
      return at - bt
    })

  // Max 1 angle per axis per batch.
  const seenAxis = new Set<string>()
  const selected: typeof eligible = []
  for (const angle of eligible) {
    if (selected.length >= count) break
    if (seenAxis.has(angle.axis)) continue
    seenAxis.add(angle.axis)
    selected.push(angle)
  }
  // Fallback : si moins d'axes différents que count, on tolère le doublon
  // (préserve le comportement existant — préférence stricte = sortir vide).
  for (const angle of eligible) {
    if (selected.length >= count) break
    if (!selected.includes(angle)) selected.push(angle)
  }

  return selected
}
