/**
 * Get user IDs from Supabase — useful for first-time setup
 * Run after first user signs up via Google login
 *
 * Usage: bun run scripts/get-user-id.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  console.log('📋 Users in your Supabase project:')
  console.log('─'.repeat(80))

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, app_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Failed to fetch profiles:', error.message)
    console.error('\nMake sure you ran supabase/01_schema.sql first')
    process.exit(1)
  }

  if (!profiles || profiles.length === 0) {
    console.log('No users yet. Sign up via Google login first, then re-run this script.')
    return
  }

  console.log(
    'ID'.padEnd(40) +
      'EMAIL'.padEnd(35) +
      'NAME'.padEnd(20) +
      'APP_NAME'
  )
  console.log('─'.repeat(80))

  for (const p of profiles) {
    console.log(
      p.id.padEnd(40) +
        (p.email ?? '').padEnd(35) +
        (p.full_name ?? '').padEnd(20) +
        (p.app_name ?? '')
    )
  }

  console.log('\n💡 To seed default data for first user:')
  console.log('   export SEED_USER_ID="<id from above>"')
  console.log('   bun run scripts/seed-default-data.ts')
}

main().catch((err) => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
