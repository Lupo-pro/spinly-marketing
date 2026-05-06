import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const args = process.argv.slice(2)
const getArg = (name: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`))
  return arg ? arg.split('=').slice(1).join('=') : null
}

async function main() {
  const igUserId = getArg('ig-user-id')
  const fbPageId = getArg('fb-page-id')
  const accessToken = getArg('access-token')
  const appId = getArg('app-id')

  if (!igUserId || !fbPageId || !accessToken || !appId) {
    console.error(
      'Usage: tsx scripts/setup-ig-account.ts --ig-user-id=… --fb-page-id=… --access-token=… --app-id=…'
    )
    process.exit(1)
  }

  // Long-lived tokens are valid 60 days from issuance. We don't know the exact
  // issuance time so we assume "now" as a conservative starting point.
  const expiresAt = new Date(Date.now() + 60 * 86400_000)

  const { data: existing } = await supabase
    .from('ig_account')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    ig_user_id: igUserId,
    fb_page_id: fbPageId,
    access_token: accessToken,
    app_id: appId,
    token_expires_at: expiresAt.toISOString(),
    active: true,
    last_token_refresh_at: new Date().toISOString()
  }

  if (existing) {
    const { error } = await supabase.from('ig_account').update(payload).eq('id', existing.id)
    if (error) throw error
    console.log('Account updated (id=' + existing.id + ')')
  } else {
    const { error } = await supabase.from('ig_account').insert(payload)
    if (error) throw error
    console.log('Account created')
  }

  console.log(`Token expires: ${expiresAt.toISOString()}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
