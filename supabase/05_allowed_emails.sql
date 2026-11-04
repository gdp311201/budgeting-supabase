-- ============================================================
-- 05_ALLOWED_EMAILS.SQL — Email Whitelist (Anti Share-Link Abuse)
-- ============================================================
-- Run AFTER 01_schema.sql
--
-- Konsep:
--   Hanya email yang sudah lu daftarin di tabel ini yang bisa signup.
--   Kalau orang lain coba signup Google dengan email lain → DITOLAK
--   dengan message yang jelas.
--
-- Cara pakai:
--   INSERT INTO allowed_emails (email, full_name, is_premium, assigned_theme, assigned_mascot, notes)
--   VALUES ('sarah@gmail.com', 'Sarah', true, 'rose-gold-luxe', 'cat', 'Customer VIP - bayar 250K');
--
-- Buat admin panel di /admin untuk manage ini (UI built-in app).
-- ============================================================

-- ============================================================
-- 1. ALLOWED_EMAILS table
-- ============================================================
create table if not exists public.allowed_emails (
  email text primary key,
  full_name text,
  is_premium boolean not null default false,
  assigned_theme text,                    -- slug tema yang di-assign saat invite
  assigned_mascot text,                   -- slug maskot yang di-assign saat invite
  invited_by text,                        -- email lu sebagai inviter
  invited_at timestamptz not null default now(),
  notes text,                             -- "beta tester", "customer vip", dst
  is_active boolean not null default true  -- kalau false, user nggak bisa login walau email ada
);

-- Index buat pencarian cepat
create index if not exists idx_allowed_emails_active on public.allowed_emails(is_active) where is_active = true;

-- ============================================================
-- 2. WHITELIST CHECK TRIGGER
--    Reject signup kalau email nggak di-whitelist
-- ============================================================
create or replace function public.check_email_whitelist()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_active boolean;
begin
  -- Cek apakah email ada di whitelist DAN masih aktif
  select is_active into v_is_active
  from public.allowed_emails
  where lower(email) = lower(new.email)
  limit 1;

  if v_is_active is null then
    -- Email nggak di-whitelist sama sekali
    raise exception 'EMAIL_NOT_WHITELISTED:Email % belum di-whitelist. Hubungi admin @julyo untuk akses.', new.email;
  end if;

  if v_is_active = false then
    -- Email di-whitelist tapi udah di-deactivate
    raise exception 'EMAIL_DEACTIVATED:Akses untuk % sudah dinonaktifkan. Hubungi admin @julyo.', new.email;
  end if;

  return new;
end;
$$;

-- Drop trigger lama kalau ada (saat re-run script)
drop trigger if exists on_auth_user_created_whitelist_check on auth.users;

-- Bikin trigger BEFORE insert (sebelum user dibuat, supaya bisa reject)
create trigger on_auth_user_created_whitelist_check
  before insert on auth.users
  for each row execute function public.check_email_whitelist();

-- ============================================================
-- 3. SEED: Default allowed emails
-- ============================================================

-- ⚠️ GANTI EMAIL INI DENGAN EMAIL LU SENDIRI (admin) ⚠️
INSERT INTO public.allowed_emails (email, full_name, is_premium, assigned_theme, assigned_mascot, invited_by, notes)
VALUES (
  'elsakristya19@gmail.com',
  'Elsa',
  true,
  'elephant-pink',
  'elephant',
  'admin',
  '👑 Original VIP user — girlfriend of founder. Has exclusive elephant mascot.'
) ON CONFLICT (email) DO UPDATE SET
  is_premium = true,
  assigned_theme = 'elephant-pink',
  assigned_mascot = 'elephant',
  notes = '👑 Original VIP user — girlfriend of founder. Has exclusive elephant mascot.';

-- ⚠️ TAMBAHKAN EMAIL LU SENDIRI (admin/owner) — ganti dengan email lu ⚠️
-- INSERT INTO public.allowed_emails (email, full_name, is_premium, invited_by, notes)
-- VALUES ('YOUR-EMAIL@gmail.com', 'Julyo (Owner)', true, 'system', 'Owner & admin');

-- ============================================================
-- 4. RLS POLICIES untuk allowed_emails
--    - User cuma bisa SELECT (cek sendiri apakah dia di-whitelist)
--    - Hanya admin (service_role) yang bisa INSERT/UPDATE/DELETE
-- ============================================================
alter table public.allowed_emails enable row level security;

-- User bisa SELECT row miliknya sendiri (untuk cek status premium mereka)
drop policy if exists "Allowed emails: select own" on public.allowed_emails;
create policy "Allowed emails: select own"
  on public.allowed_emails for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Semua operasi write (insert/update/delete) hanya via service_role
-- (dipake sama admin panel di /admin yang lu kelola lewat secret key)
drop policy if exists "Allowed emails: admin write" on public.allowed_emails;
create policy "Allowed emails: admin write"
  on public.allowed_emails for all
  to service_role
  using (true);
