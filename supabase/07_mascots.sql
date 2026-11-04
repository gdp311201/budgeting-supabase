-- ============================================================
-- 07_MASCOTS.SQL — Mascot library + private elephant rule
-- ============================================================
-- Run AFTER 01_schema.sql, 05_allowed_emails.sql, 06_themes.sql
--
-- Konsep:
--   Tabel "mascots" nyimip daftar maskot yang bisa dipilih user.
--   Public mascots: bisa dipakai semua user.
--   Premium mascots: cuma bisa dipakai user is_premium = true.
--   Restricted mascots: cuma bisa dipakai email tertentu (whitelist).
-- ============================================================

-- ============================================================
-- 1. MASCOTS table
-- ============================================================
create table if not exists public.mascots (
  id text primary key,                    -- slug: 'elephant', 'cat', dst
  name text not null,                     -- Display name: 'Elephant Pink'
  emoji text not null,                    -- '🐘', '🐱', dst
  description text,
  icon_url text,                          -- URL gambar maskot (kalau ada)
  vibe text not null,                     -- 'cute', 'cozy', 'calm', dst
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. MASCOT_WHITELIST table — email yang boleh pilih maskot tertentu
--    Untuk restrict maskot private (mis. gajah cuma buat Elsa)
-- ============================================================
create table if not exists public.mascot_whitelist (
  mascot_id text not null references public.mascots(id) on delete cascade,
  email text not null,
  granted_at timestamptz not null default now(),
  granted_by text,                       -- email admin yang ngasih akses
  primary key (mascot_id, email)
);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
alter table public.mascots enable row level security;
alter table public.mascot_whitelist enable row level security;

-- Mascots: semua authenticated bisa SELECT (lihat katalog)
drop policy if exists "Mascots: select all" on public.mascots;
create policy "Mascots: select all"
  on public.mascots for select
  to authenticated
  using (is_active = true);

-- Mascots: admin bisa write
drop policy if exists "Mascots: admin write" on public.mascots;
create policy "Mascots: admin write"
  on public.mascots for all
  to service_role
  using (true);

-- Mascot whitelist: user bisa SELECT row miliknya sendiri
drop policy if exists "Mascot whitelist: select own" on public.mascot_whitelist;
create policy "Mascot whitelist: select own"
  on public.mascot_whitelist for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Mascot whitelist: admin write
drop policy if exists "Mascot whitelist: admin write" on public.mascot_whitelist;
create policy "Mascot whitelist: admin write"
  on public.mascot_whitelist for all
  to service_role
  using (true);

-- ============================================================
-- 4. RPC: Can user use this mascot?
--    Frontend panggil sebelum apply mascot
-- ============================================================
create or replace function public.can_use_mascot(p_mascot_id text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_mascot record;
  v_is_premium boolean;
  v_is_whitelisted boolean;
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  select email, is_premium into v_user_email, v_is_premium
  from public.profiles where id = v_user_id;

  select * into v_mascot from public.mascots where id = p_mascot_id and is_active = true;
  if not found then
    return json_build_object('status', 'error', 'message', 'Mascot tidak ditemukan');
  end if;

  -- Cek apakah mascot ini restricted (ada whitelist entry)
  select exists(
    select 1 from public.mascot_whitelist
    where mascot_id = p_mascot_id
      and lower(email) = lower(v_user_email)
  ) into v_is_whitelisted;

  -- Logic:
  -- - Kalau mascot ada di whitelist table → cuma boleh kalau email ada di whitelist
  -- - Kalau mascot premium (is_premium = true) → cuma boleh kalau user is_premium
  -- - Kalau mascot free → semua boleh
  if exists (select 1 from public.mascot_whitelist where mascot_id = p_mascot_id) then
    if not v_is_whitelisted then
      return json_build_object(
        'status', 'error',
        'message', 'Mascot ini eksklusif untuk user tertentu',
        'code', 'MASCOT_RESTRICTED'
      );
    end if;
  elsif v_mascot.is_premium and not v_is_premium then
    return json_build_object(
      'status', 'error',
      'message', 'Mascot premium — upgrade akun untuk pakai',
      'code', 'PREMIUM_REQUIRED'
    );
  end if;

  return json_build_object('status', 'success', 'can_use', true);
end;
$$;

-- RPC: Can user use this theme? (sama konsep, untuk premium theme lock)
create or replace function public.can_use_theme(p_theme_id text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_premium boolean;
  v_theme record;
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  select is_premium into v_is_premium from public.profiles where id = v_user_id;

  select * into v_theme from public.themes where id = p_theme_id and is_active = true;
  if not found then
    return json_build_object('status', 'error', 'message', 'Theme tidak ditemukan');
  end if;

  if v_theme.is_premium and not v_is_premium then
    return json_build_object(
      'status', 'error',
      'message', 'Theme premium — upgrade akun untuk pakai',
      'code', 'PREMIUM_REQUIRED'
    );
  end if;

  return json_build_object('status', 'success', 'can_use', true);
end;
$$;

grant execute on function public.can_use_mascot(text) to authenticated;
grant execute on function public.can_use_theme(text) to authenticated;

-- ============================================================
-- 5. SEED: 10 mascots (3 public + 4 premium + 1 restricted + 2 more)
-- ============================================================

INSERT INTO public.mascots (id, name, emoji, description, vibe, is_premium, sort_order)
VALUES
-- RESTRICTED (private) mascots — only via mascot_whitelist
(
  'elephant',
  '🐘 Elephant Pink',
  '🐘',
  'Cute elephant — exclusive to original user (Elsa)',
  'cute',
  false,
  1
),

-- PUBLIC mascots
(
  'cat',
  '🐱 Cat Mocha',
  '🐱',
  'Cozy warm cat',
  'cozy',
  false,
  10
),
(
  'butterfly',
  '🦋 Butterfly Ocean',
  '🦋',
  'Calm fresh butterfly',
  'calm',
  false,
  11
),
(
  'rabbit',
  '🐰 Rabbit Soft',
  '🐰',
  'Soft playful rabbit',
  'playful',
  false,
  12
),
(
  'fox',
  '🦊 Fox Smart',
  '🦊',
  'Smart sassy fox',
  'sassy',
  false,
  13
),
(
  'panda',
  '🐼 Panda Minimal',
  '🐼',
  'Cute minimal panda',
  'cute',
  false,
  14
),
(
  'moon',
  '🌙 Moon Calm',
  '🌙',
  'Calm celestial moon',
  'calm',
  false,
  15
),

-- PREMIUM mascots (only is_premium users)
(
  'unicorn',
  '🦄 Unicorn Magical',
  '🦄',
  'Magical dreamy unicorn',
  'magical',
  true,
  20
),
(
  'sakura',
  '🌸 Sakura Aesthetic',
  '🌸',
  'Soft aesthetic sakura flower',
  'aesthetic',
  true,
  21
),
(
  'star',
  '⭐ Star Luxe',
  '⭐',
  'Luxe premium star',
  'luxe',
  true,
  22
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  vibe = EXCLUDED.vibe,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 6. SEED: Whitelist gajah untuk Elsa (RESTRICTED)
-- ============================================================
INSERT INTO public.mascot_whitelist (mascot_id, email, granted_by)
VALUES ('elephant', 'elsakristya19@gmail.com', 'admin')
ON CONFLICT (mascot_id, email) DO NOTHING;
