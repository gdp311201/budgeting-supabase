# 🐘 Budgeting Master Sync — Starter Template

Personal budgeting app with beautiful themes, smart categorization, and detailed cashflow tracking.

Built with **Next.js 16 (App Router) + TypeScript + Supabase + Tailwind CSS 4 + shadcn/ui**.

This is a **starter template** for migrating an existing Google Sheets + Apps Script budgeting app to a modern, scalable Supabase-backed architecture.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start (15 minutes)](#quick-start-15-minutes)
- [Step-by-Step Setup](#step-by-step-setup)
- [Project Structure](#project-structure)
- [Database Schema & RPC Functions](#database-schema--rpc-functions)
- [Migrating Data from Google Sheets](#migrating-data-from-google-sheets)
- [Customization (Themes)](#customization-themes)
- [Going to Production](#going-to-production)
- [Roadmap / TODO](#roadmap-todo)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                        │
│  Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui        │
│  PWA (installable on phone home screen)                   │
└──────────────────────────────────────────────────────────┘
                          ↕ (Supabase JS SDK)
┌──────────────────────────────────────────────────────────┐
│  Backend (Supabase Cloud — Free tier)                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ PostgreSQL │  │ GoTrue Auth  │  │ Realtime         │  │
│  │ (with RLS) │  │ (Google OAuth)│  │ (subscriptions)  │  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
│                                                           │
│  RPC Functions:                                           │
│   - get_mutasi_bank(account_id, month, year)             │
│   - get_dashboard(month, year)                           │
│   - get_ereceipt(month, year)                             │
│   - get_search(month, year, keyword, sort)               │
│   - get_setup_data()                                      │
└──────────────────────────────────────────────────────────┘
```

**Why this stack?**
- **Supabase free tier** handles 50+ active users easily
- **PostgreSQL native SQL** (no lock-in — can migrate to any Postgres provider)
- **RLS (Row Level Security)** ensures each customer only sees their own data
- **Google OAuth** = no password management, secure & modern UX
- **Vercel free tier** = zero hosting cost until scale

---

## 🚀 Quick Start (15 minutes)

### Prerequisites
- Node.js 18+ and pnpm (`npm install -g pnpm`)
- A [Supabase account](https://supabase.com) (free)
- A [Vercel account](https://vercel.com) (free)
- A [GitHub account](https://github.com)

### 1. Create new GitHub repo
```bash
# Create a new repo on GitHub (don't init with README)
# Then push this template:
git init
git remote add origin https://github.com/YOUR_USERNAME/budgeting-supabase.git
git add .
git commit -m "Initial commit — budgeting starter template"
git push -u origin main
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Pick name: `budgeting-master-sync`
3. Pick region: **Singapore** (closest to Indonesia)
4. Set a strong database password (save it somewhere safe!)
5. Wait ~2 minutes for project to provision

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` → from Supabase Dashboard → Project Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → from Supabase Dashboard → Project Settings → API → anon public key

### 4. Run SQL schema in Supabase
Open Supabase Dashboard → SQL Editor → New Query, then run these files **in order**:

1. `supabase/01_schema.sql` — creates tables + auto-profile trigger
2. `supabase/02_policies.sql` — enables RLS + creates security policies
3. `supabase/03_functions.sql` — creates RPC functions for dashboard/mutasi/etc
4. `supabase/04_seed.sql` — inserts default quotes & emojis

### 5. Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable Google+ API
3. Create OAuth 2.0 credentials (Web application)
4. Authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
5. Copy Client ID + Secret
6. Back in Supabase → Authentication → Providers → Google → Enable → paste credentials

### 6. Run locally
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000 → should redirect to login → Google sign-in → dashboard!

### 7. Deploy to Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. Add Environment Variables (same as `.env.local`)
4. Deploy — Vercel auto-detects Next.js
5. Update Google OAuth redirect URIs with the new Vercel domain
6. Update Supabase Auth settings → add Vercel URL to "Site URL" + "Redirect URLs"

---

## 📁 Project Structure

```
budgeting-supabase/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (PWA manifest, theme color)
│   │   ├── page.tsx                # Home route — auth check, renders BudgetingApp
│   │   ├── manifest.ts             # PWA manifest (installable on phone)
│   │   ├── login/
│   │   │   ├── page.tsx            # Login page (server component)
│   │   │   └── login-button.tsx    # Google OAuth button (client)
│   │   └── auth/callback/
│   │       └── route.ts            # OAuth callback handler
│   │
│   ├── components/
│   │   ├── budgeting-app.tsx       # Main app shell (tab switcher)
│   │   ├── nav/
│   │   │   └── bottom-nav.tsx      # Floating bottom navigation
│   │   └── modules/
│   │       ├── dashboard-view.tsx  # Dashboard module (full implementation)
│   │       ├── input-view.tsx      # Input transaction form (skeleton)
│   │       ├── mutasi-view.tsx     # Bank mutation view (placeholder)
│   │       ├── receipt-view.tsx    # E-Receipt view (placeholder)
│   │       ├── search-view.tsx     # Search view (placeholder)
│   │       └── setup-view.tsx      # Setup panel (read-only display)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client (RSC, route handlers)
│   │   │   └── middleware.ts       # Auth middleware (session refresh + route protection)
│   │   ├── api/
│   │   │   ├── transactions.ts     # CRUD transactions
│   │   │   ├── dashboard.ts        # getDashboard() wrapper
│   │   │   ├── mutasi.ts           # getMutasiBank() wrapper
│   │   │   ├── receipt.ts          # getEReceipt() wrapper
│   │   │   ├── search.ts           # searchTransactions() wrapper
│   │   │   └── setup.ts            # getSetupData() + upsert helpers
│   │   ├── types/
│   │   │   └── database.ts         # TypeScript types for DB schema
│   │   ├── constants/
│   │   │   ├── categories.ts       # Default categories & subcategories
│   │   │   └── themes.ts           # 8 theme presets (elephant, cat, butterfly, etc)
│   │   └── utils/
│   │       └── format.ts           # formatRupiah, date helpers, escapeHtml
│   │
│   └── hooks/
│       ├── use-toast.ts            # Toast notifications (existing shadcn)
│       └── use-mobile.ts           # Mobile detection (existing shadcn)
│
├── supabase/                       # SQL files — single source of truth
│   ├── 01_schema.sql               # Tables + indexes + auto-profile trigger
│   ├── 02_policies.sql             # RLS policies (per-user isolation)
│   ├── 03_functions.sql            # RPC functions (get_dashboard, get_mutasi_bank, etc)
│   └── 04_seed.sql                 # Default quotes & emojis
│
├── scripts/                        # Node/Bun scripts (run with `bun run`)
│   ├── get-user-id.ts              # List all users (after first signup)
│   ├── seed-default-data.ts        # Insert default accounts/categories for a user
│   └── migrate-from-sheet.ts       # Import CSV from old Google Sheet
│
├── middleware.ts                   # Next.js middleware (auth protect routes)
├── .env.example                    # Copy to .env.local
├── package.json
└── README.md                       # This file
```

---

## 🗄️ Database Schema & RPC Functions

### Tables (in `supabase/01_schema.sql`)

| Table | Purpose | Maps to (Google Sheet) |
|---|---|---|
| `profiles` | User customization (theme, app_name, icon) | (new — replaces hardcoded config) |
| `accounts` | Bank/e-wallet/cash/investment accounts | SET_UP "Akun Bank" section |
| `categories` | Main categories (Pemasukan, Kebutuhan Pokok, dst) | DB "Dropdown Kategori" |
| `subcategories` | Sub-categories (Makanan, Listrik, dst) | DB "Dropdown Helper" |
| `budgets` | Monthly budget per subcategory | SET_UP budget nominal per sub |
| `transactions` | All recorded transactions (no helper columns!) | TRANSAKSI sheet (A-E only) |
| `daily_quotes` | Aesthetic quotes for dashboard | DB "Daily Quotes" |
| `dashboard_emojis` | Emoji indicators for dashboard | DB "Dropdown Emot Icon" |

### RPC Functions (in `supabase/03_functions.sql`)

These functions replace your Google Sheet DB tab formulas. Frontend calls them via `supabase.rpc()`.

| Function | Returns | Replicates |
|---|---|---|
| `get_mutasi_bank(account_id, month, year)` | JSON with saldo awal/akhir + transactions | `03_ConfigurasiMutasiBankUI.gs` |
| `get_dashboard(month, year)` | JSON with total aset, cashflow, top 5 expenses | `05_DashboardUI.gs` |
| `get_ereceipt(month, year)` | JSON with summary + detailed items | `04_E_Receipt.gs` |
| `get_search(month, year, keyword, sort)` | JSON with filtered transactions | `06_SearchUI.gs` |
| `get_setup_data()` | JSON with accounts/categories/subcategories/budgets | `07_SetUpUI.gs` |

---

## 📦 Migrating Data from Google Sheets

After your first user signs up via Google login:

### Step 1: Get user ID
```bash
bun run scripts/get-user-id.ts
# Copy the UUID of your user
```

### Step 2: Seed default accounts & categories
```bash
# In .env.local:
SEED_USER_ID=the-uuid-you-copied

bun run scripts/seed-default-data.ts
```

### Step 3: Export TRANSAKSI sheet as CSV
1. Open your Google Sheet → TRANSAKSI tab
2. File → Download → Comma Separated Values (.csv)
3. Save as `data/transaksi-export.csv` in this repo

### Step 4: Run migration
```bash
# In .env.local:
MIGRATION_USER_ID=the-uuid-you-copied
SHEET_CSV_PATH=./data/transaksi-export.csv

bun run scripts/migrate-from-sheet.ts
```

### Step 5: Verify
- Open Supabase Dashboard → Table Editor → transactions
- Count should match your sheet
- Open app → Dashboard → select month/year → should show data!

---

## 🎨 Customization (Themes)

The app supports 8 built-in theme presets (see `src/lib/constants/themes.ts`):

| Theme | Icon | Vibe |
|---|---|---|
| 🐘 Elephant Pink (default) | Elephant | Cute & feminine |
| 🐱 Cat Mocha | Cat | Cozy warm |
| 🦋 Butterfly Ocean | Butterfly | Calm fresh |
| 🌊 Wave Sunset | Wave | Vibrant energetic |
| 🌿 Forest Sage | Leaf | Natural zen |
| 🌙 Moon Lavender | Moon | Dreamy minimal |
| 🌸 Sakura Dream | Sakura | Soft pastel |
| ⭐ Star Gold | Star | Luxe premium |

### Apply a theme for a specific user
Update their `profiles` row:
```sql
update profiles
set
  icon_name = 'cat',
  app_name = 'Sarah''s Money Tracker',
  palette = '{"primary":"#b8856c","accent":"#8b6f4e"}'::jsonb
where id = '<user-uuid>';
```

---

## 🚦 Going to Production

### Pre-launch checklist
- [ ] All SQL files run in production Supabase (not just dev)
- [ ] Google OAuth redirect URIs include production Vercel domain
- [ ] Supabase Auth → URL Configuration → Site URL = production URL
- [ ] Environment variables set in Vercel (Project Settings → Env Vars)
- [ ] PWA icons added to `public/icons/` (192x192, 512x512, 512x512 maskable)
- [ ] Test login flow end-to-end on mobile + desktop
- [ ] Test all 5 views: dashboard, input, mutasi, receipt, search
- [ ] Setup panel accessible via long-press asset card
- [ ] Verify RLS works (try accessing other user's data — should fail)

### Cost projection (50 users)
- Vercel free tier: $0
- Supabase free tier: $0 (500MB DB, 5GB bandwidth — enough)
- Domain (optional): ~Rp 150K/year
- **Total: Rp 0/month for first 50 users**

After 50 users, consider:
- Supabase Pro ($25/month) — 8GB DB, 250GB bandwidth
- Vercel Pro ($20/month) — only if bandwidth exceeds 100GB
- Custom domain

---

## 🗺️ Roadmap / TODO

### Already implemented
- [x] Next.js 16 App Router + TypeScript + Tailwind 4
- [x] Supabase Auth (Google OAuth) + session management
- [x] Route protection via middleware
- [x] Database schema (8 tables, all with RLS)
- [x] 5 RPC functions (replicating Apps Script logic)
- [x] Dashboard view (full implementation with asset card + top 5)
- [x] Setup panel (read-only — long-press asset card to open)
- [x] Migration script (CSV → Supabase)
- [x] Default data seeding script
- [x] 8 theme presets
- [x] PWA manifest (installable on phone home screen)

### TODO (implement as you build out)
- [ ] Full Setup panel edit mode (add/edit/delete accounts, categories, budgets)
- [ ] Input view: resolve category_id/account_id dynamically (currently stub)
- [ ] Mutasi view: wire up to `getMutasiBank()` RPC
- [ ] Receipt view: wire up to `getEReceipt()` RPC + html2canvas download
- [ ] Search view: full implementation with swipe-to-edit/delete (Gmail-style)
- [ ] Theme editor UI (live preview + save to profile)
- [ ] Realtime subscriptions (auto-refresh dashboard when new transaction added)
- [ ] PWA service worker (offline caching)
- [ ] Custom app icons (replace placeholder with branded PNG icons)
- [ ] Customer onboarding wizard (signup flow → setup theme → setup accounts)
- [ ] Capacitor wrapper (for App Store / Play Store distribution)

---

## 🆘 Troubleshooting

### "Invalid API key" error
- Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Restart dev server after changing env

### Google login not working
- Check Google Cloud Console → OAuth credentials → redirect URIs include `http://localhost:3000/auth/callback`
- Check Supabase → Authentication → Providers → Google → enabled + credentials set
- Check Supabase → Authentication → URL Configuration → Site URL = `http://localhost:3000`

### "Row Level Security" errors
- Make sure you ran `02_policies.sql` after `01_schema.sql`
- Check user is authenticated (login flow works)

### Dashboard shows 0 / empty
- Make sure `04_seed.sql` ran (quotes/emojis needed)
- Run `bun run scripts/get-user-id.ts` — verify your user exists
- Run `bun run scripts/seed-default-data.ts` — verify accounts/categories created
- Check Supabase Dashboard → transactions table — has data?

### Migration script fails
- Verify CSV format matches expected (5 columns: TGL, KATEGORI, SUB, NOMINAL, AKUN)
- Make sure all account names in CSV exist in `accounts` table (case-insensitive)
- Make sure all category names in CSV match `categories` table exactly

---

## 📝 License & Credits

Built as a personal finance tool. Adapt freely for your own use.

**Original concept**: Budgeting Master Sync (Indonesian personal budgeting app)
**Tech**: Next.js, Supabase, Tailwind CSS, shadcn/ui
**Inspired by**: Glass-morphism UI, mobile-first design, Instagram-style swipe navigation

---

## 🤝 Need Help?

If you're the original developer migrating from Google Sheets + Apps Script:
1. Read this README end-to-end
2. Follow [Quick Start](#quick-start-15-minutes)
3. Run scripts in order: `get-user-id.ts` → `seed-default-data.ts` → `migrate-from-sheet.ts`
4. Compare old Apps Script responses with new Supabase RPC outputs to verify parity

Happy budgeting! 🐘💰
