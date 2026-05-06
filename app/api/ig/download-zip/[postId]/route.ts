import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JSZip from 'jszip'
import { getServerSupabase } from '@/lib/supabase/server'

export const maxDuration = 60

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  // Cookie-based admin gate — only Lupo can pull the ZIP.
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {}
      }
    }
  )
  const {
    data: { user }
  } = await supabaseAuth.auth.getUser()
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { data: post } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('id', params.postId)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (!post.slide_image_urls || post.slide_image_urls.length === 0) {
    return NextResponse.json({ error: 'No slides rendered' }, { status: 400 })
  }

  const zip = new JSZip()
  const folder = zip.folder('slides')!

  type FetchResult = { ok: true; i: number } | { ok: false; i: number; error: string }
  const fetchPromises = (post.slide_image_urls as string[]).map(
    async (url, i): Promise<FetchResult> => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
        folder.file(filename, buf)
        return { ok: true, i }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, i, error: message }
      }
    }
  )

  const results = await Promise.all(fetchPromises)
  const failed = results.filter((r) => !r.ok)
  if (failed.length === post.slide_image_urls.length) {
    return NextResponse.json(
      { error: 'All slides failed to fetch', details: failed },
      { status: 500 }
    )
  }

  const captionFull =
    post.caption +
    (post.hashtags && post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '')
  zip.file('caption.txt', captionFull)

  const generatedAt = new Date().toLocaleString('fr-FR', { timeZone: 'America/Bogota' })
  const readme = `Spinly Marketing — Carrousel Instagram

Ce ZIP contient :
- slides/slide-01.png à slide-10.png : les 10 visuels du carrousel
- caption.txt : la légende complète à copier-coller

Pour publier sur Instagram :

Option A — Via Buffer (recommandé)
1. Va sur buffer.com → Compose → New Post
2. Sélectionne ton compte @spinly.lat
3. Upload les 10 PNG dans l'ordre (slide-01 à slide-10)
4. Copie-colle le contenu de caption.txt dans la zone de texte
5. Choisis l'heure de publication, clique Schedule

Option B — Via Later
1. Va sur later.com → Calendar → New Post
2. Drag & drop les 10 PNG dans l'ordre
3. Copie-colle caption.txt dans la légende
4. Programme l'heure, clique Save

Option C — Manuelle depuis l'app Instagram
1. AirDrop le dossier slides/ vers ton iPhone
2. Ouvre Instagram → + → Publication → sélectionne les 10 photos dans l'ordre
3. Pas de filtres, prochain → colle le caption → Partager

Généré le ${generatedAt} (heure Bogota)
Post ID : ${post.id}
`
  zip.file('README.txt', readme)

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  const slides = post.slides_json as { type: string; title?: string }[] | null
  const hook = slides?.[0]?.title ?? 'spinly-post'
  const safeName = hook
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `spinly-${dateStr}-${safeName}.zip`

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.byteLength.toString()
    }
  })
}
