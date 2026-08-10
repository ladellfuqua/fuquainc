// Generates the homepage social-preview card from the approved hero assets.
// Re-run with: node scripts/make-og-image.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const root = new URL('../', import.meta.url);
const backdropPath = fileURLToPath(new URL('public/images/hero/hero-backdrop-1600.jpg', root));
const portraitPath = fileURLToPath(new URL('public/images/hero/portrait-560.png', root));
const outputPath = fileURLToPath(new URL('public/og-home-2026.png', root));

const backdrop = await sharp(backdropPath)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .png()
  .toBuffer();

const portrait = await sharp(portraitPath)
  .resize({ width: 344 })
  .png()
  .toBuffer();

const treatment = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0f1927" stop-opacity=".96"/>
      <stop offset=".54" stop-color="#182536" stop-opacity=".84"/>
      <stop offset="1" stop-color="#111b2a" stop-opacity=".58"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b121c" stop-opacity="0"/>
      <stop offset="1" stop-color="#0b121c" stop-opacity=".72"/>
    </linearGradient>
    <radialGradient id="glow" cx="76%" cy="43%" r="46%">
      <stop offset="0" stop-color="#9f8c9b" stop-opacity=".24"/>
      <stop offset="1" stop-color="#9f8c9b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect y="300" width="${W}" height="330" fill="url(#bottom)"/>
  <path d="M655 -40 L1035 670" stroke="#f7f5f0" stroke-opacity=".08"/>
  <path d="M865 -40 L1205 580" stroke="#c9adc1" stroke-opacity=".08"/>
</svg>`);

const copy = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="72" y="80" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="1.2" fill="#f2efe8">FUQUA <tspan fill="#c7cbd0">INC.</tspan></text>
  <text font-family="Inter, Arial, sans-serif" font-size="52" font-weight="650" letter-spacing="-1.5" fill="#f2efe8">
    <tspan x="72" y="230">Building growth by</tspan>
    <tspan x="72" y="288">connecting ideas,</tspan>
    <tspan x="72" y="346">people, technology</tspan>
    <tspan x="72" y="404">and opportunity.</tspan>
  </text>
  <text font-family="Inter, Arial, sans-serif" font-size="18" font-weight="400" fill="#d4d8de">
    <tspan x="74" y="465">Connecting disciplines and teams to solve problems</tspan>
    <tspan x="74" y="493">that don’t fit neatly within one function.</tspan>
  </text>
  <rect x="74" y="532" width="54" height="3" fill="#c9adc1"/>
  <text x="992" y="546" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="650" letter-spacing="2" fill="#e1e3e6">LADELL FUQUA</text>
  <text x="992" y="570" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="450" fill="#bdc4cc">New York</text>
</svg>`);

await sharp(backdrop)
  .composite([
    { input: treatment, left: 0, top: 0 },
    { input: portrait, left: 820, top: 100 },
    { input: copy, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log('Wrote', outputPath);
