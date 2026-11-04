/**
 * Seed default accounts, categories, subcategories for a specific user.
 *
 * Usage:
 *   1. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. Set USER_ID below (or via env: SEED_USER_ID)
 *   3. Run: bun run scripts/seed-default-data.ts
 */
import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
  DEFAULT_INVESTMENT_ACCOUNTS,
} from '../src/lib/constants/categories'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const USER_ID = process.env.SEED_USER_ID!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_KEY')
  process.exit(1)
}
if (!USER_ID) {
  console.error('❌ Missing SEED_USER_ID — set this in .env.local')
  console.error('   Run scripts/get-user-id.ts first to find the user_id')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  console.log('='.repeat(60))
  console.log('🌱 Seeding default data for user:', USER_ID)
  console.log('='.repeat(60))

  // 1. Accounts (bank + ewallet + cash)
  console.log('\n🏦 Inserting bank accounts...')
  for (const acc of DEFAULT_ACCOUNTS) {
    const { data, error } = await supabase
      .from('accounts')
      .upsert({ ...acc, user_id: USER_ID }, { onConflict: 'user_id,name' })
      .select('id, name')
      .single()

    if (error) {
      console.error(`❌ Failed to insert account ${acc.name}:`, error.message)
      continue
    }
    console.log(`   ✓ ${data.name} → ${data.id}`)
  }

  // 2. Investment accounts
  console.log('\n📈 Inserting investment accounts...')
  for (const acc of DEFAULT_INVESTMENT_ACCOUNTS) {
    const { data, error } = await supabase
      .from('accounts')
      .upsert({ ...acc, user_id: USER_ID }, { onConflict: 'user_id,name' })
      .select('id, name')
      .single()

    if (error) {
      console.error(`❌ Failed to insert investment account ${acc.name}:`, error.message)
      continue
    }
    console.log(`   ✓ ${data.name} → ${data.id}`)
  }

  // 3. Categories + subcategories
  console.log('\n📁 Inserting categories + subcategories...')
  for (const cat of DEFAULT_CATEGORIES) {
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .upsert(
        {
          user_id: USER_ID,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          sort_order: DEFAULT_CATEGORIES.indexOf(cat),
          is_active: true,
        },
        { onConflict: 'user_id,name' }
      )
      .select('id, name')
      .single()

    if (catError) {
      console.error(`❌ Failed to insert category ${cat.name}:`, catError.message)
      continue
    }

    console.log(`   ✓ ${catData.name} (${cat.type})`)

    for (const [idx, subName] of cat.subcategories.entries()) {
      const { error: subError } = await supabase.from('subcategories').upsert(
        {
          user_id: USER_ID,
          category_id: catData.id,
          name: subName,
          sort_order: idx,
          is_active: true,
        },
        { onConflict: 'user_id,category_id,name' }
      )

      if (subError) {
        console.error(`   ⚠ Failed sub ${subName}:`, subError.message)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Seed complete!')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('   1. Open Supabase Dashboard → Table Editor → accounts/categories')
  console.log('   2. Verify the data is there')
  console.log('   3. Run scripts/migrate-from-sheet.ts to import transactions')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
