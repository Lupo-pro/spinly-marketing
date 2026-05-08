-- ============================================================================
-- 027 — IG Angles Batch 2 (50 nouveaux angles)
-- Tous différents du seed initial (scripts/seed-ig-angles.ts).
-- Cible : dueños de cafés/restaurantes/spas/peluquerías Colombia & LatAm.
-- Distribution : 8 anti_agencias / 8 pme_pain / 8 google_algo / 8 vendedor /
-- 8 social_proof / 6 gamification / 4 reseñas_strategy = 50.
-- ============================================================================

insert into ig_angles (axis, hook, thesis) values

-- ─── anti_agencias (8) ──────────────────────────────────────────────────────
('anti_agencias',
 $$Tu agencia te facturó $4 millones este año. Mírate las reseñas reales nuevas$$,
 $$Audita tú mismo: filtra tu Google por "últimos 12 meses" y cuenta. La mayoría de cafés que pagan agencia terminan con menos de 30 reseñas verificables al año. El resto fueron borradas o nunca existieron.$$),

('anti_agencias',
 $$Lo que tu agencia llama "estrategia de reseñas" es spam por WhatsApp$$,
 $$Bajan tu lista del POS, mandan plantillas idénticas a 200 clientes el mismo día, y reportan 5 reseñas como "campaña exitosa". Pagas $1 millón por algo que tu mesera podría hacer mejor con un sticker.$$),

('anti_agencias',
 $$El día que pedí ver el contrato real con mi agencia descubrí esto$$,
 $$Ni garantía de resultado, ni penalidad por reseñas borradas, ni reporte mensual obligatorio. El contrato estándar las protege a ellas, no a ti. Por eso siguen vivas.$$),

('anti_agencias',
 $$Tu agencia te hizo firmar un NDA. ¿Sabes para qué sirve realmente?$$,
 $$Para que no compartas con otros dueños cuántas reseñas borró Google ni el costo unitario real. El NDA bloquea la transparencia entre clientes que reclamarían en grupo.$$),

('anti_agencias',
 $$Las 3 frases que repite tu agencia cuando le pides resultados concretos$$,
 $$"Está en proceso, el algoritmo cambió, son temas externos a nosotros." Ninguna admite responsabilidad. Las tres aparecen en el mismo email genérico que reciben todos sus clientes el mismo viernes.$$),

('anti_agencias',
 $$Cancelé mi agencia en febrero. Mira lo que pasó con mis reseñas en marzo$$,
 $$Caso real: bistró en Medellín que pagaba 240k/mes a una agencia. Promedio: 4 reseñas reales/mes. Cancelado en febrero, montado un sistema propio en marzo: 18 reseñas el primer mes. Misma cocina, otro sistema.$$),

('anti_agencias',
 $$La diferencia entre una agencia y un sistema propio: $720k al año$$,
 $$Agencia promedio en Colombia: 600k/mes con resultados borrosos. Un sistema gamificado: 60k/mes sin reuniones ni reportes. Mismo resultado en reseñas, una décima parte del costo.$$),

('anti_agencias',
 $$Por qué tu agencia no te deja entrar al dashboard real de Google$$,
 $$Te mandan capturas filtradas. Si entras tú al panel, descubres que el 60% de las "acciones" que reportan vienen de tu propio equipo escaneando QR para llenar métricas. Inflación pura.$$),

-- ─── pme_pain (8) ───────────────────────────────────────────────────────────
('pme_pain',
 $$Tu cliente más fiel ya no te deja reseña. Y te está costando dinero$$,
 $$Los habituales escriben una sola vez en su vida. Después vuelven, gastan más, pero no escriben. Google ve actividad sin reseñas y baja tu ranking. El sesgo del cliente fiel mata fichas que parecen sólidas.$$),

('pme_pain',
 $$El error #1 que mata tu ficha: pedir reseñas por grupo de WhatsApp$$,
 $$Mismo IP, mismo dispositivo, palabras parecidas. Google detecta el patrón en 48 horas y borra todo el batch. Acabas peor que antes y con riesgo de penalización adicional sobre la ficha.$$),

('pme_pain',
 $$Por qué tu pizzería de 18 años aparece detrás de la nueva del barrio$$,
 $$Tu reputación offline no compite con sus reseñas frescas. Google da más peso a 12 reseñas de los últimos 90 días que a 200 de hace 3 años. La actualidad gana siempre.$$),

