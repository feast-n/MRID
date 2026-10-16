import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase helper untuk Server Component.
 * Kredensial HANYA dibaca dari .env.local.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase env: pastikan NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ada di .env.local",
    );
  }

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component tidak bisa set cookies — aman diabaikan
          // karena middleware yang melakukan refresh session.
        }
      },
    },
  });
}
