-- ============================================================
-- 08_TEMPLATES.SQL — Template System for Auto-Apply on Signup
-- ============================================================
-- Run AFTER 01_schema.sql through 07_mascots.sql
--
-- Konsep:
--   3 master tables (template_categories, template_subcategories, bank_options)
--   - Lu edit di sini kalau mau update template global
--   - Customer baru auto-dapat data ini saat signup
--   - Customer lama NGGAK ter-impact (data mereka sudah punya)
--
-- Auto-apply mechanism:
--   Trigger handle_new_user() di-update buat auto-copy template
--   ke tabel user-specific (categories, subcategories, accounts)
-- ============================================================

-- ============================================================
-- 1. TEMPLATE_CATEGORIES table
--    Master list kategori yang akan di-copy ke user saat signup
-- ============================================================
create table if not exists public.template_categories (
  id text primary key,                       -- slug: 'pemasukan', 'kebutuhan-pokok'
  name text not null,                        -- Display: '💵 PEMASUKAN'
  type text not null check (type in ('income','expense','transfer','investment','debt','other')),
  icon text,                                  -- emoji '💵'
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. TEMPLATE_SUBCATEGORIES table
--    Master list subkategori per kategori
-- ============================================================
create table if not exists public.template_subcategories (
  id text primary key,                       -- slug: 'gaji-salary', 'makanan'
  category_id text not null references public.template_categories(id) on delete cascade,
  name text not null,                        -- Display: 'Gaji / Salary'
  default_amount numeric,                    -- suggested budget amount
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique(category_id, name)
);

-- ============================================================
-- 3. BANK_OPTIONS table
--    Master list bank/e-wallet yang available
--    Frontend buat dropdown dari sini
-- ============================================================
create table if not exists public.bank_options (
  id text primary key,                       -- slug: 'bca', 'mandiri', 'dana'
  name text not null,                        -- Display: 'BCA'
  type text not null check (type in ('bank','ewallet','cash','investment')),
  category text,                              -- 'major-bank', 'digital-bank', 'ewallet'
  is_popular boolean not null default false, -- flag buat sorting
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. RLS Policies for template tables
--    - Semua authenticated user bisa SELECT (lihat template)
--    - Hanya service_role (admin) yang bisa INSERT/UPDATE/DELETE
-- ============================================================
alter table public.template_categories enable row level security;
alter table public.template_subcategories enable row level security;
alter table public.bank_options enable row level security;

drop policy if exists "Template categories: select all" on public.template_categories;
create policy "Template categories: select all"
  on public.template_categories for select
  to authenticated
  using (is_active = true);

drop policy if exists "Template categories: admin write" on public.template_categories;
create policy "Template categories: admin write"
  on public.template_categories for all
  to service_role
  using (true);

drop policy if exists "Template subcategories: select all" on public.template_subcategories;
create policy "Template subcategories: select all"
  on public.template_subcategories for select
  to authenticated
  using (is_active = true);

drop policy if exists "Template subcategories: admin write" on public.template_subcategories;
create policy "Template subcategories: admin write"
  on public.template_subcategories for all
  to service_role
  using (true);

drop policy if exists "Bank options: select all" on public.bank_options;
create policy "Bank options: select all"
  on public.bank_options for select
  to authenticated
  using (is_active = true);

drop policy if exists "Bank options: admin write" on public.bank_options;
create policy "Bank options: admin write"
  on public.bank_options for all
  to service_role
  using (true);

-- ============================================================
-- 5. SEED: Insert 12 Template Categories
-- ============================================================
insert into public.template_categories (id, name, type, icon, sort_order) values
  ('pindah-dana',     '💸 PINDAH DANA',          'transfer',   '💸', 1),
  ('pemasukan',       '💵 PEMASUKAN',            'income',     '💵', 2),
  ('tabungan-invest', '💰 TABUNGAN/ INVESTASI',  'investment', '💰', 3),
  ('kebutuhan-pokok', '🍚 KEBUTUHAN POKOK',      'expense',    '🍚', 4),
  ('tempat-tinggal',  '🏠 TEMPAT TINGGAL',       'expense',    '🏠', 5),
  ('transportasi',    '🚌 TRANSPORTASI',         'expense',    '🚌', 6),
  ('kesehatan',       '🩺 KESEHATAN',            'expense',    '🩺', 7),
  ('perawatan-diri',  '💇 PERAWATAN DIRI',       'expense',    '💇', 8),
  ('pengembangan',    '📚 PENGEMBANGAN DIRI',    'expense',    '📚', 9),
  ('hiburan',         '🎉 GAYA HIDUP/ HIBURAN',  'expense',    '🎉', 10),
  ('hutang',          '💳 HUTANG / CICILAN',     'debt',       '💳', 11),
  ('lain-lain',       '⚠️ LAIN-LAIN',            'other',      '⚠️', 12)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

-- ============================================================
-- 6. SEED: Insert Template Subcategories (101 total)
-- ============================================================

-- 💸 PINDAH DANA (0 subkategori — handled via to_account_id)
-- (kosong, frontend handle via account_id + to_account_id)

-- 💵 PEMASUKAN (11 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('gaji-salary',              'pemasukan', 'Gaji / Salary',              1),
  ('bonus-komisi',             'pemasukan', 'Bonus & Komisi',             2),
  ('dividen-saham',            'pemasukan', 'Dividen Saham',              3),
  ('pendapatan-lain',          'pemasukan', 'Pendapatan Lain-Lain',       4),
  ('jual-aset-properti',       'pemasukan', 'Penjualan Aset / Properti',  5),
  ('hibah-hadiah-uang',        'pemasukan', 'Hibah / Hadiah Uang',       6),
  ('thr-tunjangan',            'pemasukan', 'THR / Tunjangan Tahunan',   7),
  ('freelance-side-hustle',    'pemasukan', 'Freelance / Side Hustle',    8),
  ('uang-saku-allowance',      'pemasukan', 'Uang Saku / Allowance',      9),
  ('cashback-refund',          'pemasukan', 'Cashback & Refund',          10),
  ('pendapatan-sewa',          'pemasukan', 'Pendapatan Sewa',            11)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 💰 TABUNGAN/ INVESTASI (11 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('safety-money',           'tabungan-invest', 'Safety Money',                1),
  ('deposito-bank',          'tabungan-invest', 'Deposito Bank',               2),
  ('reksadana',              'tabungan-invest', 'Reksadana',                   3),
  ('arisan',                 'tabungan-invest', 'Arisan',                      4),
  ('logam-mulia',            'tabungan-invest', 'Logam Mulia',                 5),
  ('saham',                  'tabungan-invest', 'Saham',                       6),
  ('crypto',                 'tabungan-invest', 'Crypto (Bitcoin, dll)',       7),
  ('p2p-lending',            'tabungan-invest', 'P2P Lending',                 8),
  ('obligasi-bonds',         'tabungan-invest', 'Obligasi / Bonds',            9),
  ('dana-pensiun',           'tabungan-invest', 'Dana Pensiun',               10),
  ('asuransi-unit-link',     'tabungan-invest', 'Asuransi Investasi (Unit Link)', 11)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 🍚 KEBUTUHAN POKOK (8 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('makanan',                'kebutuhan-pokok', 'Makanan',                          1),
  ('minuman',                'kebutuhan-pokok', 'Minuman',                          2),
  ('snack-cemilan',          'kebutuhan-pokok', 'Snack / Cemilan',                  3),
  ('kebutuhan-rumah-tangga', 'kebutuhan-pokok', 'Kebutuhan Rumah Tangga',           4),
  ('kebutuhan-dapur',        'kebutuhan-pokok', 'Kebutuhan Dapur',                  5),
  ('toiletries',             'kebutuhan-pokok', 'Toiletries (sabun, sampo, dll)',   6),
  ('laundry-cuci',           'kebutuhan-pokok', 'Laundry / Cuci',                   7),
  ('gas-lpg',                'kebutuhan-pokok', 'Gas LPG / Tabung',                 8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 🏠 TEMPAT TINGGAL (9 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('sewa-kpr',              'tempat-tinggal', 'Sewa / KPR Rumah',           1),
  ('maintenance-rumah',     'tempat-tinggal', 'Maintenance Rumah',          2),
  ('listrik',               'tempat-tinggal', 'Listrik',                    3),
  ('air',                   'tempat-tinggal', 'Air',                        4),
  ('internet',              'tempat-tinggal', 'Internet',                   5),
  ('iuran-rtrw',            'tempat-tinggal', 'Iuran RT/RW',                6),
  ('keamanan-security',      'tempat-tinggal', 'Keamanan (security)',        7),
  ('cleaning-pembantu',     'tempat-tinggal', 'Cleaning Service / Pembantu', 8),
  ('pbb',                   'tempat-tinggal', 'Pajak Bumi & Bangunan (PBB)', 9)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 🚌 TRANSPORTASI (8 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('bbm',                   'transportasi', 'BBM',                       1),
  ('ojek-online',           'transportasi', 'Ojek Online',              2),
  ('transportasi-umum',     'transportasi', 'Transportasi Umum',        3),
  ('maintenance-kendaraan', 'transportasi', 'Maintenance Kendaraan',    4),
  ('parkir',                'transportasi', 'Parkir',                    5),
  ('tol',                   'transportasi', 'Tol',                       6),
  ('asuransi-kendaraan',    'transportasi', 'Asuransi Kendaraan',       7),
  ('beli-kendaraan',        'transportasi', 'Beli Kendaraan',           8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 🩺 KESEHATAN (8 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('vitamin-obat',     'kesehatan', 'Vitamin & Obat',           1),
  ('asuransi-bpjs',    'kesehatan', 'Asuransi / BPJS',          2),
  ('periksa-dokter',   'kesehatan', 'Periksa ke Dokter',        3),
  ('rawat-inap',       'kesehatan', 'Rawat Inap / Hospital',    4),
  ('lab-test-mcu',     'kesehatan', 'Lab Test / Medical Check-up', 5),
  ('perawatan-gigi',   'kesehatan', 'Perawatan Gigi',           6),
  ('kacamata-lensa',   'kesehatan', 'Kacamata / Lensa',         7),
  ('psikolog-therapy', 'kesehatan', 'Psikolog / Therapy',       8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 💇 PERAWATAN DIRI (11 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('skincare',           'perawatan-diri', 'Skincare',                 1),
  ('barbershop-salon',   'perawatan-diri', 'Barbershop / Salon',       2),
  ('bodycare',           'perawatan-diri', 'Bodycare',                 3),
  ('gym',                'perawatan-diri', 'Gym',                      4),
  ('ipl',                'perawatan-diri', 'IPL',                      5),
  ('pilates',            'perawatan-diri', 'Pilates',                  6),
  ('treatment',          'perawatan-diri', 'Treatment',                7),
  ('cosmetics-makeup',   'perawatan-diri', 'Cosmetics / Makeup',       8),
  ('manicure-pedicure',  'perawatan-diri', 'Manicure / Pedicure',      9),
  ('massage-spa',        'perawatan-diri', 'Massage / Spa',            10),
  ('parfum',             'perawatan-diri', 'Parfum',                   11)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 📚 PENGEMBANGAN DIRI (8 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('pendidikan-pelatihan', 'pengembangan', 'Pendidikan / Pelatihan', 1),
  ('buku',                 'pengembangan', 'Buku',                   2),
  ('kursus',               'pengembangan', 'Kursus',                 3),
  ('aplikasi-belajar',     'pengembangan', 'Aplikasi Belajar',       4),
  ('webinar',              'pengembangan', 'Webinar',                5),
  ('sertifikasi',          'pengembangan', 'Sertifikasi',            6),
  ('seminar-workshop',     'pengembangan', 'Seminar / Workshop',     7),
  ('coaching-mentoring',   'pengembangan', 'Coaching / Mentoring',   8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 🎉 GAYA HIDUP/ HIBURAN (11 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('makan-di-luar',     'hiburan', 'Makan di Luar',                  1),
  ('coffee-shop',       'hiburan', 'Coffee Shop',                    2),
  ('subs-netflix-dll',  'hiburan', 'Subs (Nx, Spotify, dll.)',       3),
  ('liburan-traveling', 'hiburan', 'Liburan / Traveling',            4),
  ('hobi-rekreasi',     'hiburan', 'Hobi & Rekreasi',                5),
  ('cash-out',          'hiburan', 'Cash Out',                       6),
  ('movies-bioskop',    'hiburan', 'Movies / Bioskop',              7),
  ('game-steam',        'hiburan', 'Game / Steam',                   8),
  ('concert-event',     'hiburan', 'Concert / Event',                9),
  ('belanja-fashion',   'hiburan', 'Belanja Baju / Fashion',        10),
  ('hadiah-kado',       'hiburan', 'Hadiah / Kado (untuk orang lain)', 11)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- 💳 HUTANG / CICILAN (8 subkategori — tanpa Sumbangan & Donasi)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('pinjaman-modal',           'hutang', 'Pinjaman Modal Usaha',          1),
  ('cicilan-kredit-pinjaman',  'hutang', 'Cicilan Kredit / Pinjaman',    2),
  ('kpr',                      'hutang', 'KPR',                           3),
  ('cicilan-hp',               'hutang', 'Cicilan HP',                    4),
  ('cicilan-motor-mobil',      'hutang', 'Cicilan Motor / Mobil',         5),
  ('cicilan-furniture',        'hutang', 'Cicilan Furniture / Elektronik', 6),
  ('pajak-pbb-kendaraan',      'hutang', 'Pajak (PBB, Kendaraan)',        7),
  ('hutang-keluarga-teman',    'hutang', 'Hutang ke Keluarga / Teman',    8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- ⚠️ LAIN-LAIN (8 subkategori)
insert into public.template_subcategories (id, category_id, name, sort_order) values
  ('admin-bank',           'lain-lain', 'Admin Bank',                       1),
  ('pengeluaran-tak-terduga', 'lain-lain', 'Pengeluaran Tak Terduga',       2),
  ('bantu-keluarga',       'lain-lain', 'Bantu Keluarga',                   3),
  ('barang-rusak',         'lain-lain', 'Barang Rusak',                     4),
  ('donasi-sedekah',       'lain-lain', 'Donasi / Sedekah',                 5),
  ('denda',                'lain-lain', 'Denda (tilang, telat bayar, dll)',  6),
  ('pets',                 'lain-lain', 'Pets (makanan hewan, vet)',        7),
  ('lainnya',              'lain-lain', 'Lainnya',                          8)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true;

-- ============================================================
-- 7. SEED: Insert 22 Bank Options
-- ============================================================
insert into public.bank_options (id, name, type, category, is_popular, sort_order) values
  -- Major Banks
  ('bca',         'BCA',          'bank',    'major-bank',    true,  1),
  ('bri',         'BRI',          'bank',    'major-bank',    true,  2),
  ('bni',         'BNI',          'bank',    'major-bank',    true,  3),
  ('mandiri',     'MANDIRI',      'bank',    'major-bank',    true,  4),
  ('bsi',         'BSI',          'bank',    'major-bank',    true,  5),
  ('btn',         'BTN',          'bank',    'major-bank',    false, 6),
  ('cimb-niaga',  'CIMB NIAGA',   'bank',    'major-bank',    false, 7),
  ('mega',        'MEGA',         'bank',    'major-bank',    false, 8),
  ('permata',     'PERMATA',      'bank',    'major-bank',    false, 9),
  ('bank-daerah', '[BANK DAERAH]','bank',    'regional-bank', false, 10),
  -- Digital Banks
  ('seabank',     'SEABANK',      'bank',    'digital-bank',  true,  11),
  ('jago',        'JAGO',         'bank',    'digital-bank',  true,  12),
  ('neo',         'NEO',          'bank',    'digital-bank',  false, 13),
  ('superbank',   'SUPERBANK',    'bank',    'digital-bank',  false, 14),
  ('jenius',      'JENIUS',       'bank',    'digital-bank',  true,  15),
  -- E-wallets
  ('dana',        'DANA',         'ewallet', 'ewallet',       true,  16),
  ('gopay',       'GOPAY',        'ewallet', 'ewallet',       true,  17),
  ('ovo',         'OVO',          'ewallet', 'ewallet',       true,  18),
  ('linkaja',     'LINKAJA',      'ewallet', 'ewallet',       false, 19),
  ('shopeepay',   'SHOPEEPAY',    'ewallet', 'ewallet',       true,  20),
  ('astrapay',    'ASTRAPAY',     'ewallet', 'ewallet',       false, 21),
  -- Cash
  ('cash',        'CASH',         'cash',    'cash',          true,  22)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = true;

-- ============================================================
-- 8. UPDATE TRIGGER handle_new_user()
--    Auto-apply template saat user signup Google
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_whitelist record;
  v_template_cat record;
  v_cat_id uuid;
  v_count_accounts int := 0;
  v_count_categories int := 0;
  v_count_subcategories int := 0;
begin
  -- Cek whitelist untuk dapat info premium, theme, mascot yang di-assign
  select * into v_whitelist
  from public.allowed_emails
  where lower(email) = lower(new.email)
  limit 1;

  -- Insert profile dengan data dari whitelist
  insert into public.profiles (id, email, full_name, is_premium, selected_theme_id, selected_mascot_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(v_whitelist.is_premium, false),
    v_whitelist.assigned_theme,
    v_whitelist.assigned_mascot
  )
  on conflict (id) do update set
    is_premium = excluded.is_premium,
    selected_theme_id = coalesce(excluded.selected_theme_id, profiles.selected_theme_id),
    selected_mascot_id = coalesce(excluded.selected_mascot_id, profiles.selected_mascot_id);

  -- ============================================================
  -- AUTO-APPLY TEMPLATE: Copy categories + subcategories + accounts
  -- ============================================================
  
  -- 1. Copy template categories ke user categories
  insert into public.categories (user_id, name, type, icon, sort_order, is_active)
  select
    new.id,
    tc.name,
    tc.type,
    tc.icon,
    tc.sort_order,
    true
  from public.template_categories tc
  where tc.is_active = true
  on conflict (user_id, name) do nothing;
  
  select count(*) into v_count_categories from public.categories where user_id = new.id;
  
  -- 2. Copy template subcategories ke user subcategories
  insert into public.subcategories (user_id, category_id, name, default_amount, sort_order, is_active)
  select
    new.id,
    uc.id,
    ts.name,
    ts.default_amount,
    ts.sort_order,
    true
  from public.template_subcategories ts
  join public.template_categories tc on ts.category_id = tc.id
  join public.categories uc on uc.user_id = new.id and uc.name = tc.name
  where ts.is_active = true
  on conflict (user_id, category_id, name) do nothing;
  
  select count(*) into v_count_subcategories from public.subcategories where user_id = new.id;
  
  -- 3. Insert default accounts (5 popular banks + CASH)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order)
  select
    new.id,
    bo.name,
    bo.type::text,
    0,
    bo.sort_order
  from public.bank_options bo
  where bo.is_popular = true
    and bo.is_active = true
    and bo.type in ('bank', 'ewallet', 'cash')
  order by bo.sort_order
  on conflict (user_id, name) do nothing;
  
  select count(*) into v_count_accounts from public.accounts where user_id = new.id;
  
  -- 4. Insert investment accounts (6 default)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order)
  select
    new.id,
    ts.name,
    'investment',
    0,
    100 + ts.sort_order
  from public.template_subcategories ts
  where ts.category_id = 'tabungan-invest'
    and ts.is_active = true
  on conflict (user_id, name) do nothing;
  
  -- Re-count accounts
  select count(*) into v_count_accounts from public.accounts where user_id = new.id;
  
  -- Log ke PostgreSQL NOTICE (visible di Supabase logs)
  raise notice 'User % signup complete: % categories, % subcategories, % accounts',
    new.email, v_count_categories, v_count_subcategories, v_count_accounts;
  
  return new;
end;
$$;

-- ============================================================
-- 9. SEED: Insert Template Categories/Subcategories count verification
-- ============================================================
select 
  (select count(*) from public.template_categories where is_active = true) as total_categories,
  (select count(*) from public.template_subcategories where is_active = true) as total_subcategories,
  (select count(*) from public.bank_options where is_active = true) as total_bank_options;
