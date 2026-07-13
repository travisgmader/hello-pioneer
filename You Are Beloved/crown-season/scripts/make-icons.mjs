/**
 * make-icons.mjs — render the stag emblem (public/stag.svg) to the PNG sizes
 * the PWA manifest + iOS home screen need, centered on the brand field.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, '..', 'public');
const BG = '#131313';

const stagSvg = readFileSync(join(pub, 'stag.svg'), 'utf8');

// Maskable icon SVG: emblem centered on the obsidian field with safe padding.
const inner = stagSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const vb = (stagSvg.match(/viewBox="([^"]+)"/) || [, '0 0 416 490'])[1];
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BG}"/>
  <svg x="96" y="76" width="320" height="360" viewBox="${vb}" fill="#f2ca50" preserveAspectRatio="xMidYMid meet">${inner}</svg>
</svg>`;
writeFileSync(join(pub, 'icon.svg'), iconSvg);

const buf = Buffer.from(iconSvg);
const targets = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of targets) {
  await sharp(buf).resize(size, size).png().toFile(join(pub, name));
  console.log(`wrote ${name} (${size}px)`);
}
