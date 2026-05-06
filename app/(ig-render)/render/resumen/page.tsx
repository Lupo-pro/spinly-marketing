type Props = {
  searchParams: {
    title?: string
    items?: string
    pageNum?: string
  }
}

const DEFAULT_ITEMS = [
  { number: '01', title: 'Solo te muestran resultados buenos', subtitle: 'Sin errores, sin pérdidas, sin aprendizaje.' },
  { number: '02', title: 'Solo hablan de CTR y alcance', subtitle: 'Nunca del costo real por cliente nuevo.' },
  { number: '03', title: 'Nunca explican qué cambian ni por qué', subtitle: 'Improvisar con tu dinero no es gestión.' },
  { number: '04', title: 'Tarda días en responderte', subtitle: 'Tu dinero no puede esperar.' },
  { number: '05', title: 'Llevas meses sin resultados reales', subtitle: 'Y siempre hay una excusa diferente.' }
]

export default function ResumenPage({ searchParams }: Props) {
  const { title = 'LAS 5 SEÑALES QUE NO PUEDES IGNORAR.', items: itemsJson, pageNum = '08' } = searchParams

  let items = DEFAULT_ITEMS
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson)
    } catch {}
  }

  return (
    <div className="slide resumen">
      <div className="watermark-grid">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="watermark-row"
            style={i % 2 === 1 ? { marginLeft: '-50px' } : undefined}
          >
            SEÑALES SEÑALES SEÑALES
          </div>
        ))}
      </div>
      <div className="brand-top-right">SPINLY</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="items">
          {items.map((it, i) => (
            <div key={i} className="item">
              <div className="item-num">{it.number}</div>
              <div className="item-text">
                <strong>{it.title}</strong>
                <span>{it.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
