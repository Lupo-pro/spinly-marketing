import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('ig_posts')
    .select('id, status, slide_image_urls, generated_at')
    .order('generated_at', { ascending: false })
    .limit(30)

  if (error) throw error

  let shouldShowPret = 0
  console.log(
    `${'id'.padEnd(8)} ${'status'.padEnd(12)} ${'urls_type'.padEnd(10)} ${'count'.padEnd(6)} ${'expected'}`
  )
  console.log('-'.repeat(70))

  for (const p of data ?? []) {
    const urls = p.slide_image_urls
    const urlsType = Array.isArray(urls)
      ? 'array'
      : urls === null
        ? 'null'
        : typeof urls
    const count = Array.isArray(urls) ? urls.length : 0
    const isApproved = p.status === 'approved'
    const expected = isApproved && count === 10 ? 'PRÊT' : '—'
    if (expected === 'PRÊT') shouldShowPret++

    console.log(
      `${p.id.slice(0, 8)} ${String(p.status).padEnd(12)} ${urlsType.padEnd(10)} ${String(count).padEnd(6)} ${expected}`
    )
  }

  console.log('-'.repeat(70))
  console.log(`Posts that SHOULD show "Prêt": ${shouldShowPret}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
