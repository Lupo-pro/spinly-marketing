import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('ig_posts')
    .select('id, pe_status, pe_post_id, pe_scheduled_for')
    .limit(1)

  if (error) {
    console.error('FAIL: column query errored', error.message)
    process.exit(1)
  }

  console.log('✓ Migration 005 OK — pe_* columns are queryable')
  console.log(`Sample row keys: ${Object.keys(data?.[0] ?? {}).join(', ')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
