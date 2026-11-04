-- ============================================================
-- 04_SEED.SQL — Default Data
-- ============================================================
-- Run AFTER 01_schema.sql, 02_policies.sql, 03_functions.sql
--
-- Inserts default master data (quotes, emojis) + default
-- categories/subcategories for the FIRST user (you can also
-- skip this and use the Setup Wizard instead).
-- ============================================================

-- ============================================================
-- DAILY QUOTES (aesthetic quotes buat dashboard)
-- ============================================================
insert into public.daily_quotes (text, is_active) values
  ('Akhir bulan bukan alasan buat sedih, tapi momentum buat nguji konsistensi hemat kita.'),
  ('Setiap rupiah yang kamu catat adalah investasi untuk masa depanmu.'),
  ('Bukan tentang berapa banyak yang kamu punya, tapi tentang berapa banyak yang kamu kelola.'),
  ('Disiplin kecil hari ini = kebebasan finansial besok.'),
  ('Catat hari ini, tenang esok hari.'),
  ('Money flows where attention goes.'),
  ('Budgeting bukan ngerestren hidup, tapi ngebuka pintu freedom.'),
  ('Setiap transaksi adalah pilihan — pilihlah dengan bijak.'),
  ('Sedikit-sedikit jadi bukit, asal konsisten dicatat dengan benar.'),
  ('Financial peace isn''t the absence of bills, it''s being in control.'),
  ('Track today, thrive tomorrow.'),
  ('Ngelacak keuangan itu self-care versi finansial.'),
  ('Stay financially healthy, one transaction at a time.'),
  ('Beban berat jadi ringan kalau dibagi per kategori.'),
  ('Your future self will thank you for the discipline today.')
on conflict do nothing;

-- ============================================================
-- DASHBOARD EMOJIS (kategori indikator dashboard)
-- ============================================================
insert into public.dashboard_emojis (category, emoji, message) values
  ('safety', '🌸', 'Finansial aman dan terjaga'),
  ('safety', '✨', 'Kerja bagus, pertahankan!'),
  ('safety', '💖', 'Proud of you, Babe!'),
  ('warning', '⚠️', 'Perhatian: pengeluaran mendekati budget'),
  ('warning', '🔔', 'Sisa budget bulan ini tinggal dikit'),
  ('warning', '📉', 'Cashflow bulan ini minus, evaluation time'),
  ('success', '🎉', 'Target saving bulan ini tercapai!'),
  ('success', '🚀', 'Aset tumbuh, momentum positif!'),
  ('success', '🏆', 'Konsistensi terjaga, congrats!'),
  ('celebrate', '🌟', 'Special achievement unlocked!'),
  ('celebrate', '🥳', 'Bulan yang luar biasa!'),
  ('celebrate', '💎', 'Premium financial discipline')
on conflict do nothing;

-- ============================================================
-- DEFAULT CATEGORIES & SUBCATEGORIES
-- Mirror kategori yang ada di SUB_DATA original (transaksi.js)
-- Setelah user pertama signup via Google, jalankan scripts/seed-default-data.ts
-- untuk insert kategori/subkategori/akun default untuk user tersebut.
--
-- Cara pakai seed script:
--   1. Set MIGRATION_USER_ID di .env.local (dapat dari scripts/get-user-id.ts)
--   2. Run: bun run scripts/seed-default-data.ts
-- ============================================================
