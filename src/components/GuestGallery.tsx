"use client";

import { useEffect, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { GalleryPhoto } from "@/config/gallery";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Galeri "Kesan Penumpang" di halaman guest (Model B):
 * foto diunggah/diupdate dari dashboard admin, ditampilkan di sini
 * secara realtime. Sumber data HANYA tabel `gallery_photos` —
 * tidak ada foto placeholder/mengarang.
 */
export default function GuestGallery() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, caption, storage_path, public_url, created_at")
        .order("created_at", { ascending: false })
        .limit(24);

      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      setPhotos((data ?? []) as GalleryPhoto[]);
      setStatus("ready");
    }

    void load();

    const channel = supabase
      .channel("gallery-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gallery_photos" },
        (payload) => {
          const row = payload.new as GalleryPhoto;
          if (!row.id || !row.public_url) return;
          setPhotos((prev) =>
            prev.some((item) => item.id === row.id) ? prev : [row, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "gallery_photos" },
        (payload) => {
          const row = payload.old as { id?: string };
          if (!row.id) return;
          setPhotos((prev) => prev.filter((item) => item.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [reloadKey]);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Kesan Penumpang
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            <Camera
              className="h-4 w-4 shrink-0 text-accent dark:text-accent-soft"
              aria-hidden
            />
            Galeri penumpang
          </h2>
          <p className="mt-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
            Foto-foto yang dititipkan lewat dashboard admin.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-500" />
          realtime
        </span>
      </div>

      <div className="mt-4">
        {status === "loading" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70"
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl bg-red-500/10 px-3 py-3 text-sm text-red-500">
            <p>
              Gagal memuat galeri. Pastikan SQL migration{" "}
              <code className="font-mono">0002_gallery.sql</code> udah
              dijalankan, terus coba lagi.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setReloadKey((key) => key + 1);
              }}
              className="mt-2 flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] dark:bg-accent-soft dark:text-slate-950"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Coba lagi
            </button>
          </div>
        )}

        {status === "ready" && photos.length === 0 && (
          <p className="rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Belum ada foto sama sekali — nanti muncul di sini begitu admin
            unggah ya 📸
          </p>
        )}

        {status === "ready" && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-950/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.public_url}
                  alt={
                    photo.caption.trim()
                      ? `Foto kesan penumpang: ${photo.caption.trim()}`
                      : "Foto kesan penumpang"
                  }
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  {photo.caption.trim() || "—"}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
