// Convert generated PNGs to optimized WebP (quality 82) for performance budgets.
import sharp from "sharp";
import { readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = "/home/z/my-project/public/images";

for (const file of await readdir(DIR)) {
  if (!file.endsWith(".png")) continue;
  const src = path.join(DIR, file);
  const out = src.replace(/\.png$/, ".webp");
  const before = (await stat(src)).size;
  const buf = await sharp(src).webp({ quality: 82 }).toBuffer();
  await writeFile(out, buf);
  await unlink(src);
  const after = buf.length;
  console.log(`${file} -> ${path.basename(out)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}
console.log("OPTIMIZE DONE");
