/**
 * Migration script: Google Sheet CSV → Supabase
 *
 * Steps:
 *   1. Export your Google Sheet "TRANSAKSI" tab as CSV
 *   2. Save to: data/transaksi-export.csv
 *   3. Get the user_id of the customer (run: bun run scripts/get-user-id.ts)
 *   4. Set MIGRATION_USER_ID in .env.local
 *   5. Run: bun run scripts/migrate-from-sheet.ts
 *
 * CSV format expected (5 columns A-E):
 *   TGL, KATEGORI, SUB KATEGORI, NOMINAL, AKUN
 *   Example: 2026-08-01,KEBUTUHAN POKOK,Makanan,50000,SEABANK
 *
 * Helper columns F (BULAN) and G (TAHUN) are IGNORED — derived from TGL.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { parse } from 'csv-parse/sync'

// ────────────────────────────────────────────────────────────
// Config (override via env)
// ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const CSV_PATH = process.env.SHEET_CSV_PATH ?? './data/transaksi-export.csv'
const USER_ID = process.env.MIGRATION_USER_ID!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_KEY in env')
  process.exit(1)
}

if (!USER_ID) {
  console.error('❌ Missing MIGRATION_USER_ID in env')
  console.error('   Run: bun run scripts/get-user-id.ts to find the user_id')
  process.exit(1)
}

if (!existsSync(CSV_PATH)) {
  console.error(`❌ CSV file not found: ${CSV_PATH}`)
  console.error('   Export your Google Sheet TRANSAKSI tab as CSV first')
  process.exit(1)
}

// ────────────────────────────────────────────────────────────
// Init Supabase admin client (use service role key if available)
// ────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function parseAmount(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Math.abs(v)
  const digits = String(v).replace(/[^0-9-]/g, '')
  return digits ? Math.abs(parseInt(digits, 10)) : 0
}

function parseDate(v: string): string | null {
  if (!v) return null
  const s = String(v).trim()

  // Date object (rare in CSV)
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10)
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const day = m[1].padStart(2, '0')
    const month = m[2].padStart(2, '0')
    return `${m[3]}-${month}-${day}`
  }

  // "1 Aug 2026" / "1 Agustus 2026"
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
    jun: '06', jul: '07', agu: '08', aug: '08', agt: '08',
    sep: '09', okt: '10', oct: '10', nov: '11', des: '12', dec: '12',
  }
  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)[\.\s\-]+(\d{4})$/)
  if (m2) {
    const month = monthMap[m2[2].toLowerCase().slice(0, 3)]
    if (month) {
      return `${m2[3]}-${month}-${m2[1].padStart(2, '0')}`
    }
  }

  return null
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60))
  console.log('📦 Migrating TRANSAKSI from CSV → Supabase')
  console.log('='.repeat(60))
  console.log(`   CSV: ${CSV_PATH}`)
  console.log(`   User ID: ${USER_ID}`)
  console.log('')

  // Step 1: Load existing accounts & categories for this user
  console.log('🔍 Loading existing accounts & categories...')
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', USER_ID)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', USER_ID)

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, name, category_id')
    .eq('user_id', USER_ID)

  if (!accounts?.length || !categories?.length) {
    console.error('❌ No accounts or categories found for this user.')
    console.error('   Run: bun run scripts/seed-default-data.ts first')
    process.exit(1)
  }

  const accountMap = new Map(accounts.map((a) => [a.name.toUpperCase(), a.id]))
  const categoryMap = new Map(categories.map((c) => [c.name.toUpperCase(), c.id]))
  const subcategoryMap = new Map(
    (subcategories ?? []).map((s) => [`${s.category_id}|${s.name.toUpperCase()}`, s.id])
  )

  console.log(`   ✓ Found ${accounts.length} accounts, ${categories.length} categories`)

  // Step 2: Parse CSV
  console.log('\n📖 Parsing CSV...')
  const csvContent = readFileSync(CSV_PATH, 'utf-8')
  const records = parse(csvContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][]

  // Skip header row if detected
  const firstRow = records[0]
  const hasHeader =
    firstRow &&
    (firstRow[0]?.toLowerCase().includes('tgl') ||
      firstRow[1]?.toLowerCase().includes('kategori'))
  const dataRows = hasHeader ? records.slice(1) : records

  console.log(`   ✓ Parsed ${dataRows.length} rows`)

  // Step 3: Transform rows
  console.log('\n🔄 Transforming rows...')
  let skipped = 0
  let noAccount = 0
  let noCategory = 0
  let noDate = 0

  const transactions: any[] = []

  for (const row of dataRows) {
    const [rawDate, rawKategori, rawSub, rawNominal, rawAkun] = row

    if (!rawKategori && !rawSub && !rawNominal) {
      skipped++
      continue
    }

    const dateStr = parseDate(rawDate || '')
    if (!dateStr) {
      noDate++
      continue
    }

    const amount = parseAmount(rawNominal)
    if (amount <= 0) {
      skipped++
      continue
    }

    const kategoriUpper = (rawKategori || '').trim().toUpperCase()
    const akunUpper = (rawAkun || '').trim().toUpperCase()
    const subUpper = (rawSub || '').trim().toUpperCase()

    // Resolve IDs
    const accountId = accountMap.get(akunUpper)
    const categoryId = categoryMap.get(kategoriUpper)

    if (!accountId) {
      noAccount++
      continue
    }
    if (!categoryId) {
      noCategory++
      continue
    }

    // Determine type
    let type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'investment'
    if (kategoriUpper.includes('PEMASUKAN')) type = 'income'
    else if (kategoriUpper.includes('PINDAH DANA')) type = 'transfer_out'
    else if (
      kategoriUpper.includes('TABUNGAN') ||
      kategoriUpper.includes('INVESTASI')
    )
      type = 'investment'
    else type = 'expense'

    transactions.push({
      user_id: USER_ID,
      transaction_date: dateStr,
      category_id: categoryId,
      subcategory_id: subcategoryMap.get(`${categoryId}|${subUpper}`) ?? null,
      account_id: accountId,
      amount,
      type,
      note: rawSub || null,
    })
  }

  console.log(`   ✓ ${transactions.length} transactions ready to insert`)
  if (skipped) console.log(`   ⚠ Skipped ${skipped} empty/invalid rows`)
  if (noDate) console.log(`   ⚠ ${noDate} rows with unparseable date`)
  if (noAccount) console.log(`   ⚠ ${noAccount} rows with unknown account`)
  if (noCategory) console.log(`   ⚠ ${noCategory} rows with unknown category`)

  // Step 4: Insert in batches
  console.log('\n💾 Inserting to Supabase (batch of 500)...')
  const BATCH = 500
  let inserted = 0

  for (let i = 0; i < transactions.length; i += BATCH) {
    const batch = transactions.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('transactions')
      .insert(batch)
      .select('id')

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message)
      console.error('   First row of batch:', batch[0])
      process.exit(1)
    }

    inserted += data?.length ?? 0
    process.stdout.write(`\r   ✓ Inserted ${inserted}/${transactions.length}`)
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('✅ Migration complete!')
  console.log('='.repeat(60))
  console.log(`   Total inserted: ${inserted}`)
  console.log(`   Total skipped: ${skipped}`)
  console.log(`   Verify in Supabase Dashboard → Table Editor → transactions`)
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
