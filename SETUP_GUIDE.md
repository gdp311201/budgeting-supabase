# 📖 SETUP GUIDE — Step-by-Step dari Nol

Panduan super detail untuk setup project Budgeting Master Sync dari awal sampai jalan. Cocok untuk yang belum pernah pakai Supabase / Vercel / GitHub sebelumnya.

**Estimasi waktu**: 60-90 menit untuk first-time setup.

---

## 📋 Prerequisites (Yang Lu Butuhin Sebelum Mulai)

1. **Akun GitHub** — daftar di [github.com](https://github.com) (free)
2. **Akun Supabase** — daftar di [supabase.com](https://supabase.com) (free, bisa login pakai GitHub)
3. **Akun Vercel** — daftar di [vercel.com](https://vercel.com) (free, bisa login pakai GitHub)
4. **Akun Google Cloud Console** — buat OAuth credentials (free)
5. **pnpm installed** di komputer lu:
   ```bash
   # Mac/Linux
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   # Windows (PowerShell)
   iwr https://get.pnpm.io/install.ps1 -useb | iex
   ```

---

## 🗂️ Step 1 — Bikin GitHub Repository Baru

### 1.1 Bikin repo baru di GitHub
1. Buka [github.com/new](https://github.com/new)
2. **Repository name**: `budgeting-supabase`
3. **Description**: `Personal budgeting app with Supabase backend`
4. **Visibility**: Private (recommended)
5. **Jangan centang**: "Add a README", "Add .gitignore", "Choose license" (akan di-handle oleh template ini)
6. Klik **Create repository**

### 1.2 Push starter template ke GitHub
Clone repo yang baru dibuat ke komputer, copy semua file dari starter template, lalu push:

```bash
# Clone repo lu (ganti USERNAME)
git clone https://github.com/USERNAME/budgeting-supabase.git
cd budgeting-supabase

# Copy semua file dari starter template ke sini
# (asumsi template ada di folder lain, copy semuanya kecuali .git/)

# Tambah semua file
git add .

# Commit pertama
git commit -m "Initial commit — Budgeting Master Sync starter template"

# Push ke GitHub
git push origin main
```

✅ **Hasil**: Repo GitHub lu udah punya semua starter template code.

---

## 🗄️ Step 2 — Bikin Supabase Project

### 2.1 Bikin project baru
1. Buka [supabase.com](https://supabase.com) → login pakai GitHub
2. Klik **New Project** (tombol hijau di kanan atas)
3. Isi form:
   - **Name**: `budgeting-master-sync`
   - **Database Password**: Buat password kuat (save di password manager!). **Tidak bisa di-reset tanpa ini**.
   - **Region**: `Southeast Asia (Singapore)` — paling deket Indonesia, latency rendah
   - **Pricing Plan**: Free (cukup buat 50+ user pertama)
4. Klik **Create new project**
5. **Tunggu 2-3 menit** sampai project selesai provision. Status: "Project is ready" di pojok kanan atas.

### 2.2 Catat Project URL + anon key
1. Di sidebar kiri: klik **Project Settings** (icon gear) → **API**
2. Catat 3 nilai ini (simpan di notepad sementara):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOi...` (string panjang)
   - **service_role** key: `eyJhbGciOi...` (string panjang, JANGAN PERNAH expose ke browser!)
3. ⚠️ **PENTING**: service_role key itu seperti "root password" database lu. Hanya untuk server-side code (admin panel, migration scripts). JANGAN commit ke git, JANGAN taruh di `NEXT_PUBLIC_*` env var.

✅ **Hasil**: Supabase project siap, punya URL + 2 keys.

---

## 📊 Step 3 — Run SQL Schema di Supabase

Starter template ini punya 7 file SQL di folder `supabase/`. Lu harus run **berurutan** dari 01 sampai 07 di Supabase SQL Editor.

### 3.1 Buka SQL Editor
1. Di Supabase Dashboard, sidebar kiri → **SQL Editor** (icon `</>`)
2. Klik **New query** (tombol di kanan atas)

### 3.2 Run file `01_schema.sql`
1. Buka file `supabase/01_schema.sql` di code editor lu
2. Copy semua isinya (Ctrl+A → Ctrl+C)
3. Paste ke Supabase SQL Editor (panel putih besar)
4. Klik tombol **Run** (tombol hijau di kanan bawah, atau Ctrl+Enter)
5. Tunggu sampai muncul **"Success. No rows returned"** di panel output bawah
6. Kalau error: baca pesan error, kemungkinan typo. Fix dan re-run.

### 3.3 Ulangi untuk file 02-07
Lakukan hal yang sama untuk file berikut (urutannya PENTING):

| File | Tujuan |
|---|---|
| `02_policies.sql` | Enable Row Level Security + policies |
| `03_functions.sql` | Create 5 RPC functions (dashboard, mutasi, dll) |
| `04_seed.sql` | Insert default quotes & emojis |
| `05_allowed_emails.sql` | Whitelist table + trigger (Elsa auto-seeded) |
| `06_themes.sql` | 8 free + 5 premium themes |
| `07_mascots.sql` | 10 mascots + private elephant rule |

✅ **Hasil**: Database schema complete. Tables, policies, functions, seed data, whitelist (dengan Elsa), themes, mascots.

### 3.4 Verifikasi schema
1. Sidebar kiri → **Table Editor**
2. Cek apakah ada tabel-tabel berikut:
   - `profiles`, `accounts`, `categories`, `subcategories`, `budgets`, `transactions`
   - `daily_quotes`, `dashboard_emojis`
   - `allowed_emails` (harus ada 1 row: email Elsa)
   - `themes` (harus ada 8 rows: 3 free + 5 premium)
   - `mascots` (harus ada 10 rows)
   - `mascot_whitelist` (harus ada 1 row: elephant → elsa email)

✅ **Hasil**: Database verified, semua tabel ada dengan data seed.

---

## 🔑 Step 4 — Setup Google OAuth

### 4.1 Bikin Google Cloud Project
1. Buka [console.cloud.google.com](https://console.cloud.google.com/)
2. Klik dropdown project di top bar → **New Project**
3. **Project name**: `budgeting-auth`
4. Klik **Create**
5. Tunggu sebentar, lalu klik **Select project** / buka project baru tersebut

### 4.2 Configure OAuth consent screen
1. Sidebar kiri → **APIs & Services** → **OAuth consent screen**
2. Pilih **External** → klik **Create**
3. Isi form:
   - **App name**: `Budgeting Master Sync`
   - **User support email**: email lu
   - **Developer contact information**: email lu
4. Klik **Save and Continue**
5. Di **Scopes** page: scroll ke bawah, klik **Add or remove scopes**
   - Centang: `userinfo.email`, `userinfo.profile`, `openid`
   - Klik **Update** → **Save and Continue**
6. Di **Test users** page: klik **Add users**
   - Tambah email lu sendiri (untuk testing)
   - Klik **Save and Continue**
7. Review summary → **Back to Dashboard**

⚠️ **Catatan**: App lu status "Testing". Cuma email yang udah lu daftarin di "Test users" yang bisa login. Untuk production (public), harus publish app (verification Google — skip dulu buat MVP).

### 4.3 Bikin OAuth Credentials
1. Sidebar kiri → **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** (atas) → **OAuth client ID**
3. Pilih **Application type**: `Web application`
4. **Name**: `Budgeting Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app` (akan diisi setelah deploy ke Vercel, skip dulu)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback` (akan diisi setelah deploy, skip dulu)
7. Klik **Create**
8. **Modal muncul dengan Client ID + Client Secret** — copy keduanya (simpan di notepad)

✅ **Hasil**: Google OAuth credentials siap. Nanti di-set di Supabase Auth.

---

## 🔗 Step 5 — Connect Google OAuth ke Supabase

1. Kembali ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project `budgeting-master-sync`
3. Sidebar kiri → **Authentication** → **Providers**
4. Cari **Google** di list → klik enable toggle
5. Masukkan:
   - **Client ID**: (yang dari Google Cloud Console)
   - **Client Secret**: (yang dari Google Cloud Console)
6. Klik **Save**
7. **IMPORTANT**: Copy **Redirect URL** yang ditampilin Supabase (format: `https://xxxxx.supabase.co/auth/v1/callback`)
8. Kembali ke Google Cloud Console → **Credentials** → edit OAuth client yang tadi dibikin
9. Tambahkan redirect URL Supabase itu ke **Authorized redirect URIs**
10. Klik **Save**

### 5.1 Configure URL di Supabase Auth
1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:3000` (untuk dev), nanti ganti ke Vercel URL setelah deploy
3. **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
4. Klik **Save**

✅ **Hasil**: Supabase + Google OAuth udah terhubung. Bisa test login sekarang.

---

## 🖥️ Step 6 — Setup Local Development Environment

### 6.1 Copy starter template ke komputer
Kalau belum, clone repo yang lu bikin di Step 1:
```bash
git clone https://github.com/USERNAME/budgeting-supabase.git
cd budgeting-supabase
```

### 6.2 Install dependencies
```bash
pnpm install
```

### 6.3 Setup environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` dengan nilai-nilai yang lu kumpulin:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (anon key dari Step 2.2)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (service_role key dari Step 2.2, RAHASIA!)

# Admin
ADMIN_EMAILS=elsakristya19@gmail.com,your-email@gmail.com

# App
NEXT_PUBLIC_APP_NAME="Budgeting Master Sync"
```

⚠️ **PENTING**:
- File `.env.local` JANGAN PERNAH di-commit ke git (sudah di-ignore oleh `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` JANGAN diprefix dengan `NEXT_PUBLIC_` — kalau diprefix, akan ter-expose ke browser

### 6.4 Run dev server
```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

✅ **Hasil**: App jalan di local. Harusnya muncul halaman Login dengan tombol "Sign in with Google".

---

## 🧪 Step 7 — Test Login Flow (Pertama Kali)

### 7.1 Coba login pertama
1. Buka [http://localhost:3000](http://localhost:3000)
2. Karena `ADMIN_EMAILS` di env punya email Elsa, dia udah ada di `allowed_emails` (di-seed sama SQL 05)
3. Tapi email lu sendiri belum ada di whitelist!
4. Coba login pakai email lu sendiri → harusnya **DITOLAK** dengan message:
   > "Email your-email@gmail.com belum di-whitelist. Hubungi admin @julyo untuk akses."

✅ **Hasil**: Whitelist protection bekerja!

### 7.2 Tambah email lu sendiri ke whitelist
**Cara A — via Supabase Dashboard (manual)**:
1. Supabase → **Table Editor** → `allowed_emails`
2. Klik **Insert row**
3. Isi:
   - `email`: email lu (lowercase)
   - `full_name`: nama lu
   - `is_premium`: true
   - `is_active`: true
   - `notes`: "Owner"
4. Klik **Save**

**Cara B — via Admin Panel (recommended setelah lu login sebagai Elsa)**:
1. Login dulu sebagai Elsa (karena dia udah di-whitelist)
2. Buka `http://localhost:3000/?admin=1`
3. Tambah email lu sendiri dengan checkbox `Premium user` centang
4. Logout, login lagi pakai email lu → harusnya berhasil

✅ **Hasil**: Email lu sendiri udah ada di whitelist. Bisa login sebagai admin.

---

## 🌱 Step 8 — Seed Default Data untuk User Pertama

Setelah email lu berhasil login pertama kali, profile-nya auto-created (via trigger `handle_new_user`). Tapi akun bank, kategori, dan subkategori belum ada.

### 8.1 Get user ID lu
```bash
bun run scripts/get-user-id.ts
```

Output:
```
📋 Users in your Supabase project:
──────────────────────────────────────────────────────────────────────────────
ID                                      EMAIL                           NAME                APP_NAME
...
abc-123-def-456                         your-email@gmail.com            Your Name           My Budgeting
```

Copy UUID (kolom ID) untuk email lu.

### 8.2 Set env + run seed
Edit `.env.local`:
```bash
SEED_USER_ID=abc-123-def-456   # ganti dengan UUID yang lu dapat
```

Jalankan:
```bash
bun run scripts/seed-default-data.ts
```

✅ **Hasil**: 5 akun bank + 6 akun investasi + 12 kategori + ~50 subkategori inserted untuk user lu.

### 8.3 Verifikasi di Supabase
1. Supabase → **Table Editor** → `accounts` → harusnya ada 11 rows (5 bank + 6 invest)
2. Table `categories` → harusnya ada 12 rows
3. Table `subcategories` → harusnya ada ~50 rows

---

## 📦 Step 9 — Migrate Data dari Google Sheet Lama

### 9.1 Export TRANSAKSI sheet ke CSV
1. Buka Google Sheet budgeting lu yang lama
2. Buka tab `TRANSAKSI`
3. File → Download → Comma Separated Values (.csv)
4. Save sebagai `data/transaksi-export.csv` di repo lu (folder `data/` sudah di-ignore, aman)

### 9.2 Run migration
Edit `.env.local`:
```bash
MIGRATION_USER_ID=abc-123-def-456   # sama dengan SEED_USER_ID
SHEET_CSV_PATH=./data/transaksi-export.csv
```

Jalankan:
```bash
bun run scripts/migrate-from-sheet.ts
```

Output expected:
```
============================================================
📦 Migrating TRANSAKSI from CSV → Supabase
============================================================
   CSV: ./data/transaksi-export.csv
   User ID: abc-123-def-456

🔍 Loading existing accounts & categories...
   ✓ Found 11 accounts, 12 categories

📖 Parsing CSV...
   ✓ Parsed 375 rows

🔄 Transforming rows...
   ✓ 372 transactions ready to insert

💾 Inserting to Supabase (batch of 500)...
   ✓ Inserted 372/372

============================================================
✅ Migration complete!
============================================================
   Total inserted: 372
   Total skipped: 3
```

✅ **Hasil**: Semua transaksi dari sheet lama udah ada di Supabase.

---

## 🚀 Step 10 — Deploy ke Vercel

### 10.1 Push latest code ke GitHub
Pastikan `.env.local` udah di-set, lalu:
```bash
git add .
git commit -m "Setup Supabase + Google OAuth + whitelist"
git push origin main
```

### 10.2 Connect repo ke Vercel
1. Buka [vercel.com](https://vercel.com) → login pakai GitHub
2. Klik **Add New Project** → **Import Git Repository**
3. Pilih repo `budgeting-supabase` dari list
4. **Configure Project**:
   - Framework Preset: `Next.js` (auto-detected)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install` (pilih pnpm kalau Vercel detect)
5. **Environment Variables** — klik toggle "Environment Variables", tambah:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://YOUR-PROJECT-REF.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOi...` (anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOi...` (service_role key)
   - `ADMIN_EMAILS` = `elsakristya19@gmail.com,your-email@gmail.com`
   - `NEXT_PUBLIC_APP_NAME` = `Budgeting Master Sync`
6. Klik **Deploy**
7. **Tunggu 2-3 menit** sampai build success. Akan dapat URL seperti `https://budgeting-supabase-xxx.vercel.app`

### 10.3 Update OAuth redirect URIs
Setelah Vercel dapet domain, update 2 tempat:

**Google Cloud Console**:
1. APIs & Services → Credentials → edit OAuth client
2. Tambah ke **Authorized JavaScript origins**: `https://budgeting-supabase-xxx.vercel.app`
3. Tambah ke **Authorized redirect URIs**: `https://budgeting-supabase-xxx.vercel.app/auth/callback`
4. Klik **Save**

**Supabase Auth settings**:
1. Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://budgeting-supabase-xxx.vercel.app`
3. Tambah **Redirect URLs**: `https://budgeting-supabase-xxx.vercel.app/auth/callback`
4. Klik **Save**

✅ **Hasil**: App lu LIVE di production URL! Bisa diakses siapa aja (tapi cuma email yang di-whitelist yang bisa signup).

---

## 🎨 Step 11 — Test Personalisasi (Tema + Maskot)

### 11.1 Login sebagai user lu (yang udah is_premium=true)
1. Buka production URL di HP / laptop
2. Klik **Sign in with Google**
3. Login pakai email lu yang udah di-whitelist

### 11.2 Test Theme Picker
1. Setelah login, di header ada ikon 🎨 (di sebelah nama app)
2. Klik → buka Theme Picker modal
3. **Tab "Tema Warna"**: 8 tema tersedia (3 free + 5 premium)
   - Kalau lu is_premium=true: semua unlocked
   - User free: 5 tema premium akan ada 🔒 icon
4. Klik tema → app langsung berubah (warna primary, gradient, glass blur)
5. Klik tema lain → app update real-time

### 11.3 Test Mascot Selector
1. Di Theme Picker, klik tab **"Maskot"**
2. 9 maskot tersedia (kucing, kupu-kupu, kelinci, dll)
3. **Elephant tidak muncul** untuk email selain Elsa (private!)
4. Login sebagai Elsa → elephant muncul, bisa dipilih
5. Pilih maskot → icon di header berubah

✅ **Hasil**: Personalisasi bekerja. Premium lock, private mascot, semuanya functional.

---

## ⚙️ Step 12 — Test Admin Panel

### 12.1 Akses admin panel
1. Login sebagai email yang ada di `ADMIN_EMAILS` env
2. Buka URL: `https://YOUR-VERCEL-DOMAIN.vercel.app/?admin=1`
3. Atau manual: tambah `?admin=1` di akhir URL app

### 12.2 Test manage whitelist
1. Form **Tambah Email ke Whitelist**:
   - Email: `sarah@gmail.com` (misalnya customer baru)
   - Nama: `Sarah`
   - Centang: Premium user
   - Pilih tema: `🌸 Rose Gold Luxe ⭐`
   - Pilih maskot: `🐱 Cat`
   - Klik **➕ Tambah ke Whitelist**
2. Section **Email Terdaftar** akan muncul entry baru
3. Test: logout, kasih link ke Sarah, Sarah signup Google → harusnya berhasil & otomatis dapat tema + maskot yang di-assign
4. Test deactivation: klik tombol **🚫 Nonaktifkan** di sebelah email Sarah → Sarah tidak bisa login lagi
5. Test reactivate: klik **✅ Aktifkan** → Sarah bisa login lagi
6. Test grant elephant: klik **🐘 Grant Gajah** → Sarah bisa pilih maskot gajah

✅ **Hasil**: Admin panel functional. Bisa manage whitelist customer tanpa SQL query manual.

---

## 🎉 Selesai!

App lu udah LIVE dengan:
- ✅ Google OAuth login
- ✅ Email whitelist (anti share-link abuse)
- ✅ Glassmorphism iOS-style UI
- ✅ 8 theme presets (3 free + 5 premium women)
- ✅ 10 mascots (1 private, 3 premium, 6 public)
- ✅ Admin panel buat manage whitelist
- ✅ Dashboard, mutasi, receipt, search, setup (skeleton ready)
- ✅ Migrated data dari Google Sheet lama

---

## 🆘 Troubleshooting

### "Email belum di-whitelist" padahal email udah di-add
- Cek Supabase → Table Editor → `allowed_emails` → email ada di situ?
- Cek `is_active` = true (bukan false/deactivated)
- Cek emailnya **lowercase sama persis** (case sensitive di Supabase Auth)

### Login Google error "redirect_uri_mismatch"
- Cek Google Cloud Console → OAuth credentials → redirect URIs
- Pastikan `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback` ada di list
- Pastikan Supabase → Authentication → URL Configuration → Site URL = production URL

### Admin panel error "SUPABASE_SERVICE_ROLE_KEY is not set"
- Cek `.env.local` ada `SUPABASE_SERVICE_ROLE_KEY=...`
- Kalau di Vercel: cek Project Settings → Environment Variables → ada `SUPABASE_SERVICE_ROLE_KEY`?
- Restart dev server setelah edit env: `Ctrl+C` → `pnpm dev` lagi

### Theme picker button tidak muncul di header
- Pastikan lu **login** (bukan di halaman login)
- Cek console browser (F12) — ada error JavaScript?
- Refresh page setelah login

### Migration script error "Unknown account" / "Unknown category"
- Run `bun run scripts/seed-default-data.ts` dulu (Step 8.2)
- Cek nama akun di CSV sama persis dengan yang ada di database (case-insensitive)
- Misal: CSV ada "SEABANK" tapi di DB nama "Seabank" → seharusnya OK karena case-insensitive

### Data tidak muncul di dashboard
- Pastikan migration script sukses (Step 9.2)
- Cek Supabase → Table Editor → `transactions` → ada row?
- Buka Dashboard di app, klik "📊 Tampilkan Dashboard" → cek error di console

---

## 📞 Butuh Bantuan?

Kalau stuck di salah satu step:
1. Buka issue di GitHub repo lu (kalau private, lu sendiri yang dokumentasikan errornya)
2. Screenshot error message
3. Cek Supabase logs: Dashboard → Logs → select relevant service
4. Cek Vercel logs: Dashboard → project lu → Logs tab

Happy budgeting! 🐘💰