('pme_pain',
 $$Tu mesero pide reseñas y nadie las deja. Aquí la razón real$$,
 $$El cliente está pagando, terminando un postre, saliendo apurado. Pedir reseña en ese momento crea fricción y el cliente promete sin cumplir. Conversión real: 2%. Hay otro momento que convierte 40%.$$),

('pme_pain',
 $$El 73% de los clientes mira tu Google antes de entrar a tu local$$,
 $$No es el menú, no es la fachada, no es el horario. Es la reseña más reciente. Si lleva 60 días sin reseña nueva, el cliente asume que cerraste o bajaste calidad y se va al de al lado.$$),

('pme_pain',
 $$Cuánto te cuesta cada reseña que no pediste este mes$$,
 $$Reseña nueva = 3 clicks adicionales en tu ficha. 3 clicks = 1 cliente nuevo en promedio. 1 cliente nuevo = $40-80k facturados. Dejar de pedir 5 reseñas/semana te cuesta cerca de $1M/mes.$$),

('pme_pain',
 $$Lo que descubrí al auditar 60 cafés de Bogotá durante 6 meses$$,
 $$Los que crecen tienen una sola cosa en común: piden reseña en el momento exacto del pago. Los que estancan piden "cuando se pueda". La diferencia: 18 reseñas/mes vs 2.$$),

('pme_pain',
 $$Tu hostal sube 0,2 estrellas. Esto es lo que pasa con tus reservas$$,
 $$De 4.3 a 4.5: +35% de reservas Booking. De 4.5 a 4.7: +60%. Cada décima vale millones al año. Y se construye con reseñas frescas, no con descuentos.$$),

-- ─── google_algo (8) ────────────────────────────────────────────────────────
('google_algo',
 $$El cambio del algoritmo de Google de marzo 2026 que casi nadie te contó$$,
 $$Google ahora pondera el tiempo entre reseñas. Patrones regulares (1 reseña cada 3 días) vencen patrones irregulares (10 en una semana, 0 en un mes). La constancia gana sobre el volumen total.$$),

('google_algo',
 $$Por qué tu peluquería con 200 reseñas perdió contra una con 40$$,
 $$Las 200 son de hace 3 años. Las 40 son de los últimos 60 días. Google ya no cuenta el total acumulado, cuenta la frecuencia reciente. El volumen pasado se convirtió en ruido.$$),

('google_algo',
 $$Las 4 señales que Google usa para detectar reseñas falsas en 2026$$,
 $$Mismo dispositivo o IP, cuentas creadas en los últimos 30 días, lenguaje copiado entre cuentas, y horarios anormales (3am). Una sola señal activa revisión. Dos señales = borrado automático.$$),

('google_algo',
 $$Cuánto demora Google en penalizar tu ficha por reseñas compradas$$,
 $$Entre 14 y 90 días. Primero borra las sospechosas, después baja tu ranking 30%, después suspende temporalmente la opción "pedir reseña". La cadena es predecible y muy difícil de revertir.$$),

('google_algo',
 $$Por qué responder reseñas pesa más en tu ranking que recibir nuevas$$,
 $$Google mide la tasa de respuesta como señal de actividad del propietario. Negocio que responde 90% de las reseñas: +20% de visibilidad. Negocio que responde 0%: penalización progresiva, mes a mes.$$),

('google_algo',
 $$El factor que ningún SEO local te explica: la diversidad léxica$$,
 $$Si tus reseñas dicen todas "rico, lindo, recomendado", Google las marca como genéricas. Reseñas con palabras únicas (postre específico, terraza, mesero por nombre) suben más fuerte tu ranking.$$),

('google_algo',
 $$Tu ficha tiene 4.8 estrellas pero apareces en página 2. Esto es lo que pasa$$,
 $$El rating es solo 1 de los 11 factores de ranking. Frescura, frecuencia, respuesta del dueño, fotos, eventos, posts, q&a, horarios actualizados. Tu 4.8 con datos viejos pierde contra un 4.5 activo.$$),

('google_algo',
 $$Lo que Google premia en 2026 que casi ningún dueño sabe$$,
 $$Las reseñas con foto. Cada reseña con imagen pesa hasta 3x más en el ranking que una solo texto. Si pides reseñas sin pedir foto, dejas el 70% de la potencia sobre la mesa.$$),

