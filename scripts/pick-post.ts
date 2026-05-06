import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('ig_posts')
    .select('id, status, slides_json')
    .order('generated_at', { ascending: false })
    .limit(5)
  if (error) throw error
  for (const p of data ?? []) {
    const firstSlide = (p.slides_json as { type: string; title?: string }[])?.[0]
    const hook = firstSlide?.type === 'hook' ? firstSlide.title : '?'
    console.log(`${p.id}\t${p.status}\t${hook}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
