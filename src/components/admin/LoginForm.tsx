"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/**
 * Form login admin (Supabase Auth — email & password).
 * COMPOSER: satu-satunya tempat tombol login berada; halaman client (/) tidak
 * pernah menampilkan tombol login.
 */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          `Waduh, gagal masuk (${error.message}). Cek lagi email & password ya!`,
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(`Ada gangguan nih (${message}). Coba lagi ya!`);
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-accent-soft";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Email admin
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@mrid.app"
          disabled={isLoading}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 dark:bg-accent-soft"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Lagi masuk...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden />
            Masuk Admin
          </>
        )}
      </button>

      {errorMessage && (
        <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
