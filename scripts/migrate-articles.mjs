/**
 * Migration Script: Convert Static Articles to Database Format
 * 
 * This script converts your existing React article components to JSON
 * that can be imported into your C# API database.
 * 
 * Usage: node scripts/migrate-articles.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your existing posts data
import { posts } from "../src/data/posts.ts";

/**
 * Convert React component content to HTML with data attributes
 * 
 * This is a manual process - you'll need to copy your article content
 * and wrap it with proper data attributes for the renderer.
 */
const articleContentMap = {
  "bookkeeping-made-simple": `
<section data-component="section">
  <p>Most small businesses don't fail because they chose the wrong accounting software. They fail because they never built a repeatable bookkeeping habit in the first place.</p>
  <p>At the early stages of a business, whether you're running an online shop, freelancing, or managing a side hustle, the goal isn't perfect accounting. The goal is clarity, consistency, and control.</p>
  <p>That starts with a system simple enough that you'll actually use it.</p>
</section>

<section data-component="section">
  <h2>The costly mistake most business owners make</h2>
  <p>One of the most common patterns is this: bookkeeping gets ignored until tax season arrives. By that point, receipts are missing, transactions are half-remembered, and bank statements don't line up. Stress spikes unnecessarily.</p>
  <p>This isn't a discipline problem, it's a system problem. When record-keeping feels complicated or time-consuming, it gets pushed aside. The fix is not more software, it's a lighter, more usable process.</p>
</section>

<section data-component="section">
  <h2>Start with one non‑negotiable habit</h2>
  <p>The most effective bookkeeping systems all share one thing in common: regularity. A single weekly check-in beats a perfect system used once a year. Your baseline habit should be: record income and expenses once per week. That's it.</p>
  
  <aside data-component="callout" data-title="Keep it tiny and repeatable">
    A 15-minute weekly reset is much easier to keep than a perfect daily routine. Build the habit first, optimise later.
  </aside>
</section>

<!-- Add remaining sections following the same pattern -->
`,

  // Add other articles here
  "etsy-seller-finances-in-one-place": "<!-- TODO: Add content -->",
  "adobe-express-etsy": "<!-- TODO: Add content -->",
  "rent-payment-ledger": "<!-- TODO: Add content -->",
  "business-ledger-bundle-essential-templates": "<!-- TODO: Add content -->",
};

/**
 * Generate migration JSON
 */
function generateMigrationJson() {
  const articles = posts.map((post, index) => {
    return {
      id: `article-${index + 1}`,
      slug: post.slug,
      title: post.title,
      subtitle: post.subtitle || "",
      description: post.description,
      content: articleContentMap[post.slug] || "<!-- Content needs to be added -->",
      dateISO: post.dateISO,
      dateModified: post.dateISO,
      category: post.category,
      readingMinutes: post.readingMinutes,
      badges: post.badges || [],
      featuredImage: post.featuredImage || "",
      headerImage: post.headerImage || "",
      status: "published",
      seoTitle: post.title,
      seoDescription: post.description,
      ogImage: post.featuredImage || "",
      canonicalUrl: `/blog/${post.slug}`,
    };
  });

  return articles;
}

/**
 * Save migration file
 */
const articles = generateMigrationJson();
const outputPath = path.join(__dirname, "../migration-data/articles.json");

// Create migration-data directory if it doesn't exist
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2), "utf-8");

console.log(`✅ Migration file created: ${outputPath}`);
console.log(`📊 Migrated ${articles.length} articles`);
console.log("\n⚠️  IMPORTANT: Review the content HTML in each article before importing to database.");
console.log("   You'll need to manually convert your React components to HTML with data attributes.");
