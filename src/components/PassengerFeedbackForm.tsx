"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

const RATING_HINT: Record<number, string> = {
  1: "Waduh, maaf ya 🙏",
  2: "Boleh diperbaiki nih",
  3: "Lumayan oke sih",
  4: "Keren banget!",
  5: "Sempurna, gas terus! 🚀",
};

const FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-150 ease-out placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft dark:focus:ring-accent-soft/15";

/**
 * Feature 2 — Kesan Penumpang.
 * Form ringkas yang INSERT langsung ke tabel `feedback` Supabase
 * (passenger_name, comment, rating).
 */
export default function PassengerFeedbackForm() {
  const [passengerName, setPassengerName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const isSubmitting = state.status === "loading";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setState({
        status: "error",
        message: "Komentarnya jangan kosong dong 😅",
      });
      return;
    }
    if (rating === null) {
      setState({ status: "error", message: "Pilih ratingnya dulu ya ⭐" });
      return;
    }

    setState({ status: "loading" });
    try {
      const supabase = createClient();
      const { error } = await supabase.from("feedback").insert({
        passenger_name: passengerName.trim() || "Anonim",
        comment: trimmedComment,
        rating,
      });

      if (error) {
        setState({
          status: "error",
          message: `Yah, gagal nyimpen (${error.message}). Coba lagi ya!`,
        });
        return;
      }

      setPassengerName("");
      setComment("");
      setRating(null);
      setState({ status: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({
        status: "error",
        message: `Waduh, ada gangguan (${message}). Coba lagi ya!`,
      });
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Kesan Penumpang
      </p>
      <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Kasih review singkat dong 💌
      </h2>
      <p className="mt-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
        Super cepet, cuma butuh 10 detik — jujur aja, santai kok.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="passenger-name"
            className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Nama penumpang <span className="font-normal">(opsional)</span>
          </label>
          <input
            id="passenger-name"
            type="text"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            placeholder="Anonim"
            maxLength={80}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="passenger-comment"
            className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Kesan &amp; pesan
          </label>
          <textarea
            id="passenger-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ridenya enak, nih... (wajib ya)"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
            required
            className={`${FIELD_CLASS} resize-none`}
          />
          <p className="mt-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
            {comment.length}/500
          </p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Rating
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {RATING_OPTIONS.map((value) => {
              const isActive = (rating ?? 0) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`Beri rating ${value} dari 5`}
                  disabled={isSubmitting}
                  onClick={() => setRating(value)}
                  className="rounded-xl p-1.5 transition duration-150 ease-out hover:scale-110 active:scale-[0.98] disabled:opacity-60"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isActive
                        ? "fill-accent text-accent dark:fill-accent-soft dark:text-accent-soft"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
            {rating !== null && (
              <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                {RATING_HINT[rating]}
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60 dark:bg-accent-soft dark:text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Lagi nyimpen...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Kirim kesan
            </>
          )}
        </button>

        {state.status === "success" && (
          <p className="flex items-center gap-1.5 rounded-2xl bg-lime-500/15 px-3 py-2 text-sm text-lime-700 dark:text-lime-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Makasih banyak! Kesanmu udah kesimpen 🙌
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
