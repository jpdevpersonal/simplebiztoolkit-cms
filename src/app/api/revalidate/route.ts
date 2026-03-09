/**
 * Revalidation API Route
 * Webhook endpoint for C# API to trigger on-demand ISR
 *
 * Usage from C# API:
 * POST /api/revalidate
 * Headers: X-Revalidation-Secret: [your-secret]
 * Body: { "type": "article", "slug": "bookkeeping-made-simple" }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  revalidateArticle,
  revalidateAllArticles,
  revalidateProduct,
  revalidateCategory,
  revalidateAllProducts,
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
    const { type, slug } = body;

    // Revalidate based on type
    switch (type) {
      case "article":
        if (slug) {
          await revalidateArticle(slug);
        } else {
          await revalidateAllArticles();
        }
        break;

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

      case "all":
        await revalidateAllArticles();
        await revalidateAllProducts();
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
