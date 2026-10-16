"use client";

import { useCallback, useEffect, useState } from "react";
import { Quote, RefreshCw, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface MotivationRow {
  id: string;
  author: string;
  quote: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; items: MotivationRow[] }
  | { status: "error"; message: string };

/**
 * Feature 3 — Today's Motivation Widget.
 * FETCH data dari tabel `motivations` Supabase + update REALTIME
 * (postgres_changes INSERT) lalu ditampilkan dalam marquee.
 */
export default function TodayMotivationWidget() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const mergeItems = useCallback(
    (prev: MotivationRow[], next: MotivationRow) => {
      if (prev.some((item) => item.id === next.id)) return prev;
      return [next, ...prev];
    },
    [],
  );

  useEffect(() => {
    const supabase = createClient();
    let isCancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("motivations")
        .select("id, author, quote")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (isCancelled) return;

      if (error) {
        setState({
          status: "error",
          message: `Yah, gagal nyampe (${error.message}). Coba reload ya!`,
        });
        return;
      }

      setState({
        status: "ready",
        items: (data ?? []) as MotivationRow[],
      });
    }

    void load();

    const channel = supabase
      .channel("motivations-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "motivations" },
        (payload) => {
          const row = payload.new as Partial<MotivationRow> & {
            is_approved?: boolean;
          };
          if (row.is_approved === false) return;
          if (!row.id || !row.quote) return;

          const incoming: MotivationRow = {
            id: row.id,
            author: row.author?.trim() || "Penumpang Baik",
            quote: row.quote,
          };

          setState((prev) =>
            prev.status === "ready"
              ? { status: "ready", items: mergeItems(prev.items, incoming) }
              : { status: "ready", items: [incoming] },
          );
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [mergeItems]);

  return (
    <section className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Today&apos;s Motivation
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            <Sparkles
              className="h-4 w-4 shrink-0 text-accent dark:text-accent-soft"
              aria-hidden
            />
            Kata-kata hari ini
          </h2>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          realtime
        </span>
      </div>

      <div className="mt-4">
        {state.status === "loading" && (
          <div className="flex items-center gap-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
            Nyari motivasi hari ini...
          </div>
        )}

        {state.status === "error" && (
          <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {state.message}
          </p>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <p className="rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Belum ada kutipan masuk hari ini — jadi yang pertama ngasih motivasi
            dong ✨
          </p>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <div className="relative -mx-5 overflow-hidden px-5">
            <div className="animate-mrid-marquee flex w-max gap-3">
              {[...state.items, ...state.items].map((item, index) => (
                <figure
                  key={`${item.id}-${index}`}
                  className="flex w-[260px] shrink-0 flex-col gap-2 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/60 sm:w-[320px]"
                >
                  <Quote
                    className="h-4 w-4 text-accent dark:text-accent-soft"
                    aria-hidden
                  />
                  <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {item.quote}
                  </blockquote>
                  <figcaption className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    — {item.author.trim() || "Penumpang Baik"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
