import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Angle = { axis: string; hook: string; thesis: string }

const ANGLES: Angle[] = [
  // ─── anti_agencias (12) ────────────────────────────────────────────────
  {
    axis: 'anti_agencias',
    hook: '5 señales de que tu agencia de reseñas te está estafando',
    thesis:
      'Las agencias venden reseñas falsas que Google detecta y elimina. El comerciante paga, no ve resultados, y a veces pierde su ficha completa. La única vía sostenible es generar reseñas reales de clientes reales.'
  },
  {
    axis: 'anti_agencias',
    hook: 'Tu agencia cobra 500.000 al mes. Esto es lo que realmente hace',
    thesis:
      'Spam de mensajes a tus clientes pidiendo reseñas, plantillas genéricas que Google detecta como artificiales, y ningún sistema medible de captación.'
  },
  {
    axis: 'anti_agencias',
    hook: 'Por qué Google está borrando todas las reseñas que te vendieron',
    thesis:
      'Desde 2024 el algoritmo detecta patrones de cuentas falsas, IPs sospechosas y timing irregular. Las reseñas compradas se borran masivamente.'
  },
  {
    axis: 'anti_agencias',
    hook: 'La razón real por la que tu agencia no te muestra el costo por reseña',
    thesis:
      'Si supieras que cada reseña te cuesta 15 dólares y muchas son borradas en 30 días, cancelarías el contrato mañana.'
  },
  {
    axis: 'anti_agencias',
    hook: '3 mentiras que tu agencia de marketing local te dijo este mes',
    thesis:
      'Las agencias venden ranking, no resultados. Cada métrica que te muestran (alcance, impresiones, CTR) es de vanidad si no se traduce en clientes nuevos contables.'
  },
  {
    axis: 'anti_agencias',
    hook: 'El truco que usa tu agencia para inflar el reporte mensual',
    thesis:
      'Mezclan datos orgánicos preexistentes con su trabajo, comparan con la peor semana del mes anterior, y omiten el costo por adquisición real.'
  },
  {
    axis: 'anti_agencias',
    hook: 'Cuánto te cuesta realmente cada reseña que te trae tu agencia',
    thesis:
      'Divide lo que pagas mensualmente por las reseñas verificables nuevas. Casi siempre el costo unitario es 10x mayor a lo que esperabas.'
  },
  {
    axis: 'anti_agencias',
    hook: 'Por qué tu agencia te oculta los borrados de Google',
    thesis:
      'Google envía un email cuando elimina reseñas sospechosas, pero tu agencia no te lo dice. Pide acceso de propietario a tu ficha y revisa el historial.'
  },
  {
    axis: 'anti_agencias',
    hook: 'El día que despedí a mi agencia y multipliqué por 6 mis reseñas',
    thesis:
      'Caso real de un café en Bogotá: pasó de pagar 800.000/mes a una agencia con 4 reseñas nuevas/mes, a generar 30 reseñas reales/mes con un sistema de ruleta.'
  },
  {
    axis: 'anti_agencias',
    hook: 'Lo que pasa cuando reportas a tu agencia a Google por fraude',
    thesis:
      'Google puede penalizar tu ficha si detecta que pagaste por reseñas falsas, incluso si fue tu agencia quien las generó. La responsabilidad cae sobre ti como propietario.'
  },
  {
    axis: 'anti_agencias',
    hook: '5 preguntas incómodas que tu agencia no quiere responder',
    thesis:
      '¿Cuánto cuesta cada reseña? ¿Cuántas borró Google este mes? ¿Cuál es el ROAS real? ¿Por qué cambias creativos sin avisar? ¿Garantizas resultados o cobras igual?'
  },
  {
    axis: 'anti_agencias',
    hook: 'Por qué cancelar tu agencia de reseñas te ahorra 10x más de lo que crees',
    thesis:
      'Sumando el costo mensual, las reseñas borradas, el riesgo de penalización Google y el tiempo perdido en reuniones inútiles, el ahorro real es enorme.'
  },

  // ─── google_algo (8) ───────────────────────────────────────────────────
  {
    axis: 'google_algo',
    hook: 'El cambio del algoritmo de Google Maps que casi nadie notó',
    thesis:
      'En 2025 Google empezó a priorizar la frescura de las reseñas (últimos 90 días) sobre la cantidad total. Si llevas un año sin reseñas nuevas, ya no apareces.'
  },
  {
    axis: 'google_algo',
    hook: 'Por qué tu competidor con menos reseñas aparece antes que tú en Google',
    thesis:
      '3 factores que Google pondera: frescura, diversidad de palabras clave en las reseñas, y tasa de respuesta del propietario. La cantidad cruda no manda.'
  },
  {
    axis: 'google_algo',
    hook: 'Las 3 métricas que Google realmente mide en tu ficha',
    thesis:
      'Click-to-call, click-to-direction, click-to-website. Si las reseñas no se traducen en estas acciones, Google las considera ruido.'
  },
  {
    axis: 'google_algo',
    hook: 'Por qué tu ficha de Google bajó de ranking sin que cambiara nada',
    thesis:
      'Google reindexa cada 4-6 semanas. Si dejas de recibir reseñas nuevas, tu posición cae automáticamente, aunque las antiguas sigan ahí.'
  },
  {
    axis: 'google_algo',
    hook: 'El detalle que Google detecta cuando alguien deja una reseña falsa',
    thesis:
      'Mismo dispositivo, misma red WiFi, cuentas creadas en los últimos 30 días, y patrones de escritura repetitivos. Todo eso es flag automático.'
  },
  {
    axis: 'google_algo',
    hook: 'La frecuencia ideal de reseñas nuevas según el tamaño de tu negocio',
    thesis:
      'Para un café de barrio: 2-4 reseñas/semana. Para un restaurante: 5-8/semana. Menos de eso y pierdes ranking. Más de eso sin tráfico real, te marcan como sospechoso.'
  },
  {
    axis: 'google_algo',
    hook: 'Por qué responder a tus reseñas mejora tu ranking más que pedirlas',
    thesis:
      'Google considera la tasa de respuesta como una señal de actividad del propietario. Responder al 80% de tus reseñas vale más que pedir 50 reseñas nuevas y no responder ninguna.'
  },
  {
    axis: 'google_algo',
    hook: 'El error que matará tu ficha de Google en 2026',
    thesis:
      'Comprar paquetes de reseñas en Fiverr o agencias con cuentas asiáticas. Google ha mejorado su detección y borra masivamente desde marzo 2026.'
  },

  // ─── pme_pain (10) ─────────────────────────────────────────────────────
  {
    axis: 'pme_pain',
    hook: 'Por qué tus clientes felices no dejan reseñas (y cómo solucionarlo)',
    thesis:
      'El 80% de las reseñas se dejan por enojo. Los clientes felices no piensan en reseñas porque su experiencia fue normal/buena, no excepcional. Hay que crear el momento.'
  },
  {
    axis: 'pme_pain',
    hook: 'El error #1 que cometen los cafés cuando piden reseñas',
    thesis:
      'Pedirlas verbalmente al final del servicio. Genera incomodidad, el cliente promete y olvida en 30 segundos. La fricción mata la conversión.'
  },
  {
    axis: 'pme_pain',
    hook: '5 razones por las que tu mesero no quiere pedir reseñas',
    thesis:
      'Le da pena, se siente mendigo, no le pagan por eso, no entiende el beneficio para él, y cree que fastidia al cliente. Resultado: 0 reseñas pedidas.'
  },
  {
    axis: 'pme_pain',
    hook: 'La verdad incómoda sobre pedir reseñas en la cuenta o el ticket',
    thesis:
      'El QR genérico en el ticket convierte 0.3%. Sin gamificación, sin incentivo, sin urgencia, no funciona. La gente lo ve y sigue.'
  },
  {
    axis: 'pme_pain',
    hook: 'Por qué tu peluquería pierde 3 clientes nuevos por semana sin saberlo',
    thesis:
      '73% de las personas leen reseñas antes de elegir peluquería. Si tienes menos reseñas o más antiguas que tu competencia, pierdes silenciosamente.'
  },
  {
    axis: 'pme_pain',
    hook: 'El cliente que vuelve no es el que más vale para tu Google',
    thesis:
      'Tu cliente fiel ya no deja reseñas (la dejó hace 2 años). El cliente nuevo que viene una vez y se va, ese es el que necesita dejar reseña porque es el que Google evalúa.'
  },
  {
    axis: 'pme_pain',
    hook: 'Por qué los descuentos por reseña están prohibidos por Google',
    thesis:
      'Google puede borrar todas las reseñas obtenidas con incentivo monetario directo y penalizar tu ficha. Hay alternativas legales: experiencias, sorteos, gamificación.'
  },
  {
    axis: 'pme_pain',
    hook: 'Lo que descubrí cuando audité 47 fichas de cafés en Colombia',
    thesis:
      '89% no responden a sus reseñas, 67% no han pedido una nueva en 60 días, 45% tienen fotos de hace más de un año. Pequeñas cosas, pérdidas enormes de visibilidad.'
  },
  {
    axis: 'pme_pain',
    hook: 'El momento exacto del día en que tu cliente está dispuesto a dejar una reseña',
    thesis:
      'Justo después de pagar, antes de salir del local. La satisfacción está fresca, el contexto positivo, y tienen el celular en la mano para Apple Pay/Nequi.'
  },
  {
    axis: 'pme_pain',
    hook: 'Por qué los clientes molestos dejan 5x más reseñas que los felices',
    thesis:
      'La asimetría emocional: el enojo motiva más que la satisfacción. Sin un sistema activo de captación de reseñas positivas, tu Google se llena solo de quejas.'
  },

  // ─── vendedor — RETIRÉ (Phase 17.1) ────────────────────────────────────
  // Cet axe parlait aux vendedores Spinly. @spinly.lat est un compte public
  // qui s'adresse aux dueños de negocios — la prospection vendedor passe par
  // le webinaire/page séparée, pas Instagram. Les angles ne sont plus seedés.
  // Les drafts existants sont nettoyés via le SQL de Phase 17.1.

  // ─── social_proof (5) ──────────────────────────────────────────────────
  {
    axis: 'social_proof',
    hook: '150 negocios LatAm ya multiplican x6 sus reseñas con Spinly',
    thesis:
      'Cafés, restaurantes, peluquerías, hoteles, tiendas. Colombia, México, Ecuador. Misma mecánica, mismo resultado: más reseñas reales, mejor ranking, más clientes nuevos.'
  },
  {
    axis: 'social_proof',
    hook: 'El café que pasó de 47 a 312 reseñas en 90 días',
    thesis:
      'Caso documentado de Café El Origen en Medellín. Plan Growth, ruleta con prizes pequeños (cookie gratis, descuento próxima visita), 78% de los clientes participan. Resultado verificable en su Google Maps.'
  },
  {
    axis: 'social_proof',
    hook: '68% de tus clientes dejarán una reseña si gamificas la experiencia',
    thesis:
      'Promedio de participación medido sobre 150+ negocios Spinly. Sin gamificación, la tasa es del 3-5%. La psicología del juego rompe la resistencia normal.'
  },
  {
    axis: 'social_proof',
    hook: 'El restaurante que duplicó su tráfico Google en 60 días con reseñas reales',
    thesis:
      'Caso de Asadero La Brasa en Cali. Pasó de aparecer en posición 12 a posición 3 para "asados Cali sur". Lift de 142% en click-to-direction, traducido en mesas adicionales semanales.'
  },
  {
    axis: 'social_proof',
    hook: 'Cómo medimos el ROI real de cada reseña Spinly',
    thesis:
      'Cada reseña vale 4-12 dólares en click-to-call y click-to-direction adicionales según el sector. A 9 dólares/mes el plan Starter, el ROI positivo se da con 1 sola reseña nueva.'
  },

  // ─── gamification (4) ──────────────────────────────────────────────────
  {
    axis: 'gamification',
    hook: 'Por qué la ruleta convierte 68% y un formulario solo 4%',
    thesis:
      'La psicología del juego: anticipación, sorpresa, recompensa. El cerebro libera dopamina antes de saber el resultado. El formulario es trabajo. La ruleta es juego.'
  },
  {
    axis: 'gamification',
    hook: 'La psicología detrás de la mecánica de la ruleta Spinly',
    thesis:
      'Variabilidad de recompensa (idéntico mecanismo que las máquinas tragamonedas), urgencia (el cupón expira), y reciprocidad (gano algo, dejo algo a cambio).'
  },
  {
    axis: 'gamification',
    hook: '3 errores que vuelven inútil cualquier sistema de gamificación',
    thesis:
      'Premios mediocres, mecánica predecible (todos ganan lo mismo), y falta de urgencia. Si el cliente no siente que perderá algo, no actúa.'
  },
  {
    axis: 'gamification',
    hook: 'Por qué un cupón con 24h de expiración convierte 4x más que uno sin fecha',
    thesis:
      'La pérdida pesa más que la ganancia (loss aversion). Sin deadline, el cupón se guarda y se olvida. Con deadline, el cliente vuelve esa misma semana.'
  },

  // ─── reseñas_strategy (3) ──────────────────────────────────────────────
  {
    axis: 'reseñas_strategy',
    hook: '30 reseñas reales superan a 300 reseñas compradas',
    thesis:
      'Google pondera autenticidad sobre cantidad. 30 reseñas con cuentas verificadas, fotos reales y palabras clave variadas, ranquean mejor que 300 reseñas genéricas con cuentas dudosas.'
  },
  {
    axis: 'reseñas_strategy',
    hook: 'La pirámide de reseñas que todo dueño de negocio debería conocer',
    thesis:
      'Base = cantidad (mínimo viable: 50). Medio = frescura (al menos 2/semana). Cima = calidad (palabras clave naturales, fotos, respuesta del propietario). Sin la cima, las otras dos no sirven.'
  },
  {
    axis: 'reseñas_strategy',
    hook: 'El indicador real de salud Google que tu competencia mide y tú no',
    thesis:
      'La "velocidad de reseñas" (reseñas/mes en los últimos 6 meses). Si la tuya es plana o decreciente, estás perdiendo terreno aunque tu total sea alto.'
  }
]

async function main() {
  console.log(`Seeding ${ANGLES.length} angles...`)

  let inserted = 0
  let skipped = 0
  const byAxis: Record<string, number> = {}

  for (const angle of ANGLES) {
    const { data: existing } = await supabase
      .from('ig_angles')
      .select('id')
      .eq('hook', angle.hook)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { error } = await supabase.from('ig_angles').insert(angle)
    if (error) {
      console.error(`Erreur insert "${angle.hook}":`, error.message)
      continue
    }

    inserted++
    byAxis[angle.axis] = (byAxis[angle.axis] || 0) + 1
  }

  console.log(`\nInserted: ${inserted}`)
  console.log(`Skipped (already exists): ${skipped}`)
  console.log(`\nDistribution by axis:`)
  for (const [axis, count] of Object.entries(byAxis)) {
    console.log(`  ${axis}: ${count}`)
  }

  const expected = {
    anti_agencias: 12,
    google_algo: 8,
    pme_pain: 10,
    social_proof: 5,
    gamification: 4,
    reseñas_strategy: 3
  }
  const total = Object.values(expected).reduce((a, b) => a + b, 0)
  if (ANGLES.length !== total) {
    console.error(`\nExpected ${total} angles, got ${ANGLES.length}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
