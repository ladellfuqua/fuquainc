# FUQUA INC. — Visual System Rules

_Status: **updated 9 August 2026** for the approved homepage revision (Linear LAD-32).
This is the practical ruleset that governs how the brand's type, color, linework, planes,
spacing and motion are used. The established palette, typography and graphic foundation
remain intact; this revision amends homepage composition and motion._

_Companion: an illustrated, example-driven reference (principles, composition types,
do/don't gallery) is tracked separately as **LAD-5** and will build on these rules._

Golden rule: **restraint.** When in doubt, use less — less color, less motion, less weight,
more space. The system should read as a contemporary editorial / gallery identity, never as
a dashboard, flowchart or marketing template.

> **Illustrated companion:** a live, viewable reference (swatches, type samples, the graphic
> variants, anatomy, do/don't) is rendered publicly at **`/visual-system`**
> (`src/pages/visual-system.astro`). It is crawlable and included in the sitemap. Use it to
> *see* the system; use this file for the authoritative rules.

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

## 1. Homepage composition — approved 9 August 2026

The homepage is informational and editorial, not a conversion surface. Its section grounds
form a deliberate sequence:

**Midnight Navy hero → Warm Ivory About → Soft Stone Writing → Midnight Navy How I think →
Warm Ivory Stay in touch → Midnight Navy footer.**

The hero uses a non-representational lit backdrop rather than the `BrandGraphic` hero variant:
deep navy at the type side, a soft slate/stone key light behind the transparent portrait, and
a trace of plum. It contains one quiet **About Ladell →** text link and no filled CTA. On desktop,
the headline is set on four fixed lines and the hero may pin and gently recede as the page covers
it. Below the desktop breakpoint, text wraps naturally and the sticky/recede behavior is off.

The dark mid-page **How I think** section is typographic. The `field` graphic may sit behind it at
very low opacity, but no icons, illustrations or detached cards are introduced.

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
Permitted uses: eyebrow/section labels, the current-page nav link, quiet arrow-link CTAs,
hairline emphasis, and its reserved roles in the brand graphic (one node, the low-opacity plane,
the corner bracket). Never use plum for body text or large fills.

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

## 7. Motion — amended 9 August 2026

Motion remains subtle and purposeful. Durations use `--dur-fast` 140ms, `--dur` 240ms and
`--dur-slow` 620ms with `--ease` `cubic-bezier(0.22, 1, 0.36, 1)` unless an approved ambient
effect specifically calls for a slower cycle.

**Permitted motion**

- Scroll-triggered fade-and-rise reveals with restrained staggering.
- Word-by-word reveal for the homepage bio paragraph.
- Line-mask reveals for the hero headline and pull quote.
- Gentle parallax on section content (3–4% factors) and decorative elements.
- A sticky hero with a subtle scale, lift and fade recede effect — **desktop only**.
- Slow ambient hero-background drift and a periodic, low-contrast light sweep.

**Engineering contract**

- Every effect is gated by `prefers-reduced-motion: no-preference`.
- Content defaults to its final, visible state. JavaScript may apply a hidden preparation state
  only after motion preference and required APIs (including `IntersectionObserver`) are confirmed.
- If JavaScript is disabled, fails, or lacks `IntersectionObserver`, all content remains visible.
- Under `prefers-reduced-motion: reduce`, parallax, sticky recede, reveals, drift and sweep are off,
  and smooth scrolling reverts to `auto`.
- Sticky/recede behavior is disabled below the desktop breakpoint and on short viewports where it
  could clip content.

Still prohibited: scroll-jacking, autoplay with sound, looping attention-seeking motion and
parallax strong enough to cause discomfort.

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
| `hero` | Approved large-format supporting compositions | The large signature composition: arc, three converging planes, structural grid, corner bracket, three nodes. The redesigned homepage hero uses the lit-backdrop treatment instead. |
| `motif` | Small brand moments — footer, feature card, About aside | A compact, cropped signature: one arc, one line, one plum plane, two nodes. |
| `field` | Behind **navy** sections only | Ultra-subtle white-on-navy linework; a quiet texture that never competes with content. |

Composing a new moment: pick the variant that fits the space (don't scale `hero` down into a
small slot — use `motif`), keep it `aria-hidden`, and respect the linework/plane/node rules above.

---

## 10. Do & Don't

**Do**
- Use plum for ~one deliberate moment per view (eyebrow, quiet link, hairline emphasis, current
  nav link, or its reserved graphic roles).
- Keep linework thin and architectural, running off-canvas so it reads as art.
- Let the overlap of 2–3 planes carry the convergence idea.
- Use the spacing and type scales; control paragraph width with the measure tokens.
- Gate every animation behind `prefers-reduced-motion` and the motion-ready JS guard.
- Keep content visible by default; prepare hidden reveal states only after required APIs are confirmed.
- Treat the graphic as decorative: `aria-hidden`, never the sole carrier of meaning.

**Don't**
- Don't use plum for body text, large fills, or a second filled button in the same view.
- Don't let slate compete with plum — it's a quiet, occasional accent only.
- Don't add arrowheads or wire nodes together — never a flowchart, network or org chart.
- Don't scatter nodes (one per intersection) or stack more than ~3 planes.
- Don't introduce new background colors outside ivory / stone / navy.
- Don't add scroll-jacking, autoplay with sound, looping-attention motion or strong parallax.
