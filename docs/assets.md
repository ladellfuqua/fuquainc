# Production assets

## Homepage portrait

- **Production file:** `src/assets/ladell-home-portrait.png`
- **Delivered source:** `headshot_cut.png`
- **Source dimensions:** 560 × 728 pixels
- **Source format:** transparent PNG
- **Alt text:** `Ladell Fuqua`
- **Copyright owner:** Ladell Fuqua
- **Usage rights:** Ladell Fuqua owns the source photography and approved its use on
  fuquainc.com on 9 August 2026. That approval includes responsive resizing and
  conversion to production web formats.

The approved source is a background-removed, retouched, and color-graded cut-out
from the existing studio headshot. The production filename differs from the
delivered filename so its purpose remains clear in the site source.

Astro generates the responsive AVIF and WebP sources and PNG fallback during the
build. The homepage uses widths of 280, 320, 400, and 560 pixels. The rendered
image has explicit 560 × 728 intrinsic dimensions, and only this above-the-fold
hero asset is preloaded.

Do not replace the production asset with the base64-embedded image from a design
prototype. Any future replacement must preserve transparency, the approved color
treatment, the same alt text, and the documented ownership or license information.
