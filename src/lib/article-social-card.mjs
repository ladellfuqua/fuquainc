import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import sharp from 'sharp';

export const ARTICLE_SOCIAL_CARD_WIDTH = 1200;
export const ARTICLE_SOCIAL_CARD_HEIGHT = 630;

const require = createRequire(import.meta.url);
const sourceSerifPath = require.resolve(
  '@fontsource-variable/source-serif-4/files/source-serif-4-latin-standard-normal.woff2'
);
const interPath = require.resolve(
  '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
);

const fontData = Promise.all([
  readFile(sourceSerifPath).then((font) => font.toString('base64')),
  readFile(interPath).then((font) => font.toString('base64')),
]);

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const characterWeight = (character) => {
  if (/[MW@%&]/.test(character)) return 1.35;
  if (/[mw]/.test(character)) return 1.18;
  if (/[ilI1.,'’]/.test(character)) return 0.45;
  if (character === ' ') return 0.42;
  return 0.88;
};

const lineWeight = (value) =>
  [...value].reduce((total, character) => total + characterWeight(character), 0);

/**
 * Wrap an article title without coupling cards to any one editorial theme.
 * @param {string} title
 * @param {number} maxWeight
 */
export function wrapSocialTitle(title, maxWeight) {
  const words = title.trim().split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && lineWeight(candidate) > maxWeight) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

const titleLayout = (title) => {
  const candidates = [
    { size: 68, maxWeight: 23, lineHeight: 75 },
    { size: 62, maxWeight: 26, lineHeight: 69 },
    { size: 56, maxWeight: 29, lineHeight: 63 },
  ];

  for (const candidate of candidates) {
    const lines = wrapSocialTitle(title, candidate.maxWeight);
    if (lines.length <= 3) return { ...candidate, lines };
  }

  const lines = wrapSocialTitle(title, 31);
  return {
    size: 51,
    maxWeight: 31,
    lineHeight: 58,
    lines: lines.length > 4 ? [...lines.slice(0, 3), `${lines.slice(3).join(' ')}…`] : lines,
  };
};

/**
 * Render the FUQUA article sharing card. The composition deliberately stays
 * theme-neutral: editorial hierarchy comes from the supplied theme label,
 * while every subject shares the same restrained brand language.
 *
 * @param {{ title: string; theme: string }} article
 * @returns {Promise<Buffer>}
 */
export async function renderArticleSocialCard({ title, theme }) {
  const [sourceSerif, inter] = await fontData;
  const layout = titleLayout(title);
  const firstBaseline = 232 - ((layout.lines.length - 2) * layout.lineHeight) / 2;
  const titleLines = layout.lines
    .map(
      (line, index) =>
        `<tspan x="78" y="${firstBaseline + index * layout.lineHeight}">${xmlEscape(line)}</tspan>`
    )
    .join('');

  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${ARTICLE_SOCIAL_CARD_WIDTH}" height="${ARTICLE_SOCIAL_CARD_HEIGHT}" viewBox="0 0 ${ARTICLE_SOCIAL_CARD_WIDTH} ${ARTICLE_SOCIAL_CARD_HEIGHT}">
      <defs>
        <font-face font-family="Fuqua Serif">
          <font-face-src><font-face-uri href="data:font/woff2;base64,${sourceSerif}" /></font-face-src>
        </font-face>
        <font-face font-family="Fuqua Sans">
          <font-face-src><font-face-uri href="data:font/woff2;base64,${inter}" /></font-face-src>
        </font-face>
        <radialGradient id="plum-wash" cx="78%" cy="18%" r="70%">
          <stop offset="0" stop-color="#6f5368" stop-opacity="0.2" />
          <stop offset="0.54" stop-color="#24344a" stop-opacity="0.1" />
          <stop offset="1" stop-color="#182536" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7f91a5" stop-opacity="0.12" />
          <stop offset="1" stop-color="#7f91a5" stop-opacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="630" fill="#182536" />
      <rect width="1200" height="630" fill="url(#plum-wash)" />

      <g fill="none" stroke="#eef0f2" stroke-width="1.2">
        <circle cx="1104" cy="90" r="300" opacity="0.09" />
        <path d="M690 680 L1230 35" opacity="0.12" />
        <path d="M875 -70 L1228 610" opacity="0.09" />
        <path d="M735 462 H1200" opacity="0.07" />
      </g>
      <rect x="900" y="94" width="230" height="230" fill="url(#edge)" stroke="#7f91a5" stroke-opacity="0.14" transform="rotate(-7 1015 209)" />
      <circle cx="955" cy="284" r="8" fill="#6f5368" />

      <text x="78" y="74" font-family="Fuqua Sans, Arial, sans-serif" font-size="22" font-weight="680" letter-spacing="1.4" fill="#f7f5f0">FUQUA <tspan fill="#aeb8c4">INC.</tspan></text>
      <text x="78" y="132" font-family="Fuqua Sans, Arial, sans-serif" font-size="15" font-weight="620" letter-spacing="2.4" fill="#c9adc1">${xmlEscape(theme.toUpperCase())}</text>
      <text font-family="Fuqua Serif, Georgia, serif" font-size="${layout.size}" font-weight="560" letter-spacing="-1.2" fill="#f7f5f0">${titleLines}</text>

      <line x1="78" y1="526" x2="132" y2="526" stroke="#6f5368" stroke-width="4" />
      <text x="78" y="572" font-family="Fuqua Sans, Arial, sans-serif" font-size="17" font-weight="450" letter-spacing="0.3" fill="#aeb8c4">Writing by Ladell Fuqua</text>
      <text x="1122" y="572" text-anchor="end" font-family="Fuqua Sans, Arial, sans-serif" font-size="17" font-weight="450" letter-spacing="0.3" fill="#aeb8c4">fuquainc.com</text>
    </svg>
  `);

  return sharp(svg)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}
