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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 bg-white/70 p-6 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#06B6D4] text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Restricted Area
            </p>
            <h1 className="text-xl font-semibold">Admin MRID</h1>
          </div>
        </div>

        <p className="mb-4 mt-4 text-sm text-slate-500">
          Masuk dulu ya biar bisa cek feedback penumpang &amp; moderasi kutipan
          motivasi.
        </p>

        <LoginForm />

        <p className="mt-4 text-center text-xs text-slate-400">
          Bukan admin? Balik ke{" "}
          <Link
            href="/"
            className="font-medium text-[#007AFF] hover:underline dark:text-[#06B6D4]"
          >
            dashboard publik
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
