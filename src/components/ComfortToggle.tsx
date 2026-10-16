"use client";

import { useSyncExternalStore } from "react";
import { MessageCircle, Sparkles, VolumeX } from "lucide-react";

type ComfortMode = "quiet" | "chatty";

const STORAGE_KEY = "mrid:comfort-mode";
/** Event custom supaya perubahan mode ikut ke-render ulang (lint-safe, tanpa setState di effect). */
const CHANGE_EVENT = "mrid:comfort-mode-change";

const MODE_CONTENT: Record<
  ComfortMode,
  { label: string; caption: string; icon: typeof VolumeX }
> = {
  quiet: {
    label: "Quiet Ride",
    caption: "Diam dulu ya — penumpang lagi pengen santai 🤫",
    icon: VolumeX,
  },
  chatty: {
    label: "Bebas Ngobrol",
    caption: "Gas ngobrol aja, santai — yang penting tetep fokus nyetir 😄",
    icon: MessageCircle,
  },
};

function getModeSnapshot(): ComfortMode {
  return window.localStorage.getItem(STORAGE_KEY) === "chatty"
    ? "chatty"
    : "quiet";
}

function getServerSnapshot(): ComfortMode {
  return "quiet";
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function persistMode(mode: ComfortMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Passenger Comfort Toggle — sakelar interaktif ala iOS buat milih vibes
 * perjalanan: "Quiet Ride" atau "Bebas Ngobrol". Pilihan disimpan di
 * localStorage supaya tetap kepilih pas dibuka lagi.
 */
export default function ComfortToggle() {
  const mode = useSyncExternalStore(
    subscribe,
    getModeSnapshot,
    getServerSnapshot,
  );

  const content = MODE_CONTENT[mode];
  const Icon = content.icon;
  const isQuiet = mode === "quiet";

  return (
    <section className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Passenger Vibes
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent dark:bg-accent-soft/15 dark:text-accent-soft">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h2 className="min-w-0 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {content.label}
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {content.caption}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={!isQuiet}
          aria-label="Ubah mode perjalanan: Quiet Ride atau Bebas Ngobrol"
          onClick={() => persistMode(isQuiet ? "chatty" : "quiet")}
          className={`relative mt-0.5 h-8 w-[52px] shrink-0 rounded-full p-[3px] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95 ${
            isQuiet ? "bg-slate-300 dark:bg-slate-700" : "bg-accent dark:bg-accent-soft"
          }`}
        >
          <span
            className={`block h-[26px] w-[26px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
              isQuiet ? "translate-x-0" : "translate-x-[20px]"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isQuiet
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          Quiet Ride
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !isQuiet
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          Bebas Ngobrol
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent dark:bg-accent-soft/15 dark:text-accent-soft">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Helm wangi, siap pakai
        </span>
      </div>
    </section>
  );
}
