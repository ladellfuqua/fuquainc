// One-off generator for public/og-default.png (LAD-6).
// Renders an on-brand 1200x630 social card with sharp. Re-run with:
//   node scripts/make-og-image.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;

// Brand palette (mirrors src/styles/tokens.css)
const IVORY = '#f7f5f0';
const STONE = '#e3dfd8';
const NAVY = '#182536';
const GRAPHITE = '#4b5056';
const PLUM = '#6f5368';
const SLATE = '#7f91a5';
const LINE = '#d6d1c7';

// Abstract graphic language: thin architectural lines, overlapping planes,
// a few deliberate nodes, generous negative space. Not a diagram.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${IVORY}"/>

  <!-- Right-hand brand composition, cropped by the canvas -->
  <g transform="translate(760, 40)" stroke-linecap="round">
    <circle cx="330" cy="150" r="262" fill="none" stroke="${NAVY}" stroke-width="1.2" opacity="0.5"/>
    <rect x="150" y="30" width="252" height="300" fill="${STONE}" opacity="0.62"/>
    <rect x="18" y="120" width="152" height="152" fill="none" stroke="${SLATE}" stroke-width="1.2" opacity="0.6" transform="rotate(-8 94 196)"/>
    <rect x="80" y="214" width="204" height="212" fill="${PLUM}" opacity="0.17"/>
    <line x1="-74" y1="510" x2="444" y2="56" stroke="${NAVY}" stroke-width="1.2" opacity="0.72"/>
    <line x1="50" y1="-40" x2="370" y2="582" stroke="${GRAPHITE}" stroke-width="1.1" opacity="0.42"/>
    <path d="M366 -2 H448 V80" fill="none" stroke="${PLUM}" stroke-width="1.3" opacity="0.7"/>
    <circle cx="200" cy="270" r="6" fill="${PLUM}"/>
    <circle cx="150" cy="120" r="6.5" fill="${IVORY}" stroke="${NAVY}" stroke-width="1.4"/>
    <circle cx="284" cy="336" r="4" fill="${SLATE}"/>
  </g>

  <!-- Wordmark -->
  <text x="80" y="150" font-family="Inter, system-ui, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="1" fill="${NAVY}">FUQUA <tspan fill="${GRAPHITE}">INC.</tspan></text>

  <!-- Headline -->
  <text font-family="Inter, system-ui, Arial, sans-serif" font-weight="600" fill="${NAVY}" font-size="58" letter-spacing="-1">
    <tspan x="80" y="330">Building growth by</tspan>
    <tspan x="80" y="398">connecting ideas,</tspan>
    <tspan x="80" y="466">people, technology</tspan>
    <tspan x="80" y="534">and opportunity.</tspan>
  </text>

  <!-- Accent rule -->
  <rect x="82" y="560" width="54" height="3" fill="${PLUM}"/>
</svg>`;

const out = fileURLToPath(new URL('../public/og-default.png', import.meta.url));
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Wrote', out);
