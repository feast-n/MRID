-- ============================================================
-- MRID — GALLERY "Kesan Penumpang" (Model B: galeri foto terpisah)
-- ------------------------------------------------------------
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotent: aman dijalankan berulang.
--
-- Dirujuk oleh:
--   - src/config/gallery.ts              (GALLERY_BUCKET & GalleryPhoto)
--   - src/components/GuestGallery.tsx    (anon SELECT + realtime)
--   - src/components/admin/AdminDashboard.tsx
--     (authenticated INSERT/UPDATE/DELETE + Storage upload/remove)
-- Catatan: form feedback teks & Today's Motivation TIDAK berubah.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLE
-- ------------------------------------------------------------
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  caption text not null default '',
  storage_path text not null unique,
  public_url text not null
);

alter table public.gallery_photos enable row level security;

-- ------------------------------------------------------------
-- 2. POLICIES — guest (anon) hanya boleh melihat
-- ------------------------------------------------------------
drop policy if exists "public read gallery photos" on public.gallery_photos;
create policy "public read gallery photos"
  on public.gallery_photos
  for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- 3. POLICIES — admin (authenticated) isi & perbarui
-- ------------------------------------------------------------
drop policy if exists "authenticated insert gallery photos" on public.gallery_photos;
create policy "authenticated insert gallery photos"
  on public.gallery_photos
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update gallery photos" on public.gallery_photos;
create policy "authenticated update gallery photos"
  on public.gallery_photos
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated delete gallery photos" on public.gallery_photos;
create policy "authenticated delete gallery photos"
  on public.gallery_photos
  for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- 4. STORAGE BUCKET (publik, max 10 MB per file)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('mrid-gallery', 'mrid-gallery', true, 10485760)
on conflict (id) do nothing;

-- Guest boleh melihat isi bucket
drop policy if exists "public gallery bucket read" on storage.objects;
create policy "public gallery bucket read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'mrid-gallery');

-- Admin boleh unggah foto
drop policy if exists "authenticated gallery upload" on storage.objects;
create policy "authenticated gallery upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'mrid-gallery');

-- Admin boleh hapus file foto
drop policy if exists "authenticated gallery delete" on storage.objects;
create policy "authenticated gallery delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'mrid-gallery');

-- ------------------------------------------------------------
-- 5. REALTIME — galeri guest update live (INSERT & DELETE)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'gallery_photos'
  ) then
    alter publication supabase_realtime add table public.gallery_photos;
  end if;
end $$;

-- ============================================================
-- SELESAI. Verifikasi:
-- 1. Table Editor → muncul `gallery_photos`.
-- 2. Storage → muncul bucket `mrid-gallery` (Public).
-- 3. /admin → section "Galeri Kesan Penumpang" → unggah foto →
--    foto tampil di halaman guest (/).
-- ============================================================
