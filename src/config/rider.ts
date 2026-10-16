/**
 * SUMBER TUNGGAL FAKTA DATA RIDER (Zero-Hallucination Rule)
 * -----------------------------------------------------------
 * Semua data diri/spek motor HANYA boleh diisi di file ini.
 * DILARANG mengarang data di komponen. Jika sebuah field masih
 * kosong ("" atau []), UI otomatis menampilkan fallback "—".
 *
 * CARA PAKAI: isi field di bawah dengan data asli rider.
 */

export const FALLBACK_DISPLAY = "—";

export interface MotorSpecs {
  /** Tipe motor, contoh: manual diisi dari data asli rider. */
  type: string;
  /** Plat nomor kendaraan. */
  plateNumber: string;
  /** Setup CVT. */
  cvtSetup: string;
  /** Setup mesin. */
  engineSetup: string;
  /** Setup kaki-kaki. */
  undercarriageSetup: string;
}

export interface Basecamp {
  /** Nama basecamp / tempat ngetem favorit. */
  name: string;
  /** Catatan singkat tentang basecamp. */
  note: string;
}

export interface RiderProfile {
  /** Nama lengkap rider. */
  name: string;
  /** URL foto rider (kosongkan = pakai inisial/avatar fallback). */
  avatarUrl: string;
  /** Status rider hari ini, contoh status operasional. */
  status: string;
  motor: MotorSpecs;
  basecamp: Basecamp;
  /** Daftar hobi — kosongkan array bila belum ada datanya. */
  hobbies: string[];
  /** Side quest / kesibukan selain nge-ride (dari DESIGN.md). */
  sideQuest: string;
}

export const rider: RiderProfile = {
  // TODO(user): isi data rider yang sebenarnya — jangan mengarang.
  name: "",
  avatarUrl: "",
  status: "",
  motor: {
    type: "",
    plateNumber: "",
    cvtSetup: "",
    engineSetup: "",
    undercarriageSetup: "",
  },
  basecamp: {
    name: "",
    note: "",
  },
  hobbies: [],
  sideQuest: "Kuliah & Web Dev",
};

/** Ambil nilai string aman untuk ditampilkan ("" → "—"). */
export function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : FALLBACK_DISPLAY;
}

/** Gabung array jadi satu baris aman ([] → "—"). */
export function listOrDash(values: string[]): string {
  const items = values.map((v) => v.trim()).filter(Boolean);
  return items.length > 0 ? items.join(" • ") : FALLBACK_DISPLAY;
}

/** Inisial untuk avatar fallback, contoh "" → "—". */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return FALLBACK_DISPLAY;
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}