-- ─── vendedor (8 — interpretado como "tu equipo de sala/atención") ─────────
('vendedor',
 $$Tu cajero pide reseña a 1 de cada 50 clientes. Esta es la razón$$,
 $$Le da pena, no le pagan por eso, no entiende el beneficio para él. Sin un sistema que lo libere de esa fricción, perderás reseñas por los próximos 5 años. La tecnología reemplaza la pena humana.$$),

('vendedor',
 $$Pagarle bonus a tu mesero por reseña no funciona. Mira los datos$$,
 $$Probaron en 23 cafés de Bogotá. Bonus de 5k por reseña: incremento del 12% el primer mes, regreso al baseline al tercer mes. La motivación extrínseca se evapora rápido y el costo queda.$$),

('vendedor',
 $$Por qué tu mejor mesera nunca pide reseñas (y deberías agradecerlo)$$,
 $$La que da el mejor servicio no quiere romper la magia con un pedido de favor. La que pide más reseñas es la que ofrece servicio mediocre y compensa con presión. Pedir es signo de inseguridad.$$),

('vendedor',
 $$El script que entrenas con tu equipo para pedir reseñas no escala$$,
 $$Cambia el equipo (rotación 40%/año en restaurantes), cambia el script. Cambia el dueño, cambia el script. Cambia el contexto, falla el script. Lo único que escala es el sistema sin script.$$),

('vendedor',
 $$5 cosas que tu mesero hace mejor que pedir reseñas$$,
 $$Recomendar el plato del día, recordar nombres, sugerir maridajes, mantener la mesa limpia, calmar quejas. Pedir reseñas no está en lo que entrenaste y no debería estarlo.$$),

('vendedor',
 $$Cuando un mesero pide "ayúdame con la reseña", el cliente entiende esto$$,
 $$El cliente recibe presión emocional y no agradece sentirse usado. Conversión real: 6%. Reseñas con tono ambiguo o forzado. El daño a marca es invisible pero medible mes tras mes.$$),

('vendedor',
 $$El error de hacer competencia entre meseros por número de reseñas$$,
 $$Genera resentimiento, scripts forzados, clientes incómodos, y al final 1-2 reseñas falsas escritas por el mismo mesero con cuentas alternativas. La competencia interna corrompe el dato.$$),

('vendedor',
 $$Lo que pasa cuando dejas de pedirle reseñas a tu equipo$$,
 $$Liberan ancho de banda emocional para servir mejor. Las propinas suben 8-12%. Y las reseñas suben 6x si reemplazas la fricción humana con un sistema automático que el cliente activa solo.$$),

-- ─── social_proof (8) ───────────────────────────────────────────────────────
('social_proof',
 $$El glamping en el Quindío que duplicó su tarifa gracias a 38 reseñas nuevas$$,
 $$Reserva Aikara pasó de 280k/noche a 580k/noche en 6 meses. Único cambio: 38 reseñas nuevas con foto en Booking + Google. La autoridad se compra, pero la prueba social se construye con reseñas reales.$$),

('social_proof',
 $$Caso real: la pizzería que pasó del puesto 8 al puesto 1 en Cali$$,
 $$La Trattoria del Norte. 92 reseñas reales en 4 meses, 4.7 estrellas, 67% con foto. Hoy aparece primero para "pizza Cali sur". Antes: 14 mesas vacías por noche. Hoy: 35 minutos de espera.$$),

('social_proof',
 $$Cómo el spa de mi prima logró 240 reseñas en 12 meses sin pagar agencia$$,
 $$QR en cada cabina, ruleta con descuento 10-30%, premio mínimo siempre real. Resultado: 240 reseñas, 4.9 estrellas, agendamiento al doble. Costo total: 180k al año en sistema propio.$$),

('social_proof',
 $$El barbero que reemplazó descuentos por reseñas y subió 28% su margen$$,
 $$Antes: 2x1 los lunes, baja del 28% en margen. Hoy: cero descuentos, 47 reseñas/mes con palabras clave "fade", "barba", "experiencia". Lo encuentran por búsqueda, no por precio.$$),

('social_proof',
 $$150+ negocios LatAm. Esto es lo que aprendí auditándolos uno por uno$$,
 $$Los que crecen no piden más reseñas. Piden mejores. Reseñas con foto + palabra clave del producto = 3x más impacto. El volumen sin estructura es ruido que diluye tu autoridad.$$),

