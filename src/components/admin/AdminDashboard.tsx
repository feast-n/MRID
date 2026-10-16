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
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  GALLERY_BUCKET,
  GALLERY_MAX_FILE_BYTES,
  type GalleryPhoto,
} from "@/config/gallery";

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
  initialFeedback,
  initialMotivations,
  initialGallery,
  loadFailed,
}: {
  email: string;
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Header admin */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#007AFF] dark:text-[#06B6D4]">
              Restricted Area
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
              <ShieldCheck
                className="h-7 w-7 text-[#007AFF] dark:text-[#06B6D4]"
                aria-hidden
              />
              Admin MRID
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Masuk sebagai <span className="font-medium">{email}</span> —
              moderasi feedback &amp; kutipan di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar
          </button>
        </header>

        {/* Stats ringkas */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-slate-200/50 bg-white/70 p-4 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
            <p className="text-xs text-slate-500">Total feedback</p>
            <p className="mt-1 text-2xl font-bold">{feedback.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/50 bg-white/70 p-4 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
            <p className="text-xs text-slate-500">Rata-rata rating</p>
            <p className="mt-1 flex items-center gap-1 text-2xl font-bold">
              {avgRating}
              {avgRating !== "—" && (
                <Star
                  className="h-4 w-4 fill-[#007AFF] text-[#007AFF] dark:fill-[#06B6D4] dark:text-[#06B6D4]"
                  aria-hidden
                />
              )}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/50 bg-white/70 p-4 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
            <p className="text-xs text-slate-500">Belum di-approve</p>
            <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>

        {actionError && (
          <p className="mb-4 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {actionError}
          </p>
        )}

        {status === "loading" && (
          <p className="flex items-center gap-2 rounded-3xl border border-slate-200/50 bg-white/70 p-5 text-sm text-slate-500 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Nyiapin data admin...
          </p>
        )}

        {status === "error" && (
          <div className="rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
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
              className="mt-3 flex items-center gap-2 rounded-2xl bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 dark:bg-[#06B6D4]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Coba lagi
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* Kesan Penumpang */}
            <section className="mb-4 rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare
                  className="h-5 w-5 text-[#007AFF] dark:text-[#06B6D4]"
                  aria-hidden
                />
                Kesan Penumpang
              </h2>
              <p className="mt-1 text-sm text-slate-500">
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
                    className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/60"
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
                                  ? "fill-[#007AFF] text-[#007AFF] dark:fill-[#06B6D4] dark:text-[#06B6D4]"
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
                          className="rounded-xl p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
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
            <section className="rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Quote
                  className="h-5 w-5 text-[#007AFF] dark:text-[#06B6D4]"
                  aria-hidden
                />
                Today&apos;s Motivation
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Yang tampil di dashboard publik cuma yang statusnya approved.
              </p>

              {/* Form tambah kutipan */}
              <form
                onSubmit={handleAddQuote}
                className="mt-4 flex flex-col gap-3 border-b border-slate-200/50 pb-4 dark:border-slate-800/50"
              >
                <div>
                  <label
                    htmlFor="new-quote"
                    className="mb-1 block text-xs font-medium text-slate-500"
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
                    className="w-full resize-none rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007AFF] disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#06B6D4]"
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
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007AFF] disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#06B6D4] sm:max-w-[240px]"
                  />
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 dark:bg-[#06B6D4]"
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
                        ? "border-slate-200/60 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-950/60"
                        : "border-amber-300/60 bg-amber-500/5 dark:border-amber-500/30"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.quote}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        — {item.author.trim() || "Penumpang Baik"} •{" "}
                        {formatDate(item.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleToggleApprove(item)}
                        disabled={busyId === item.id}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          item.is_approved
                            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
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
            <section className="mt-4 rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon
                  className="h-5 w-5 text-[#007AFF] dark:text-[#06B6D4]"
                  aria-hidden
                />
                Galeri Kesan Penumpang
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Foto ini yang tampil di halaman guest. Bisa diisi (unggah) atau
                diperbarui (caption/hapus) kapan aja.
              </p>

              <form
                onSubmit={handleUploadPhoto}
                className="mt-4 flex flex-col gap-3 border-b border-slate-200/50 pb-4 dark:border-slate-800/50"
              >
                <div>
                  <label
                    htmlFor="gallery-file"
                    className="mb-1 block text-xs font-medium text-slate-500"
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
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-[#007AFF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white transition hover:file:brightness-110 dark:text-slate-300 dark:file:bg-[#06B6D4]"
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
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007AFF] disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#06B6D4] sm:max-w-[260px]"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 dark:bg-[#06B6D4]"
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
                  <p className="text-xs text-slate-500">
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
                      className="overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-950/60"
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
                            className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#007AFF] dark:border-slate-700/70 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-[#06B6D4]"
                          />
                          <button
                            type="button"
                            aria-label="Simpan caption"
                            disabled={busyId === photo.id}
                            onClick={() => void handleSaveCaption(photo)}
                            className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
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
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-500/10"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <figcaption className="flex items-start justify-between gap-1 px-3 py-2">
                          <span className="min-w-0 break-words text-xs text-slate-500">
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
                              className="rounded-lg p-1 text-slate-400 transition hover:bg-[#007AFF]/10 hover:text-[#007AFF] dark:hover:text-[#06B6D4]"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label="Hapus foto ini"
                              disabled={busyId === photo.id}
                              onClick={() => void handleDeletePhoto(photo)}
                              className="rounded-lg p-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
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
