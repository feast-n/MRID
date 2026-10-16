/**
 * Konfigurasi Galeri "Kesan Penumpang" (Model B — galeri terpisah dari form
 * feedback teks). Foto disimpan di Supabase Storage bucket `mrid-gallery`,
 * metadata disimpan di tabel `public.gallery_photos`.
 *
 * File SQL sinkron: supabase/migrations/0002_gallery.sql
 */

/** Nama bucket Supabase Storage (harus sama dengan SQL migration). */
export const GALLERY_BUCKET = "mrid-gallery";

/** Batas ukuran file unggahan (10 MB) — sama dengan file_size_limit di SQL. */
export const GALLERY_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Baris tabel `public.gallery_photos`. */
export interface GalleryPhoto {
  id: string;
  /** Caption opsional dari admin ("" = tanpa caption → tampil sebagai "—"). */
  caption: string;
  /** Path file di bucket Storage — dipakai untuk hapus file. */
  storage_path: string;
  /** URL publik hasil getPublicUrl — dipakai untuk menampilkan <img>. */
  public_url: string;
  created_at: string;
}
