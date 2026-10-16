-- ============================================================
-- MRID — DRIVERS (1 user = 1 driver, setup dari dashboard admin)
-- ------------------------------------------------------------
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotent: aman dijalankan berulang.
--
-- Dirujuk oleh:
--   - src/config/driver.ts               (tipe DriverRow)
--   - src/app/page.tsx                   (guest: SELECT drivers)
--   - src/app/admin/page.tsx             (admin: SELECT row milik sendiri)
--   - src/components/admin/AdminDashboard.tsx (form Setup Data Rider → UPSERT)
--
-- JAMINAN 1 USER = 1 DRIVER:
--   PK tabel ini adalah user_id (FK ke auth.users) — satu akun hanya
--   bisa punya SATU baris, dan RLS membatasi owner hanya boleh
--   menulis barisnya sendiri (user_id = auth.uid()).
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLE
-- ------------------------------------------------------------
create table if not exists public.drivers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identitas (mirror src/config/rider.ts)
  name text not null default '',
  avatar_url text not null default '',
  status text not null default '',

  -- Garage & Specs
  motor_type text not null default '',
  plate_number text not null default '',
  cvt_setup text not null default '',
  engine_setup text not null default '',
  undercarriage_setup text not null default '',

  -- Basecamp & Side Quest
  basecamp_name text not null default '',
  basecamp_note text not null default '',
  hobbies text[] not null default '{}',
  side_quest text not null default ''
);

-- Biar updated_at selalu ikut ter-update
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drivers_touch_updated_at on public.drivers;
create trigger drivers_touch_updated_at
  before update on public.drivers
  for each row execute function public.touch_updated_at();

alter table public.drivers enable row level security;

-- ------------------------------------------------------------
-- 2. POLICIES
-- ------------------------------------------------------------

-- Guest (anon) boleh melihat identitas rider yang tampil di dashboard publik
drop policy if exists "public read drivers" on public.drivers;
create policy "public read drivers"
  on public.drivers
  for select
  to anon, authenticated
  using (true);

-- Owner hanya boleh menulis barisnya SENDIRI (1 user = 1 driver)
drop policy if exists "owner insert drivers" on public.drivers;
create policy "owner insert drivers"
  on public.drivers
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "owner update drivers" on public.drivers;
create policy "owner update drivers"
  on public.drivers
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner delete drivers" on public.drivers;
create policy "owner delete drivers"
  on public.drivers
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- SELESAI. Verifikasi:
-- 1. Table Editor → muncul `drivers`.
-- 2. /admin → section "Setup Data Rider" → isi & Simpan.
-- 3. / → data muncul di Profile Card / Garage / Basecamp.
--    (Kalau tabel masih kosong, guest fallback ke src/config/rider.ts.)
-- ============================================================
