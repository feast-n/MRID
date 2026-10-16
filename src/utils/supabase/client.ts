import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase helper untuk Client Component ('use client').
 * Kredensial HANYA dibaca dari .env.local.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase env: pastikan NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ada di .env.local",
    );
  }

  return createBrowserClient(url, publishableKey);
}
