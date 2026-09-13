// Generate responsive variants of the hero image (R-2, audit cycle 2).
// The hero is the LCP element; phones previously downloaded the full
// 1344px/161KB file. Produces 640w and 1024w webp variants next to the
// original (which stays as the desktop src + srcset fallback).
import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

const SRC = "/home/z/my-project/public/images/hero-car.webp";

for (const width of [640, 1024]) {
  const out = SRC.replace(/\.webp$/, `-${width}w.webp`);
  const buf = await sharp(SRC).resize({ width }).webp({ quality: 80 }).toBuffer();
  await writeFile(out, buf);
  const origSize = (await stat(SRC)).size;
  console.log(
    `hero-car-${width}w.webp: ${(buf.length / 1024).toFixed(0)}KB (orig ${(origSize / 1024).toFixed(0)}KB)`,
  );
}
console.log("HERO VARIANTS DONE");
