"use client";

import { useSyncExternalStore } from "react";
import { MessageCircle, VolumeX } from "lucide-react";

type ComfortMode = "quiet" | "chatty";

const STORAGE_KEY = "mrid:comfort-mode";
/** Event custom supaya perubahan mode ikut ke-render ulang (lint-safe, no setState di effect). */
const CHANGE_EVENT = "mrid:comfort-mode-change";

const MODE_CONTENT: Record<
  ComfortMode,
  { label: string; caption: string; icon: typeof VolumeX }
> = {
  quiet: {
    label: "Quiet Ride",
    caption: "Diam dulu ya, penumpang lagi mau santai nih 🤫",
    icon: VolumeX,
  },
  chatty: {
    label: "Bebas Ngobrol",
    caption: "Gas ngobrol aja, santai — asal jangan ngebut ngobrolnya 😄",
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
 * Feature 1 — Passenger Comfort Toggle.
 * Sakelar interaktif ala iOS buat milih vibes perjalanan:
 * "Quiet Ride" atau "Bebas Ngobrol". Pilihan disimpan di localStorage.
 */
export default function ComfortToggle() {
  const mode = useSyncExternalStore(subscribe, getModeSnapshot, getServerSnapshot);

  function toggle() {
    persistMode(mode === "quiet" ? "chatty" : "quiet");
  }

  const content = MODE_CONTENT[mode];
  const Icon = content.icon;
  const isQuiet = mode === "quiet";

  return (
    <section className="rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Passenger Vibes
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[#007AFF] dark:text-[#06B6D4]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {content.label}
            </h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {content.caption}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isQuiet ? false : true}
          aria-label="Toggle mode Quiet Ride atau Bebas Ngobrol"
          onClick={toggle}
          className={`mt-1 h-8 w-[54px] shrink-0 rounded-full p-[3px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${
            isQuiet
              ? "bg-slate-300 dark:bg-slate-700"
              : "bg-[#007AFF] dark:bg-[#06B6D4]"
          }`}
        >
          <span
            className={`block h-[26px] w-[26px] rounded-full bg-white shadow-md transition-transform duration-300 ${
              isQuiet ? "translate-x-0" : "translate-x-[26px]"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isQuiet
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          🤫 Quiet Ride
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !isQuiet
              ? "bg-[#007AFF] text-white dark:bg-[#06B6D4]"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          💬 Bebas Ngobrol
        </span>
      </div>
    </section>
  );
}
