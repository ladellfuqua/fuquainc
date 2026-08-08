# FUQUA INC. — Visual System Rules

_Status: **locked** for v1.2 (Linear LAD-7). This is the practical ruleset that governs
how the brand's type, color, linework, planes, spacing and motion are used. It reflects
the approved foundation already implemented in `src/styles/tokens.css`,
`src/styles/global.css` and `src/components/BrandGraphic.astro` — it does not redesign it._

_Companion: an illustrated, example-driven reference (principles, composition types,
do/don't gallery) is tracked separately as **LAD-5** and will build on these rules._

Golden rule: **restraint.** When in doubt, use less — less color, less motion, less weight,
more space. The system should read as a contemporary editorial / gallery identity, never as
a dashboard, flowchart or marketing template.

> **Illustrated companion:** a live, viewable reference (swatches, type samples, the graphic
> variants, anatomy, do/don't) is rendered at **`/visual-system`** (`src/pages/visual-system.astro`)
> — an internal `noindex` page, excluded from the sitemap, with no site nav. Use it to *see* the
> system; use this file for the authoritative rules.

---

## 0. Principles

1. **Restraint first.** When in doubt, use less — less color, less motion, less weight, more space.
2. **Convergence is the idea.** Overlapping planes and meeting lines express disciplines, people
   and teams coming together — that's the concept the graphic carries.
3. **Art, not diagram.** Linework crops off-canvas and never explains a process. No arrows,
   no connectors, no wired-up nodes.
4. **Neutrals carry, accents punctuate.** Ivory, stone, navy and graphite do the work; plum and
   slate appear sparingly.
5. **Editorial typography.** Clear hierarchy, controlled line length, restrained weight.
6. **Accessible and calm.** Everything is reduced-motion safe and meets AA contrast; the graphic
   is decorative only.

---

## 1. Hero — locked

The homepage hero (`src/pages/index.astro`) is final for v1.2. Treat copy and composition as
fixed; change only with a new decision, not in passing.

**Copy (locked)**
- Headline: _"Building growth by connecting ideas, people, technology and opportunity."_
- Lead: _"I work across growth, marketing, technology and business transformation, often
  bringing different disciplines and teams together to solve problems that do not fit neatly
  within one function."_
- Primary CTA: **Read the latest →** `/writing` (plum button — the one plum moment in view)
- Secondary CTA: **About Ladell →** `/about` (quiet arrow-link, never a second filled button)

**Composition (locked)**
- Two-column grid, `1.05fr / 0.95fr`, vertically centered; copy left, art right.
- Art uses `BrandGraphic variant="hero"` in a `52 / 60` frame, `overflow: hidden` (intentional crop).
- ≤ 52rem: single column; the graphic moves **above** the copy (`order: -1`) in a `16 / 9`
  band bled to the screen edges.
- Entrance: headline → lead → actions/art reveal in sequence (see §6). Above-the-fold only.

Rule: exactly **one** hero graphic and **one** primary (plum) button per view. No stacked CTAs
beyond the primary + one arrow-link.

---

## 2. Color

Palette (raw tokens in `tokens.css`):

| Token | Hex | Role |
|---|---|---|
| `--c-ivory` | `#f7f5f0` | Primary background |
| `--c-stone` | `#e3dfd8` | Secondary background / section shift |
| `--c-navy` | `#182536` | Headings, footer, dark sections |
| `--c-graphite` | `#4b5056` | Body copy, muted UI |
| `--c-plum` | `#6f5368` | **Signature accent — sparingly** |
| `--c-slate` | `#7f91a5` | **Secondary accent — very sparingly** |

**Plum (`--accent`) — the signature.** Roughly **one deliberate plum moment per viewport.**
Permitted uses: the single primary button, eyebrow/section labels, the current-page nav link,
arrow-link CTAs, and its reserved roles in the brand graphic (one node, the low-opacity plane,
the corner bracket). Never use plum for body text, large fills, or more than one filled button
in view.

**Slate (`--accent-2`) — quiet support.** Even more restrained than plum, and it must never
compete with it. Permitted uses: eyebrows on **navy** sections, and a single slate node in the
graphic. If plum already carries a view, slate stays out of it.

**Neutrals carry everything else.** Navy for headings/dark surfaces, graphite for body, ivory/stone
for grounds, `--line` (stone) for hairlines. Section rhythm alternates ivory → stone → navy;
don't introduce new background colors.

Contrast: body graphite on ivory and all on-navy text meet WCAG AA. Any new color pairing must be
checked against AA before use (this is verified in LAD-11).

---

## 3. Linework

The structural lines in `BrandGraphic.astro` are the backbone of the identity.

- **Thin and architectural.** Structural strokes `~1.15`; hairlines `1`. Always
  `vector-effect: non-scaling-stroke` so line weight stays constant at any render size.
- **Extend off-canvas.** Lines and arcs run past the artboard and are cropped by the frame —
  this is what makes it read as art, not a diagram.
- **Hierarchy by opacity, not weight:** primary path ~0.72, arc ~0.5, graphite path ~0.42,
  hairlines ~0.18. Keep new lines within this range.
- **Never** turn linework into arrows, connectors, a network, an org chart or a flowchart.
  No arrowheads. Lines suggest structure and convergence, they don't diagram a process.

---

## 4. Planes

- **2–3 overlapping planes maximum** per composition. The **overlap itself is the idea**
  (disciplines/teams converging); a single plane says nothing.
- Low opacity, quiet fills: stone field ~0.62; the plum plane ~0.17 with
  `mix-blend-mode: multiply` so it tints rather than sits on top.
- Planes are cropped rectangles, some slightly rotated. Keep rotations small (≤ ~8°).
- Planes never carry text or meaning content depends on — the graphic is decorative and
  `aria-hidden` (see §7).

---

## 5. Nodes

- **Few and deliberate — 2–3 per composition, not one per intersection.**
- Three sanctioned node styles: plum (filled), slate (filled), and the "ring" node
  (ground-colored fill, navy stroke). Use at most one of each.
- Nodes mark a moment of convergence; scattering them turns art into a network graph. Don't.

---

## 6. Spacing

- **Generous and open.** Vertical rhythm comes from `--section-y`
  (`clamp(4rem … 8.5rem)`) and `--section-y-tight`; don't hand-tune section padding —
  use `.section` / `.section--tight`.
- Use the spacing scale (`--space-3xs … --space-3xl`); avoid arbitrary pixel values.
- Horizontal gutters come from `--gutter` (`clamp(1.25rem … 2.75rem)`) via `.container`.
- **Control line length:** body copy caps at `--measure` (62ch); use `--measure-narrow` (46ch)
  for decks and `--measure-wide` (74ch) only when justified. Never let paragraphs run full-width.

---

## 7. Motion

- **Subtle, short, purposeful.** Durations: `--dur-fast` 140ms, `--dur` 240ms,
  `--dur-slow` 620ms. Easing: `--ease` `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Entrance reveal** (`.reveal`, +14px rise + fade, staggered 90/180/270ms) is for
  **above-the-fold content only** (currently the hero). Don't attach it to content below the
  fold — it would animate before it's seen.
- **Graphic drift**: only a couple of nodes drift, 3–4px over 9–11s, alternating. Never animate
  whole planes or lines.
- **Everything is reduced-motion safe.** All motion lives under
  `@media (prefers-reduced-motion: no-preference)`, and `scroll-behavior` reverts to `auto`
  under reduced motion. Any new animation must follow the same gate. No autoplaying,
  looping-attention, parallax or scroll-jacking effects.

---

## 8. Accessibility guardrails (that touch the visual system)

- The brand graphic is purely decorative: `aria-hidden`, `role="presentation"`,
  `focusable="false"`. It must never be the only carrier of information.
- Visible focus is a plum outline with offset (`:focus-visible`); don't remove it.
- Don't communicate meaning with color alone (plum/slate are accents, not labels).

_Fuller accessibility + performance verification is LAD-11._

---

## 9. Composition types

The brand graphic (`BrandGraphic.astro`) ships **three sanctioned variants**. Don't invent new
ones without adding a rule here first.

| Variant | Where it's used | Character |
|---|---|---|
| `hero` | Homepage hero only — one per view | The large signature composition: arc, three converging planes, structural grid, corner bracket, three nodes. |
| `motif` | Small brand moments — footer, feature card, About aside | A compact, cropped signature: one arc, one line, one plum plane, two nodes. |
| `field` | Behind **navy** sections only | Ultra-subtle white-on-navy linework; a quiet texture that never competes with content. |

Composing a new moment: pick the variant that fits the space (don't scale `hero` down into a
small slot — use `motif`), keep it `aria-hidden`, and respect the linework/plane/node rules above.

---

## 10. Do & Don't

**Do**
- Use plum for ~one deliberate moment per view (primary button, eyebrow, current nav link, or its
  reserved graphic roles).
- Keep linework thin and architectural, running off-canvas so it reads as art.
- Let the overlap of 2–3 planes carry the convergence idea.
- Use the spacing and type scales; control paragraph width with the measure tokens.
- Gate every animation behind `prefers-reduced-motion`, and keep it short and small.
- Treat the graphic as decorative: `aria-hidden`, never the sole carrier of meaning.

**Don't**
- Don't use plum for body text, large fills, or a second filled button in the same view.
- Don't let slate compete with plum — it's a quiet, occasional accent only.
- Don't add arrowheads or wire nodes together — never a flowchart, network or org chart.
- Don't scatter nodes (one per intersection) or stack more than ~3 planes.
- Don't introduce new background colors outside ivory / stone / navy.
- Don't add parallax, autoplay, looping-attention or scroll-jacking motion.
