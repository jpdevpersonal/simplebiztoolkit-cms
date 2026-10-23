import { site } from "@/config/site";
import { featuredTools } from "@/data/featuredTools";
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
    "Simple Biz Toolkit offers business templates and browser-based tools for small business owners, online sellers, freelancers and landlords. Template purchases are completed through Etsy; check each listing for its current file details.",
  );
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  lines.push(
    `- [Home](${site.url}/): Overview of who we are and what we sell.`,
  );
  lines.push(
    `- [About](${site.url}/about): Background on the shop, templates, and tools.`,
  );
  lines.push(
    `- [All templates](${site.url}/templates): Browse template categories and available products.`,
  );
  lines.push(
    `- [FAQ](${site.url}/faq): Product, file, delivery, and purchase information.`,
  );
  lines.push(
    `- [Testimonials](${site.url}/testimonials): Selected customer feedback.`,
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
  for (const tool of featuredTools) {
    lines.push(
      `- [${tool.title}](${toAbsoluteUrl(tool.href)}): ${tool.tagline}`,
    );
  }
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
