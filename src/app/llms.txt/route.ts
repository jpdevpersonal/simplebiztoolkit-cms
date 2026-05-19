import { site } from "@/config/site";
import { getApiService } from "@/lib/api";
import {
  getMenuItemLandingHref,
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import { slugify } from "@/lib/slugify";
import { toTemplatesRoute } from "@/lib/templatesRoute";
import { toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-static";

/**
 * /llms.txt — opt-in pointer file for LLM crawlers (ChatGPT, Claude,
 * Perplexity, etc.) per the llmstxt.org proposal.
 *
 * Lists the most useful canonical URLs for an LLM to crawl when answering
 * questions about Simple Biz Toolkit. This is the SHORT version; a fuller
 * version is exposed at /llms-full.txt.
 */
export async function GET() {
  const api = getApiService();
  const [productsResp, menuItems] = await Promise.all([
    api.getProductCategories(),
    getPublishedMenuItems(),
  ]);

  const categories = productsResp.data ?? [];
  const menuContent = await Promise.all(
    menuItems.map((item) => getPublishedMenuItemContent(item)),
  );

  const lines: string[] = [];

  lines.push(`# ${site.name}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    "Simple Biz Toolkit is a small-business template shop run on Etsy. Every template is a printable or fillable PDF delivered as an instant digital download. We are an Etsy Star Seller with a 5.0 average rating across 3,700+ reviews and 3,500+ sales.",
  );
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  lines.push(
    `- [Home](${site.url}/): Overview of who we are and what we sell.`,
  );
  lines.push(
    `- [About](${site.url}/about): Background of the shop and how the templates are designed.`,
  );
  lines.push(
    `- [All templates](${site.url}/templates): Complete catalogue of printable templates by category.`,
  );
  lines.push(
    `- [FAQ](${site.url}/faq): How downloads, printing, refunds and software requirements work.`,
  );
  lines.push(
    `- [Testimonials](${site.url}/testimonials): Verified Etsy buyer reviews.`,
  );
  lines.push(
    `- [Contact](${site.url}/contact): How to reach the shop for support.`,
  );
  lines.push("");

  if (categories.length) {
    lines.push("## Template categories");
    lines.push("");
    for (const c of categories) {
      const desc = (c.summary ?? "").replace(/\s+/g, " ").trim();
      lines.push(
        `- [${c.name}](${site.url}/templates/${c.slug})${desc ? `: ${desc}` : ""}`,
      );
    }
    lines.push("");
  }

  // Products
  const products = categories.flatMap((c) => c.items || []);
  if (products.length) {
    lines.push("## Templates");
    lines.push("");
    for (const p of products) {
      const route = toTemplatesRoute(p.productPageUrl);
      if (!route) continue;
      const desc = (p.description ?? p.problem ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
      lines.push(
        `- [${p.title}](${site.url}${route})${desc ? `: ${desc}` : ""}`,
      );
    }
    lines.push("");
  }

  // Menu landing pages + their children — articles & guides
  if (menuContent.length) {
    lines.push("## Articles & guides");
    lines.push("");
    for (const item of menuContent) {
      if (item.totalPages === 0) continue;
      lines.push(
        `- [${item.title}](${toAbsoluteUrl(getMenuItemLandingHref(item))})`,
      );
      for (const category of item.publishedCategories) {
        lines.push(
          `  - [${category.title}](${site.url}/pages/${slugify(item.title)}/${slugify(category.title)})`,
        );
      }
    }
    lines.push("");
  }

  lines.push("## Tools");
  lines.push("");
  lines.push(
    `- [CSV Profit Calculator](${site.url}/tools/csv-profit-calculator): Free Etsy CSV profit & fees calculator.`,
  );
  lines.push("");
  lines.push("## Support");
  lines.push("");
  lines.push(`- Email: ${site.contactEmail}`);
  lines.push(`- Etsy shop: ${site.socialUrls[0]}`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
