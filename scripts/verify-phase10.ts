import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Check the column exists and is populated
  const { data, error } = await supabase
    .from('ig_posts')
    .select('id, content_type, status')
    .order('generated_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('FAIL: column query errored', error.message)
    process.exit(1)
  }

  const counts: Record<string, number> = {}
  for (const p of data ?? []) {
    const t = p.content_type ?? '(null)'
    counts[t] = (counts[t] || 0) + 1
  }

  console.log('Recent posts by content_type:', counts)

  // Check the full DB distribution
  const { count: carouselCount } = await supabase
    .from('ig_posts')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', 'carousel')

  const { count: singleCount } = await supabase
    .from('ig_posts')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', 'single_post')

  const { count: nullCount } = await supabase
    .from('ig_posts')
    .select('*', { count: 'exact', head: true })
    .is('content_type', null)

  console.log(`\nFull DB: carousel=${carouselCount} single_post=${singleCount} null=${nullCount}`)

  if (nullCount && nullCount > 0) {
    console.warn(
      `⚠ ${nullCount} rows still have content_type=NULL — backfill incomplete`
    )
  } else {
    console.log('✓ Backfill OK (no null content_type)')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
