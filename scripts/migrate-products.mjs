/**
 * Migration Script: Convert Static Products to Database Format
 * 
 * Usage: node scripts/migrate-products.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your existing products data
import { categories } from "../src/data/products.ts";

/**
 * Generate product migration JSON
 */
function generateProductMigration() {
  const categoryData = categories.map((category, catIndex) => {
    const categoryRecord = {
      id: `category-${catIndex + 1}`,
      slug: category.slug,
      name: category.name,
      summary: category.summary,
      howThisHelps: category.howThisHelps,
      heroImage: category.heroImage,
    };

    const productRecords = category.items.map((item, itemIndex) => {
      // Extract slug from productPageUrl
      const slugParts = item.productPageUrl.split("/");
      const slug = slugParts[slugParts.length - 1];

      return {
        id: `product-${catIndex + 1}-${itemIndex + 1}`,
        title: item.title,
        slug: slug,
        problem: item.problem,
        description: item.description || "",
        bullets: item.bullets,
        image: item.image,
        etsyUrl: item.etsyUrl,
        price: item.price,
        categoryId: categoryRecord.id,
        status: "published",
      };
    });

    return {
      category: categoryRecord,
      products: productRecords,
    };
  });

  return categoryData;
}

/**
 * Save migration files
 */
const data = generateProductMigration();
const outputPath = path.join(__dirname, "../migration-data/products.json");

// Create migration-data directory if it doesn't exist
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

console.log(`✅ Migration file created: ${outputPath}`);
console.log(`📊 Migrated ${data.length} categories with ${data.reduce((sum, d) => sum + d.products.length, 0)} products`);
