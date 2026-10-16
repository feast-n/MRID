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

## DRIVERS (1 user = 1 driver — Setup Data Rider dari dashboard)
File SQL sinkron: **`supabase/migrations/0003_drivers.sql`**

### Table: `drivers`
- `user_id`: uuid (**Primary Key**, FK → `auth.users.id`, `on delete cascade`) — *struktural menjamin 1 akun = 1 baris driver*
- `created_at` / `updated_at`: timestamptz (updated_at otomatis via trigger `touch_updated_at`)
- Identitas: `name`, `avatar_url`, `status` (semua text, default `''`)
- Garage: `motor_type`, `plate_number`, `cvt_setup`, `engine_setup`, `undercarriage_setup` (text)
- Basecamp: `basecamp_name`, `basecamp_note` (text), `hobbies` (text[]), `side_quest` (text)

### RLS
- **Publik (anon):** `SELECT` — guest `/` membaca identitas rider
- **Owner (authenticated):** `INSERT/UPDATE/DELETE` hanya jika `user_id = auth.uid()` — admin tidak bisa menyentuh driver lain

### Alur data
1. Admin `/admin` → section **"Setup Data Rider"** → form → `UPSERT ... onConflict: "user_id"`
2. Guest `/` (server component, `instant = false`) → `SELECT * FROM drivers ORDER BY created_at` → render per driver (Profile → Garage → Basecamp)
3. Tabel kosong/gagal? → **fallback ke `src/config/rider.ts`** (field kosong → `—`, tidak mengarang data)

Kode terkait: `src/config/driver.ts` (`DriverRow`, `DriverEditableKey`), `src/app/page.tsx`, `AdminDashboard.tsx` (`DRIVER_FIELDS`, `handleSaveDriver`).

---

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