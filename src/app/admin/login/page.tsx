import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import LoginForm from "@/components/admin/LoginForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login — MRID",
};

/** Auth read terjadi saat request, jadi route ini tidak di-prerender. */
export const instant = false;

/**
 * Halaman login admin. SATU-SATUNYA tempat tombol login ditampilkan —
 * halaman client (/) tidak punya tombol login sama sekali.
 */
export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/60 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Restricted Area
            </p>
            <h1 className="text-xl font-semibold">Admin MRID</h1>
          </div>
        </div>

        <p className="mb-4 mt-4 text-xs font-normal text-slate-500 dark:text-slate-400">
          Masuk dulu ya biar bisa cek feedback penumpang &amp; moderasi kutipan
          motivasi.
        </p>

        <LoginForm />

        <p className="mt-4 text-center text-xs text-slate-400">
          Bukan admin? Balik ke{" "}
          <Link
            href="/"
            className="font-medium text-accent hover:underline dark:text-accent-soft"
          >
            dashboard publik
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
