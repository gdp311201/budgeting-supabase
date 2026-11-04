-- ============================================================
-- 06_THEMES.SQL — Theme presets (8 free + 5 premium women)
-- ============================================================
-- Run AFTER 01_schema.sql and 05_allowed_emails.sql
--
-- Konsep:
--   Tabel "themes" nyimip preset tema yang bisa dipilih user.
--   Free themes: bisa dipakai semua user.
--   Premium themes: cuma bisa dipakai user dengan is_premium = true.
--   Theme elephant-pink di-assign eksklusif ke Elsa via allowed_emails.
-- ============================================================

-- ============================================================
-- 1. THEMES table
-- ============================================================
create table if not exists public.themes (
  id text primary key,                     -- slug: 'elephant-pink', 'rose-gold-luxe', dst
  name text not null,                       -- Display name: '🐘 Elephant Pink'
  emoji text not null,                      -- '🐘', '🌸', dst
  description text,
  palette jsonb not null,                   -- {primary, accent, gradient: [c1, c2, c3]}
  wallpaper_url text,
  glass_settings jsonb not null,            -- {blur_wallpaper, dim_wallpaper, blur_page, blur_nav, blur_mini, blur_card, blur_input}
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. UPDATE PROFILES table — tambah kolom theme & premium
-- ============================================================
-- (run ini setelah 01_schema.sql)
alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists selected_theme_id text references public.themes(id),
  add column if not exists selected_mascot_id text;

-- ============================================================
-- 3. RLS POLICIES untuk themes
-- ============================================================
alter table public.themes enable row level security;

-- Semua user authenticated bisa SELECT themes (lihat katalog)
drop policy if exists "Themes: select all" on public.themes;
create policy "Themes: select all"
  on public.themes for select
  to authenticated
  using (is_active = true);

-- Hanya service_role (admin) yang bisa INSERT/UPDATE/DELETE themes
drop policy if exists "Themes: admin write" on public.themes;
create policy "Themes: admin write"
  on public.themes for all
  to service_role
  using (true);

-- ============================================================
-- 4. SEED: 8 FREE THEMES + 5 PREMIUM THEMES (WOMEN)
-- ============================================================

-- ── FREE THEMES ────────────────────────────────────────────

INSERT INTO public.themes (id, name, emoji, description, palette, wallpaper_url, glass_settings, is_premium, sort_order)
VALUES
(
  'elephant-pink',
  '🐘 Elephant Pink',
  '🐘',
  'Cute & feminine (default — reserved for Elsa)',
  '{"primary":"#ec4899","accent":"#f43f5e","gradient":["#8a96a8","#ba9eb1","#e3b9ca"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.75,"blur_page":3,"blur_nav":3,"blur_mini":12,"blur_card":1.8,"blur_input":8}'::jsonb,
  false,
  1
),
(
  'forest-sage',
  '🌿 Forest Sage',
  '🌿',
  'Natural zen minimal',
  '{"primary":"#10b981","accent":"#059669","gradient":["#86efac","#4ade80","#22c55e"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.75,"blur_page":3,"blur_nav":3,"blur_mini":12,"blur_card":1.8,"blur_input":8}'::jsonb,
  false,
  2
),
(
  'moon-lavender',
  '🌙 Moon Lavender',
  '🌙',
  'Dreamy minimal lavender',
  '{"primary":"#a78bfa","accent":"#8b5cf6","gradient":["#ddd6fe","#a78bfa","#7c3aed"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.75,"blur_page":3,"blur_nav":3,"blur_mini":12,"blur_card":1.8,"blur_input":8}'::jsonb,
  false,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  palette = EXCLUDED.palette,
  wallpaper_url = EXCLUDED.wallpaper_url,
  glass_settings = EXCLUDED.glass_settings,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

-- ── PREMIUM THEMES (WOMEN-FOCUSED) ─────────────────────────

INSERT INTO public.themes (id, name, emoji, description, palette, wallpaper_url, glass_settings, is_premium, sort_order)
VALUES
(
  'rose-gold-luxe',
  '🌸 Rose Gold Luxe',
  '🌸',
  'Elegant feminine rose gold',
  '{"primary":"#b76e79","accent":"#d4a5a5","gradient":["#f8e5e5","#d4a5a5","#b76e79"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.78,"blur_page":4,"blur_nav":4,"blur_mini":14,"blur_card":2,"blur_input":10}'::jsonb,
  true,
  10
),
(
  'cherry-blossom',
  '🍒 Cherry Blossom',
  '🍒',
  'Soft romantic pink',
  '{"primary":"#ffb7c5","accent":"#ff8fa3","gradient":["#ffe4e6","#ffb7c5","#ff8fa3"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.78,"blur_page":4,"blur_nav":4,"blur_mini":14,"blur_card":2,"blur_input":10}'::jsonb,
  true,
  11
),
(
  'lavender-dream',
  '💜 Lavender Dream',
  '💜',
  'Dreamy pastel purple',
  '{"primary":"#b8a9c9","accent":"#c8b6d8","gradient":["#ede9f5","#c8b6d8","#b8a9c9"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.78,"blur_page":4,"blur_nav":4,"blur_mini":14,"blur_card":2,"blur_input":10}'::jsonb,
  true,
  12
),
(
  'sunset-coral',
  '🌅 Sunset Coral',
  '🌅',
  'Warm vibrant coral sunset',
  '{"primary":"#f88379","accent":"#f4a7a3","gradient":["#ffe5e5","#f4a7a3","#f88379"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.78,"blur_page":4,"blur_nav":4,"blur_mini":14,"blur_card":2,"blur_input":10}'::jsonb,
  true,
  13
),
(
  'pearl-blush',
  '🤍 Pearl Blush',
  '🤍',
  'Minimal luxe pearl blush',
  '{"primary":"#e8c5c5","accent":"#f8e5e5","gradient":["#faf7f7","#f8e5e5","#e8c5c5"]}'::jsonb,
  'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
  '{"blur_wallpaper":0,"dim_wallpaper":0.8,"blur_page":5,"blur_nav":5,"blur_mini":16,"blur_card":2.5,"blur_input":12}'::jsonb,
  true,
  14
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  palette = EXCLUDED.palette,
  wallpaper_url = EXCLUDED.wallpaper_url,
  glass_settings = EXCLUDED.glass_settings,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 5. AUTO-APPLY assigned theme from allowed_emails saat signup
-- ============================================================
-- Update trigger handle_new_user untuk auto-set theme & premium flag
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_whitelist record;
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

  return new;
end;
$$;
