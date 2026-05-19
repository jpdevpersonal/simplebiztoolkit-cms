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

function stripHtml(s: string | undefined | null, maxLen = 800): string {
  if (!s) return "";
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/**
 * /llms-full.txt — opt-in detailed corpus for LLM crawlers.
 *
 * Includes a description of every category and every product, plus a summary
 * paragraph for every published CMS article/guide so that an LLM can answer
 * "what does Simple Biz Toolkit sell?" without retrieving individual pages.
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

  lines.push(`# ${site.name} — Full Reference`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    "Simple Biz Toolkit sells printable and fillable PDF templates for small business owners, online sellers, freelancers and landlords. Every template is delivered as an instant digital download through Etsy. The shop holds Etsy Star Seller status with a 5.0 average rating across 3,700+ reviews and 3,500+ sales.",
  );
  lines.push("");
  lines.push(
    "Contact: " + site.contactEmail + " · Etsy shop: " + site.socialUrls[0],
  );
  lines.push("");

  // Categories with full descriptions
  for (const c of categories) {
    lines.push(`## ${c.name}`);
    lines.push(`URL: ${site.url}/templates/${c.slug}`);
    lines.push("");
    if (c.summary) lines.push(stripHtml(c.summary, 1200));
    if (c.howThisHelps) {
      lines.push("");
      lines.push(stripHtml(c.howThisHelps, 1200));
    }
    lines.push("");

    for (const p of c.items || []) {
      const route = toTemplatesRoute(p.productPageUrl);
      if (!route) continue;
      lines.push(`### ${p.title}`);
      lines.push(`URL: ${site.url}${route}`);
      lines.push(`Price: ${p.price}`);
      lines.push(`Etsy: ${p.etsyUrl}`);
      const desc = stripHtml(p.description, 800) || stripHtml(p.problem, 400);
      if (desc) {
        lines.push("");
        lines.push(desc);
      }
      if (p.bullets?.length) {
        lines.push("");
        for (const b of p.bullets) lines.push(`- ${b}`);
      }
      lines.push("");
    }
  }

  // Articles & guides
  for (const item of menuContent) {
    if (item.totalPages === 0) continue;
    lines.push(`## ${item.title}`);
    lines.push(`URL: ${toAbsoluteUrl(getMenuItemLandingHref(item))}`);
    if (item.description) {
      lines.push("");
      lines.push(stripHtml(item.description, 800));
    }
    lines.push("");

    const allPages = [
      ...item.directPages,
      ...item.publishedCategories.flatMap((cat) =>
        cat.publishedPages.map((page) => ({ ...page, _cat: cat.title })),
      ),
    ];

    for (const page of allPages) {
      const catSlug = (page as { _cat?: string })._cat
        ? `/pages/${slugify(item.title)}/${slugify((page as { _cat?: string })._cat ?? "")}`
        : "";
      const href =
        page.canonicalUrl ??
        (catSlug ? `${catSlug}/${page.slug}` : `/${page.slug}`);
      lines.push(`### ${page.title}`);
      lines.push(`URL: ${toAbsoluteUrl(href)}`);
      const summary =
        page.seoDescription ?? page.subtitle ?? stripHtml(page.content, 600);
      if (summary) {
        lines.push("");
        lines.push(stripHtml(summary, 600));
      }
      lines.push("");
    }
  }

  // Static pages
  lines.push("## Reference pages");
  lines.push("");
  lines.push(`- About: ${site.url}/about`);
  lines.push(`- FAQ: ${site.url}/faq`);
  lines.push(`- Testimonials: ${site.url}/testimonials`);
  lines.push(`- Contact: ${site.url}/contact`);
  lines.push(`- All templates: ${site.url}/templates`);
  lines.push(
    `- CSV Profit Calculator: ${site.url}/tools/csv-profit-calculator`,
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
