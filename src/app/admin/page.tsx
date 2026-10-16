import { redirect } from "next/navigation";
import AdminDashboard, {
  type FeedbackRow,
  type MotivationRow,
} from "@/components/admin/AdminDashboard";
import { type GalleryPhoto } from "@/config/gallery";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Admin — MRID",
};

/**
 * Sisi admin. Dilindungi auth check di Server Component:
 * belum login → langsung dialihkan ke /admin/login.
 * Auth read terjadi saat request, jadi route ini tidak di-prerender.
 */
export const instant = false;

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [feedbackResult, motivationResult, galleryResult] =
    await Promise.all([
      supabase
        .from("feedback")
        .select("id, passenger_name, comment, rating, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("motivations")
        .select("id, author, quote, is_approved, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("gallery_photos")
        .select("id, caption, storage_path, public_url, created_at")
        .order("created_at", { ascending: false })
        .limit(48),
    ]);

  const loadFailed = Boolean(
    feedbackResult.error || motivationResult.error || galleryResult.error,
  );

  return (
    <AdminDashboard
      email={user.email ?? "admin"}
      initialFeedback={(feedbackResult.data ?? []) as FeedbackRow[]}
      initialMotivations={(motivationResult.data ?? []) as MotivationRow[]}
      initialGallery={(galleryResult.data ?? []) as GalleryPhoto[]}
      loadFailed={loadFailed}
    />
  );
}
