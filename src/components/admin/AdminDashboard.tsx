"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Loader2,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  GALLERY_BUCKET,
  GALLERY_MAX_FILE_BYTES,
  type GalleryPhoto,
} from "@/config/gallery";
import { type DriverEditableKey, type DriverRow } from "@/config/driver";

export interface FeedbackRow {
  id: string;
  passenger_name: string;
  comment: string;
  rating: number;
  created_at: string;
}

export interface MotivationRow {
  id: string;
  author: string;
  quote: string;
  is_approved: boolean;
  created_at: string;
}

/** Field form Setup Data Rider (tanpa kolom sistem). */
const DRIVER_FIELDS: {
  key: DriverEditableKey;
  label: string;
  placeholder: string;
}[] = [
  { key: "name", label: "Nama lengkap", placeholder: "cth. Rizky Saputra" },
  {
    key: "avatar_url",
    label: "URL foto profil",
    placeholder: "https://... (opsional)",
  },
  {
    key: "status",
    label: "Status hari ini",
    placeholder: "cth. Online — siap ambil order",
  },
  { key: "motor_type", label: "Tipe motor", placeholder: "cth. BeAT 2019" },
  { key: "plate_number", label: "Plat nomor", placeholder: "cth. B 1234 XYZ" },
  { key: "cvt_setup", label: "Setup CVT", placeholder: "cth. Roller 9 gram" },
  {
    key: "engine_setup",
    label: "Setup mesin",
    placeholder: "cth. Standar pabrik",
  },
  {
    key: "undercarriage_setup",
    label: "Setup kaki-kaki",
    placeholder: "cth. Per racing",
  },
  {
    key: "basecamp_name",
    label: "Basecamp favorit",
    placeholder: "cth. Depan kampus",
  },
  {
    key: "basecamp_note",
    label: "Catatan basecamp",
    placeholder: "Ngetem tiap sore",
  },
  {
    key: "side_quest",
    label: "Side quest",
    placeholder: "cth. Kuliah & Web Dev",
  },
];

type DriverDraft = Record<DriverEditableKey, string> & { hobbies: string[] };

type DriverSaveState =
  | { status: "idle" | "saving" | "saved" }
  | { status: "error"; message: string };

/** Isi draft dari baris driver milik user (null = belum pernah setup). */
function driverDraftFromRow(row: DriverRow | null): DriverDraft {
  return {
    name: row?.name ?? "",
    avatar_url: row?.avatar_url ?? "",
    status: row?.status ?? "",
    motor_type: row?.motor_type ?? "",
    plate_number: row?.plate_number ?? "",
    cvt_setup: row?.cvt_setup ?? "",
    engine_setup: row?.engine_setup ?? "",
    undercarriage_setup: row?.undercarriage_setup ?? "",
    basecamp_name: row?.basecamp_name ?? "",
    basecamp_note: row?.basecamp_note ?? "",
    side_quest: row?.side_quest ?? "",
    hobbies: row?.hobbies ?? [],
  };
}

type LoadStatus = "loading" | "ready" | "error";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sisi admin: moderasi feedback penumpang & motivasi harian.
 * Tidak ada tombol login di sini — yang ada hanya Tombol Keluar (logout).
 */
