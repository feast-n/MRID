/**
 * Tabel `public.drivers` — Setup Data Rider (1 user = 1 driver).
 *
 * Jaminan struktural: PRIMARY KEY = user_id (FK ke auth.users), jadi satu
 * akun hanya bisa punya satu baris. RLS: publik boleh SELECT (guest),
 * hanya owner (user_id = auth.uid()) yang boleh INSERT/UPDATE/DELETE.
 *
 * File SQL sinkron: supabase/migrations/0003_drivers.sql
 * Field mirror dari src/config/rider.ts (zero-hallucination tetap berlaku:
 * data hanya dari file config statis ATAU tabel Supabase ini).
 */
export interface DriverRow {
  user_id: string;
  created_at: string;
  updated_at: string;
  /** Identitas */
  name: string;
  avatar_url: string;
  status: string;
  /** Garage & Specs */
  motor_type: string;
  plate_number: string;
  cvt_setup: string;
  engine_setup: string;
  undercarriage_setup: string;
  /** Basecamp & Side Quest */
  basecamp_name: string;
  basecamp_note: string;
  hobbies: string[];
  side_quest: string;
}

/** Field yang boleh diedit lewat form admin (tanpa kolom sistem). */
export type DriverEditableKey = Exclude<
  keyof DriverRow,
  "user_id" | "created_at" | "updated_at" | "hobbies"
>;
