import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const ids = process.argv.slice(2)
  if (ids.length === 0) {
    console.error('Usage: tsx scripts/inspect-post.ts <postId> [<postId>...]')
    process.exit(1)
  }
  for (const id of ids) {
    const { data, error } = await supabase
      .from('ig_posts')
      .select('id, status, slide_image_urls, slides_json')
      .eq('id', id)
      .single()
    if (error) {
      console.error(`${id}: ${error.message}`)
      continue
    }
    const urls = (data.slide_image_urls ?? []) as string[]
    const slides = (data.slides_json ?? []) as { n: number; type: string }[]
    console.log(`\n${id}  status=${data.status}  rendered=${urls.length}/${slides.length}`)
    for (const slide of slides) {
      const url = urls[slide.n - 1]
      const present = url ? '✓' : '✗'
      console.log(`  ${present} slide ${slide.n} (${slide.type})${url ? '' : ' MISSING'}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