export default function AdminDashboard({
  email,
  userId,
  initialDriver,
  initialFeedback,
  initialMotivations,
  initialGallery,
  loadFailed,
}: {
  email: string;
  userId: string;
  initialDriver: DriverRow | null;
  initialFeedback: FeedbackRow[];
  initialMotivations: MotivationRow[];
  initialGallery: GalleryPhoto[];
  loadFailed: boolean;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<LoadStatus>(
    loadFailed ? "error" : "ready",
  );
  const [feedback, setFeedback] = useState<FeedbackRow[]>(initialFeedback);
  const [motivations, setMotivations] =
    useState<MotivationRow[]>(initialMotivations);

  // State galeri "Kesan Penumpang" (foto)
  const [gallery, setGallery] = useState<GalleryPhoto[]>(initialGallery);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // State form tambah kutipan
  const [newQuote, setNewQuote] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // State form Setup Data Rider (1 user = 1 driver)
  const [driver, setDriver] = useState<DriverDraft>(() =>
    driverDraftFromRow(initialDriver),
  );
  const [hobbiesText, setHobbiesText] = useState(() =>
    (initialDriver?.hobbies ?? []).join(", "),
  );
  const [driverSave, setDriverSave] = useState<DriverSaveState>({
    status: "idle",
  });

  function setDriverField(key: DriverEditableKey, value: string) {
    setDriver((prev) => ({ ...prev, [key]: value }));
  }

  const loadAll = useCallback(async () => {
    const supabase = createClient();

    const [feedbackResult, motivationResult] = await Promise.all([
      supabase
        .from("feedback")
        .select("id, passenger_name, comment, rating, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("motivations")
        .select("id, author, quote, is_approved, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (feedbackResult.error || motivationResult.error) {
      setStatus("error");
      return;
    }

    setFeedback((feedbackResult.data ?? []) as FeedbackRow[]);
    setMotivations((motivationResult.data ?? []) as MotivationRow[]);
    setStatus("ready");
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  async function handleDeleteFeedback(id: string) {
    setActionError(null);
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      setActionError(`Gagal hapus feedback (${error.message}).`);
    } else {
      setFeedback((prev) => prev.filter((item) => item.id !== id));
    }
    setBusyId(null);
  }

  async function handleToggleApprove(row: MotivationRow) {
    setActionError(null);
    setBusyId(row.id);
    const supabase = createClient();
    const next = !row.is_approved;
    const { error } = await supabase
      .from("motivations")
      .update({ is_approved: next })
      .eq("id", row.id);
    if (error) {
      setActionError(`Gagal update status (${error.message}).`);
    } else {
      setMotivations((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, is_approved: next } : item,
        ),
      );
    }
    setBusyId(null);
  }

  /** UPSERT driver milik sendiri — PK user_id menjamin 1 user = 1 driver. */
  async function handleSaveDriver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hobbies = hobbiesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setDriverSave({ status: "saving" });
    try {
      const supabase = createClient();
      const { error } = await supabase.from("drivers").upsert(
        {
          user_id: userId,
          name: driver.name,
          avatar_url: driver.avatar_url,
          status: driver.status,
          motor_type: driver.motor_type,
          plate_number: driver.plate_number,
          cvt_setup: driver.cvt_setup,
          engine_setup: driver.engine_setup,
          undercarriage_setup: driver.undercarriage_setup,
          basecamp_name: driver.basecamp_name,
          basecamp_note: driver.basecamp_note,
          hobbies,
          side_quest: driver.side_quest,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        setDriverSave({
          status: "error",
          message: `Gagal simpan (${error.message}). Pastikan SQL 0003_drivers.sql udah dijalankan ya.`,
        });
        return;
      }

      setDriverSave({ status: "saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setDriverSave({
        status: "error",
        message: `Ada gangguan (${message}). Coba lagi ya!`,
      });
    }
  }

  async function handleUploadPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    if (!selectedFile) {
      setActionError("Pilih fotonya dulu ya 📸");
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      setActionError("File-nya harus gambar ya (png/jpg/webp).");
      return;
    }
    if (selectedFile.size > GALLERY_MAX_FILE_BYTES) {
      setActionError("Ukuran foto maksimal 10 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_BUCKET)
        .upload(path, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) {
        setActionError(`Gagal unggah foto (${uploadError.message}).`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from(GALLERY_BUCKET)
        .getPublicUrl(path);

      const { data: inserted, error: insertError } = await supabase
        .from("gallery_photos")
        .insert({
          caption: uploadCaption.trim(),
          storage_path: path,
          public_url: urlData.publicUrl,
        })
        .select("id, caption, storage_path, public_url, created_at")
        .single();

      if (insertError) {
        // Rollback file kalau record gagal masuk
        await supabase.storage.from(GALLERY_BUCKET).remove([path]);
        setActionError(`Gagal simpan data foto (${insertError.message}).`);
        return;
      }

      setGallery((prev) => [inserted as GalleryPhoto, ...prev]);
      setUploadCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeletePhoto(photo: GalleryPhoto) {
    setActionError(null);
    setBusyId(photo.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      setActionError(`Gagal hapus foto (${error.message}).`);
    } else {
      setGallery((prev) => prev.filter((item) => item.id !== photo.id));
      if (editingId === photo.id) {
        setEditingId(null);
        setEditingCaption("");
      }
      // Hapus file di Storage (best-effort)
      await supabase.storage.from(GALLERY_BUCKET).remove([photo.storage_path]);
    }
    setBusyId(null);
  }

  async function handleSaveCaption(photo: GalleryPhoto) {
    setActionError(null);
    setBusyId(photo.id);
    const supabase = createClient();
    const caption = editingCaption.trim();

    const { error } = await supabase
      .from("gallery_photos")
      .update({ caption })
      .eq("id", photo.id);

    if (error) {
      setActionError(`Gagal perbarui caption (${error.message}).`);
    } else {
      setGallery((prev) =>
        prev.map((item) =>
          item.id === photo.id ? { ...item, caption } : item,
        ),
      );
      setEditingId(null);
      setEditingCaption("");
    }
    setBusyId(null);
  }

  async function handleAddQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuote = newQuote.trim();
    if (!trimmedQuote) return;

    setActionError(null);
    setIsAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("motivations")
      .insert({
        quote: trimmedQuote,
        author: newAuthor.trim() || "Penumpang Baik",
        is_approved: true,
      })
      .select("id, author, quote, is_approved, created_at")
      .single();

    if (error) {
      setActionError(`Gagal nambah kutipan (${error.message}).`);
    } else if (data) {
      setMotivations((prev) => [data as MotivationRow, ...prev]);
      setNewQuote("");
      setNewAuthor("");
    }
    setIsAdding(false);
  }

  const pendingCount = motivations.filter((m) => !m.is_approved).length;
  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
        ).toFixed(1)
      : "—";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Header admin */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent dark:text-accent-soft">
              Restricted Area
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              <ShieldCheck
                className="h-7 w-7 text-accent dark:text-accent-soft"
                aria-hidden
              />
              Admin MRID
            </h1>
            <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
              Masuk sebagai <span className="font-medium">{email}</span> —
              moderasi feedback &amp; kutipan di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-150 ease-out hover:border-red-300 hover:text-red-500 active:scale-[0.98] dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar
          </button>
        </header>

        {/* Stats ringkas */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total feedback</p>
            <p className="mt-1 text-2xl font-bold">{feedback.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-xs text-slate-500 dark:text-slate-400">Rata-rata rating</p>
            <p className="mt-1 flex items-center gap-1 text-2xl font-bold">
              {avgRating}
              {avgRating !== "—" && (
                <Star
                  className="h-4 w-4 fill-accent text-accent dark:fill-accent-soft dark:text-accent-soft"
                  aria-hidden
                />
              )}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-xs text-slate-500 dark:text-slate-400">Belum di-approve</p>
            <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>

        {/* Setup Data Rider — 1 user = 1 driver, tampil di halaman guest */}
        <section className="mb-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Driver Identity
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent dark:bg-accent-soft/15 dark:text-accent-soft">
                  <UserRound className="h-[18px] w-[18px]" aria-hidden />
                </span>
                Setup Data Rider
              </h2>
            </div>
            {initialDriver && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent dark:bg-accent-soft/15 dark:text-accent-soft">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Sudah di-setup
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
            Data ini yang tampil ke penumpang di halaman guest. Satu akun cuma
            boleh punya satu data driver — punya kamu sendiri.
          </p>

          <form
            onSubmit={handleSaveDriver}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {DRIVER_FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={`driver-${field.key}`}
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {field.label}
                </label>
                <input
                  id={`driver-${field.key}`}
                  type="text"
                  maxLength={200}
                  value={driver[field.key]}
                  onChange={(e) => setDriverField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={driverSave.status === "saving"}
                  className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft"
                />
              </div>
            ))}

            <div className="sm:col-span-2">
              <label
                htmlFor="driver-hobbies"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Hobi{" "}
                <span className="font-normal">(pisahkan dengan koma)</span>
              </label>
              <input
                id="driver-hobbies"
                type="text"
                maxLength={300}
                value={hobbiesText}
                onChange={(e) => setHobbiesText(e.target.value)}
                placeholder="cth. Nongkrong, Main gitar, Kulineran"
                disabled={driverSave.status === "saving"}
                className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={driverSave.status === "saving"}
                className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 dark:bg-accent-soft"
              >
                {driverSave.status === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Lagi nyimpen...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Simpan data rider
                  </>
                )}
              </button>

              {driverSave.status === "saved" && (
                <p className="flex items-center gap-1.5 text-sm text-lime-700 dark:text-lime-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Tersimpan — buka halaman guest (/) buat lihat hasilnya!
                </p>
              )}
              {driverSave.status === "error" && (
                <p className="text-sm text-red-500">{driverSave.message}</p>
              )}
            </div>
          </form>
        </section>

        {actionError && (
          <p className="mb-4 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {actionError}
          </p>
        )}

        {status === "loading" && (
          <p className="flex items-center gap-2 rounded-3xl border border-slate-200/80 bg-white/90 p-5 text-xs font-normal text-slate-500 dark:text-slate-400 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Nyiapin data admin...
          </p>
        )}

        {status === "error" && (
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-sm text-red-500">
              Gagal memuat data. Pastikan policy RLS untuk admin (role
              `authenticated`) udah dijalankan di SQL Editor, terus coba lagi.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                void loadAll();
              }}
              className="mt-3 flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] dark:bg-accent-soft"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Coba lagi
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* Kesan Penumpang */}
            <section className="mb-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare
                  className="h-5 w-5 text-accent dark:text-accent-soft"
                  aria-hidden
                />
                Kesan Penumpang
              </h2>
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                {feedback.length} feedback masuk (maks. 50 terbaru).
              </p>

              <div className="mt-3 flex flex-col gap-3">
                {feedback.length === 0 && (
                  <p className="rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Belum ada feedback nih — santai aja dulu 😌
                  </p>
                )}

                {feedback.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.passenger_name.trim() || "Anonim"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="flex items-center gap-0.5"
                          aria-label={`Rating ${item.rating} dari 5`}
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`h-3.5 w-3.5 ${
                                value <= item.rating
                                  ? "fill-accent text-accent dark:fill-accent-soft dark:text-accent-soft"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                              aria-hidden
                            />
                          ))}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteFeedback(item.id)}
                          disabled={busyId === item.id}
                          aria-label="Hapus feedback ini"
                          className="rounded-xl p-1.5 text-slate-400 transition-all duration-150 ease-out hover:bg-red-500/10 hover:text-red-500 active:scale-[0.98] disabled:opacity-50"
                        >
                          {busyId === item.id ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.comment}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Today's Motivation — moderasi */}
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Quote
                  className="h-5 w-5 text-accent dark:text-accent-soft"
                  aria-hidden
                />
                Today&apos;s Motivation
              </h2>
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                Yang tampil di dashboard publik cuma yang statusnya approved.
              </p>

              {/* Form tambah kutipan */}
              <form
                onSubmit={handleAddQuote}
                className="mt-4 flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80"
              >
                <div>
                  <label
                    htmlFor="new-quote"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Kutipan baru <span className="font-normal">(wajib)</span>
                  </label>
                  <textarea
                    id="new-quote"
                    rows={2}
                    maxLength={500}
                    required
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="Semangat terus ya hari ini! ✨"
                    disabled={isAdding}
                    className="w-full resize-none rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    maxLength={80}
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Nama penulis (opsional)"
                    disabled={isAdding}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft sm:max-w-[240px]"
                  />
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 dark:bg-accent-soft"
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden />
                    )}
                    Tambah kutipan
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-col gap-3">
                {motivations.length === 0 && (
                  <p className="rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Belum ada kutipan sama sekali — jadi yang pertama ya ✨
                  </p>
                )}

                {motivations.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-2xl border p-4 transition ${
                      item.is_approved
                        ? "border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-950/60"
                        : "border-orange-500/30 bg-orange-500/5 dark:border-orange-500/30"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.quote}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        — {item.author.trim() || "Penumpang Baik"} •{" "}
                        {formatDate(item.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleToggleApprove(item)}
                        disabled={busyId === item.id}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 ${
                          item.is_approved
                            ? "bg-lime-500/15 text-lime-700 hover:bg-lime-500/25 dark:text-lime-400"
                            : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20"
                        }`}
                      >
                        {busyId === item.id ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : item.is_approved ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Circle className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {item.is_approved ? "Approved" : "Pending — approve?"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Galeri Kesan Penumpang (foto dari admin → tampil di guest) */}
            <section className="mt-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon
                  className="h-5 w-5 text-accent dark:text-accent-soft"
                  aria-hidden
                />
                Galeri Kesan Penumpang
              </h2>
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                Foto ini yang tampil di halaman guest. Bisa diisi (unggah) atau
                diperbarui (caption/hapus) kapan aja.
              </p>

              <form
                onSubmit={handleUploadPhoto}
                className="mt-4 flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80"
              >
                <div>
                  <label
                    htmlFor="gallery-file"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Pilih foto{" "}
                    <span className="font-normal">
                      (format gambar, maks. 10 MB)
                    </span>
                  </label>
                  <input
                    id="gallery-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white transition-all duration-150 ease-out hover:file:bg-blue-700 dark:text-slate-300 dark:file:bg-accent-soft"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    maxLength={120}
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Caption (opsional), mis. 'Seru banget!'"
                    disabled={isUploading}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft sm:max-w-[260px]"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 dark:bg-accent-soft"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden />
                    )}
                    {isUploading ? "Lagi unggah..." : "Unggah foto"}
                  </button>
                </div>

                {selectedFile && !isUploading && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dipilih: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </form>

              {gallery.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Belum ada foto — unggah yang pertama yuk 📸
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((photo) => (
                    <figure
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-950/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.public_url}
                        alt={
                          photo.caption.trim()
                            ? `Foto galeri: ${photo.caption.trim()}`
                            : "Foto galeri"
                        }
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />

                      {editingId === photo.id ? (
                        <div className="flex items-center gap-1 p-2">
                          <input
                            type="text"
                            maxLength={120}
                            autoFocus
                            value={editingCaption}
                            onChange={(e) => setEditingCaption(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleSaveCaption(photo);
                              }
                              if (e.key === "Escape") {
                                setEditingId(null);
                                setEditingCaption("");
                              }
                            }}
                            placeholder="Caption (opsional)"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-accent dark:border-slate-700/70 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-accent-soft"
                          />
                          <button
                            type="button"
                            aria-label="Simpan caption"
                            disabled={busyId === photo.id}
                            onClick={() => void handleSaveCaption(photo)}
                            className="rounded-lg p-1.5 text-lime-700 transition-all duration-150 ease-out hover:bg-lime-500/10 active:scale-[0.98] disabled:opacity-50 dark:text-lime-400"
                          >
                            {busyId === photo.id ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Check className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Batal edit caption"
                            onClick={() => {
                              setEditingId(null);
                              setEditingCaption("");
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition-all duration-150 ease-out hover:bg-slate-500/10 active:scale-[0.98]"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <figcaption className="flex items-start justify-between gap-1 px-3 py-2">
                          <span className="min-w-0 break-words text-xs text-slate-500 dark:text-slate-400">
                            {photo.caption.trim() || "—"}
                          </span>
                          <span className="flex shrink-0 gap-0.5">
                            <button
                              type="button"
                              aria-label="Ubah caption foto"
                              onClick={() => {
                                setEditingId(photo.id);
                                setEditingCaption(photo.caption);
                              }}
                              className="rounded-lg p-1 text-slate-400 transition-all duration-150 ease-out hover:bg-accent/10 hover:text-accent active:scale-[0.98] dark:hover:text-accent-soft"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label="Hapus foto ini"
                              disabled={busyId === photo.id}
                              onClick={() => void handleDeletePhoto(photo)}
                              className="rounded-lg p-1 text-slate-400 transition-all duration-150 ease-out hover:bg-red-500/10 hover:text-red-500 active:scale-[0.98] disabled:opacity-50"
                            >
                              {busyId === photo.id ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </button>
                          </span>
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
