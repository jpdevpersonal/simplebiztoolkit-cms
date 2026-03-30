/**
 * Revalidation API Route
 * Webhook endpoint for C# API to trigger on-demand ISR
 *
 * Usage from C# API:
 * POST /api/revalidate
 * Headers: X-Revalidation-Secret: [your-secret]
 * Body: { "type": "product", "slug": "budget-planner" }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  revalidateProduct,
  revalidateCategory,
  revalidateAllProducts,
  revalidatePage,
  revalidateAllPages,
} from "@/lib/revalidation";
import { requireAuth } from "@/lib/apiProxy";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret or allow an authenticated admin session
    const secret = request.headers.get("X-Revalidation-Secret");

    if (secret !== process.env.REVALIDATION_SECRET) {
      // If the secret didn't match, allow a signed-in admin to revalidate
      const authResult = await requireAuth();
      if (!authResult.ok) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { type, slug, previousSlug } = body;

    // Revalidate based on type
    switch (type) {
      case "product":
        if (slug) {
          await revalidateProduct(slug);
        } else {
          await revalidateAllProducts();
        }
        break;

      case "category":
        if (slug) {
          await revalidateCategory(slug);
        }
        break;

      case "page":
        if (slug || previousSlug) {
          await revalidatePage(slug ?? previousSlug, previousSlug);
        } else {
          await revalidateAllPages();
        }
        break;

      case "all":
        await revalidateAllProducts();
        await revalidateAllPages();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid revalidation type" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Revalidation error:", message);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
