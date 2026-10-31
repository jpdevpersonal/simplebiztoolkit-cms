import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiProxy";

// Data-cache tags used by the public site's fetches (see src/lib/api.ts).
const SITE_CACHE_TAGS = ["products", "faqs", "stats", "menus"];

/**
 * Lets a signed-in CMS user purge the cached public site so recent edits
 * appear immediately instead of after the 5-minute ISR window.
 */
export async function POST() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    // Revalidating the root layout invalidates every route below it,
    // including fetches tagged per page (e.g. `page-${slug}`).
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    for (const tag of SITE_CACHE_TAGS) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[admin/revalidate] Failed",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
