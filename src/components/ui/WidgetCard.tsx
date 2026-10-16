import type { ReactNode } from "react";

/**
 * Shell widget iOS: kartu frosted glass dengan sudut membulat (rounded-3xl),
 * eyebrow kecil, judul + ikon, dan slot aksi opsional di kanan atas.
 * Dipakai ulang oleh semua section dashboard supaya surface & spacing konsisten.
 */
export function WidgetCard({
  eyebrow,
  title,
  icon,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/80 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent dark:bg-accent-soft/15 dark:text-accent-soft">
              {icon}
            </span>
            <span className="min-w-0">{title}</span>
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

/** Baris label → nilai di dalam widget (grid dua kolom, nilai bisa membungkus). */
export function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 py-2.5 first:pt-0 last:border-b-0 last:pb-0 dark:border-slate-800/80">
      <dt className="shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
