import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('ig_posts')
    .select('id, status, slide_image_urls')
    .eq('status', 'approved')
    .order('generated_at', { ascending: false })

  if (error) throw error

  for (const p of data ?? []) {
    const urls = p.slide_image_urls
    const isArray = Array.isArray(urls)
    const len = isArray ? urls.length : 'N/A'
    const elemTypes = isArray
      ? Array.from(new Set(urls.map((u: unknown) => typeof u))).join(',')
      : 'N/A'
    const firstChars = isArray && urls.length > 0 ? String(urls[0]).slice(0, 40) : 'N/A'
    console.log(
      `${p.id.slice(0, 8)} | isArray=${isArray} | len=${len} | elem_types=${elemTypes} | first_url=${firstChars}`
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
