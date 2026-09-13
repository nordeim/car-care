import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Generates browser icon assets from the site icon (src/app/icon.svg):
 *   - src/app/apple-icon.png   (180x180 PNG — Next emits <link rel="apple-touch-icon">)
 *   - public/favicon.ico       (ICO container with a 32x32 PNG entry — legacy path)
 *
 * SEO parity G5. Idempotent: safe to re-run (regenerates both files).
 */

const ROOT = path.resolve(import.meta.dir, "..");
const SVG = path.join(ROOT, "src/app/icon.svg");
const APPLE = path.join(ROOT, "src/app/apple-icon.png");
const ICO = path.join(ROOT, "public/favicon.ico");

async function main() {
  const svg = fs.readFileSync(SVG);

  // Apple touch icon: 180x180, opaque background (iOS rounds the corners).
  const applePng = await sharp(svg, { density: 300 })
    .resize(180, 180, { fit: "contain", background: "#f2a61c" })
    .png()
    .toBuffer();
  fs.writeFileSync(APPLE, applePng);
  console.log(`wrote ${path.relative(ROOT, APPLE)} (${applePng.length} bytes)`);

  // Favicon: 32x32 PNG packed into a minimal ICO container (PNG entries are
  // valid inside ICO since Vista; every modern browser reads them).
  const png32 = await sharp(svg, { density: 300 })
    .resize(32, 32, { fit: "contain", background: "#f2a61c" })
    .png()
    .toBuffer();

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count: 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width (0 means 256; 32 is literal)
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png32.length, 8); // bytes
  entry.writeUInt32LE(6 + 16, 12); // offset of PNG data

  const ico = Buffer.concat([header, entry, png32]);
  fs.writeFileSync(ICO, ico);
  console.log(`wrote ${path.relative(ROOT, ICO)} (${ico.length} bytes)`);

  // Sanity: ICO magic + PNG signature inside.
  if (ico.readUInt16LE(2) !== 1) throw new Error("ICO type word wrong");
  if (!png32.subarray(1, 4).equals(Buffer.from("PNG"))) throw new Error("inner PNG signature wrong");
  console.log("ico container sanity checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
