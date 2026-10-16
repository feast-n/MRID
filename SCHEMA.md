# SUPABASE DATABASE SCHEMA & CONFIG

## ENVIRONMENT VARIABLES (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://gkyjtstedvlwsrzbytul.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_qc0HUbWBqG9SLr4UGu9BFg_2BhrScXT

## DATABASE TABLES

### Table: `feedback` (Kesan Penumpang)
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `created_at`: timestamp with time zone (default: `now()`)
- `passenger_name`: text (optional / default: 'Anonim')
- `comment`: text (required)
- `rating`: integer (1-5)

### Table: `motivations` (Today Motivations)
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `created_at`: timestamp with time zone (default: `now()`)
- `author`: text (default: 'Penumpang Baik')
- `quote`: text (required)
- `is_approved`: boolean (default: true)

## SQL SETUP (SINKRON DENGAN KODE)
File canonical: **`supabase/migrations/0001_mrid_init.sql`** — jalankan di Supabase SQL Editor (idempotent, aman diulang). Isinya sudah sinkron dengan kode aplikasi:

| Object | Untuk siapa | Dipakai oleh |
|---|---|---|
| `anon INSERT feedback` | Publik (tanpa login) | `PassengerFeedbackForm` |
| `public read approved motivations` (`is_approved = true`) | Publik | `TodayMotivationWidget` (+ realtime INSERT) |
| `authenticated read/delete feedback` | Admin | `/admin` dashboard |
| `authenticated read all / insert / update motivations` | Admin | moderasi & tambah kutipan |
| `alter publication supabase_realtime add table motivations` | Realtime | widget marquee live update |

**Admin auth:** akun dibuat di Supabase → Authentication → Users → Add user (email + password, Auto Confirm) → role `authenticated`. Login hanya di `/admin/login` — halaman client (`/`) tidak punya tombol login.

## GALLERY "Kesan Penumpang" (Foto — Model B)
File SQL sinkron: **`supabase/migrations/0002_gallery.sql`**

### Table: `gallery_photos`
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `created_at`: timestamp with time zone (default: `now()`)
- `caption`: text (optional, default: `''` → tampil `—` di guest)
- `storage_path`: text (unique — path file di bucket, dipakai untuk hapus)
- `public_url`: text (URL publik hasil `getPublicUrl`, dipakai untuk `<img>`)

### Storage: bucket `mrid-gallery` (public, file_size_limit 10 MB)
- **Admin (authenticated):** upload (`INSERT`) & hapus (`DELETE`) file
- **Publik (anon):** hanya `SELECT` (melihat foto)
- **Realtime:** tabel `gallery_photos` masuk publication `supabase_realtime` (INSERT & DELETE → widget guest update live)

Kode terkait: `src/config/gallery.ts` (bucket + tipe), `src/components/GuestGallery.tsx` (guest), `AdminDashboard.tsx` (unggah/ubah caption/hapus). Form feedback teks & Today's Motivation **tidak berubah**.