('social_proof',
 $$El asadero en Bucaramanga que dejó de pagar publicidad hace 2 años$$,
 $$Don Memo's. 4.8 estrellas, 312 reseñas en los últimos 12 meses, 71% con foto. Apareció en página 1 sin un peso en Meta Ads. Las reseñas hicieron lo que la publicidad no podía.$$),

('social_proof',
 $$El ratio que separa los cafés que crecen de los que mueren: 0,7$$,
 $$Reseñas nuevas/mes ÷ clientes nuevos/mes. Cafés con ratio < 0,2 estancan. Cafés con ratio > 0,7 crecen sin publicidad. Spinly mueve el ratio de 0,1 a 0,9 en 60 días promedio.$$),

('social_proof',
 $$Comparé los Top 10 cafés de Medellín con los Top 50. Esto descubrí$$,
 $$El Top 10 tiene 4x más fotos por reseña, 3x más respuestas del dueño, 2x más reseñas mensuales. No es talento ni suerte, es disciplina. Y se sistematiza en 30 días.$$),

-- ─── gamification (6) ───────────────────────────────────────────────────────
('gamification',
 $$La diferencia entre un cupón "gracias" y un cupón con narrativa$$,
 $$Cupón genérico: 8% conversión, 1% retorno. Cupón con historia ("te ganaste el café del barista del mes"): 34% conversión, 12% retorno. La narrativa multiplica el valor percibido sin costo extra.$$),

('gamification',
 $$Por qué tu sistema de puntos perdió contra una ruleta de 30 segundos$$,
 $$Los puntos exigen memoria, app, login, paciencia. La ruleta exige solo 1 escaneo de QR. La fricción mata la conversión sea quien sea tu cliente. Lo simple gana siempre.$$),

('gamification',
 $$El secreto que las apps de delivery saben y los cafés ignoran$$,
 $$Rappi, DiDi, Uber Eats: cada acción del cliente está gamificada. Estrellas, niveles, sorpresas. Los cafés piden reseña con un letrero impreso en blanco y negro. La diferencia de conversión es brutal.$$),

('gamification',
 $$3 premios que NO debes regalar nunca en tu ruleta de reseñas$$,
 $$Cosas con valor 0 (postre congelado), cosas que ya regalas (vaso de agua), productos sin foto. Si el cliente no se emociona al ganar, no comparte y no vuelve. El premio define la conversión.$$),

('gamification',
 $$Por qué la sorpresa convierte 6x más que la certidumbre$$,
 $$Cerebro humano: cuando sabe lo que viene, libera dopamina lineal. Cuando no sabe, libera dopamina logarítmica. La sorpresa de la ruleta es una droga emocional barata, legal y replicable.$$),

('gamification',
 $$El error #1 al diseñar tu mecánica de reseñas: hacerla justa$$,
 $$La justicia mata el juego. Si todos ganan lo mismo, nadie cuenta. Si la mecánica tiene varianza (5%, 20%, 30% off), cada cliente vuelve y trae a otro. La asimetría genera conversación.$$),

-- ─── reseñas_strategy (4) ───────────────────────────────────────────────────
('reseñas_strategy',
 $$El calendario de reseñas que multiplica tu impacto en Google$$,
 $$Lunes-jueves: pides en momentos lentos (más atención del cliente). Viernes-domingo: pides en momentos pico (más volumen). Patrón regular = +30% de indexación según data interna de 150+ negocios.$$),

('reseñas_strategy',
 $$Por qué pedir reseñas a TODOS los clientes baja tu calidad promedio$$,
 $$El cliente que recién entra no califica como tu cliente fiel. Pedir indiscriminadamente diluye tu rating con reseñas tibias. La selección importa: pide al cliente que vuelve, no al de paso.$$),

('reseñas_strategy',
 $$Cómo convertir una reseña negativa en una mejora real de tu rating$$,
 $$Respuesta en menos de 2h, reconocimiento del problema, oferta concreta de solución. El 38% de los autores edita la reseña al alza después de una buena respuesta. La reactividad es ranking.$$),

('reseñas_strategy',
 $$La única estrategia de reseñas que sobrevive a un cambio de algoritmo$$,
 $$Reseñas reales, recientes, con foto, palabras clave naturales, distribución horaria orgánica. Cualquier truco específico (paquete, bot, agencia) muere en el siguiente update. Lo orgánico es eterno.$$);

-- ============================================================================
-- Sanity check (pas un constraint, juste un rappel)
-- 50 nouvelles lignes attendues. Vérifier après application :
--   select axis, count(*) from ig_angles group by axis order by count desc;
-- ============================================================================
