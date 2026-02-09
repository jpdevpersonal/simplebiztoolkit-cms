#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public", "images", "products");
const OUTPUT_SUFFIX = "-md"; // appended before extension
const MAX_WIDTH = 1200;
const QUALITY = 80;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full);
      continue;
    }

    const ext = path.extname(ent.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
    if (ent.name.endsWith(`${OUTPUT_SUFFIX}.webp`)) continue; // skip already-generated

    const base = path.basename(ent.name, ext);
    const outName = `${base}${OUTPUT_SUFFIX}.webp`;
    const outPath = path.join(dir, outName);

    try {
      // if output already exists and is newer, skip
      const [inStat, outStat] = await Promise.all([
        fs.stat(full),
        fs.stat(outPath).catch(() => null),
      ]);
      if (outStat && outStat.mtimeMs >= inStat.mtimeMs) {
        console.log("skip (up-to-date):", outPath);
        continue;
      }
    } catch (e) {
      // ignore
    }

    console.log("resizing:", full, "->", outPath);
    try {
      const image = sharp(full);
      const metadata = await image.metadata();
      
      // Only apply max width for portrait images (height > width)
      const isLandscape = metadata.width >= metadata.height;
      
      if (isLandscape) {
        // No width restriction for landscape images
        await image
          .webp({ quality: QUALITY })
          .toFile(outPath);
      } else {
        // Apply max width for portrait images
        await image
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(outPath);
      }
    } catch (err) {
      console.error("failed to resize", full, err);
    }
  }
}

async function main() {
  try {
    await walk(ROOT);
    console.log("done");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
