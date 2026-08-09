# Production assets

## Homepage portrait

- **Production files:** `public/images/hero/portrait-{560,760,1120}.{webp,png}`
- **Delivered source:** `fuqua-hero-assets.zip`
- **Largest dimensions:** 1120 × 1456 pixels
- **Formats:** transparent WebP with transparent PNG fallback
- **Alt text:** `Ladell Fuqua`

The approved source is a generated, background-removed cut-out delivered for
production use. It is not licensed third-party photography and requires no
separate rights record.

The homepage uses the supplied 560, 760, and 1120 pixel widths. The rendered
image has explicit 560 × 728 intrinsic dimensions, and its responsive WebP source
is preloaded with a PNG fallback.

Do not replace the production asset with the base64-embedded image from a design
prototype. Any future replacement must preserve transparency, the approved color
treatment, the same alt text, and the documented ownership or license information.

## Homepage backdrop

- **Production files:** `public/images/hero/hero-backdrop-{1000,1600,2400}.{webp,jpg}`
- **Delivered source:** `fuqua-hero-assets.zip`
- **Largest dimensions:** 2400 × 1400 pixels
- **Formats:** WebP with JPEG fallback

The backdrop is the blurred city-through-window image approved in the homepage
prototype. It was extracted from the prototype's embedded data URL and converted
to standalone production files; the base64 data is not shipped. It is a generated
asset delivered for production use, not licensed photography.

The image sits beneath the hero's navy scrim and is intentionally treated as
light and atmosphere rather than a crisp photograph. The browser selects from
the 1000, 1600, and 2400 pixel widths, and the responsive WebP source is preloaded.
