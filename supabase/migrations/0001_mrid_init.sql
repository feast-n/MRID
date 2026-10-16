-- ============================================================
-- MRID — FULL SQL SETUP (sinkron dengan kode aplikasi)
-- ------------------------------------------------------------
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotent: aman dijalankan berulang (create if not exists /
--             drop policy if exists).
--
-- Dirujuk oleh:
--   - src/app/page.tsx               (anon INSERT feedback, SELECT motivasi approved)
--   - src/components/PassengerFeedbackForm.tsx
--   - src/components/TodayMotivationWidget.tsx (realtime INSERT motivasi)
--   - src/app/admin/page.tsx         (authenticated SELECT/UPDATE/INSERT/DELETE)
--   - src/components/admin/AdminDashboard.tsx
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES (sesuai SCHEMA.md)
-- ------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  passenger_name text not null default 'Anonim',
  comment text not null,
  rating integer not null check (rating between 1 and 5)
);

create table if not exists public.motivations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text not null default 'Penumpang Baik',
  quote text not null,
  is_approved boolean not null default true
);

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.feedback enable row level security;
alter table public.motivations enable row level security;

-- ------------------------------------------------------------
-- 3. POLICIES — SISI CLIENT (role: anon / publik tanpa login)
-- ------------------------------------------------------------

-- [Client] Form "Kesan Penumpang" → INSERT ke feedback
drop policy if exists "anon insert feedback" on public.feedback;
create policy "anon insert feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- [Client] Widget Today's Motivation → SELECT hanya yang approved
drop policy if exists "public read approved motivations" on public.motivations;
create policy "public read approved motivations"
  on public.motivations
  for select
  to anon, authenticated
  using (is_approved = true);

-- ------------------------------------------------------------
-- 4. POLICIES — SISI ADMIN (role: authenticated)
-- ------------------------------------------------------------

-- [Admin] Lihat semua feedback (termasuk yang baru masuk)
drop policy if exists "authenticated read feedback" on public.feedback;
create policy "authenticated read feedback"
  on public.feedback
  for select
  to authenticated
  using (true);

-- [Admin] Hapus feedback dari dashboard /admin
drop policy if exists "authenticated delete feedback" on public.feedback;
create policy "authenticated delete feedback"
  on public.feedback
  for delete
  to authenticated
  using (true);

-- [Admin] Lihat SEMUA motivasi (termasuk yang belum di-approve)
drop policy if exists "authenticated read all motivations" on public.motivations;
create policy "authenticated read all motivations"
  on public.motivations
  for select
  to authenticated
  using (true);

-- [Admin] Tambah kutipan dari form /admin
drop policy if exists "authenticated insert motivations" on public.motivations;
create policy "authenticated insert motivations"
  on public.motivations
  for insert
  to authenticated
  with check (true);

-- [Admin] Toggle status approve/unapprove di /admin
drop policy if exists "authenticated update motivations" on public.motivations;
create policy "authenticated update motivations"
  on public.motivations
  for update
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- 5. REALTIME — supaya widget Today's Motivation update live
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'motivations'
  ) then
    alter publication supabase_realtime add table public.motivations;
  end if;
end $$;

-- ============================================================
-- SELESAI. Catatan:
-- * Admin login pakai akun dari Authentication → Users → Add user
--   (email + password, Auto Confirm) → role `authenticated`.
-- * Verifikasi: buka /admin/login → masuk → feedback & motivasi termuat.
-- ============================================================
