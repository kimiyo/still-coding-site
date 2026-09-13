# Still Coding brand image assets

Generated on 2026-09-13 with the built-in ImageGen workflow for the `Living Geometry` visual system.

## Production assets

| File | Size | Intended use |
|---|---:|---|
| `living-geometry-hero-desktop.webp` | 1600 × 900 | Desktop hero fallback and reduced-motion background |
| `living-geometry-hero-mobile.webp` | 900 × 1600 | Mobile hero fallback and reduced-motion background |
| `living-geometry-og-background.webp` | 1200 × 630 | Background for deterministic Open Graph title overlay |

The `.png` siblings are lossless masters. Use the `.webp` derivatives in the website.

## Art direction

- Near-black charcoal ground
- Warm ivory technical lines
- Cyan, muted vermilion, and amber-gold accents
- Fine nodes, arcs, partial polygons, and unfinished dashed forms
- Subtle paper grain inherited from the earlier portfolio
- Quiet negative space reserved for real HTML or deterministic image text

## Generation prompt summary

1. Desktop hero: a wide, premium editorial living-geometry system, weighted to the right with a calm left text area.
2. Mobile hero: a vertical connected-node composition, with a calm upper text area and geometry expanding downward.
3. OG background: four related geometric systems representing play, observation, learning, and music, with center-left space for later title rendering.

All prompts explicitly excluded text, logos, people, devices, screenshots, watermarks, purple gradients, glassmorphism, and excessive cyberpunk effects.

## Usage notes

- The hero assets are static fallbacks, not a replacement for the runtime Canvas background.
- Never place essential information inside these images.
- Add the site name and description as HTML in the hero.
- Add Open Graph text with a deterministic build step so typography remains accurate.
- App-card thumbnails should be real captures of the deployed products and belong in `public/images/apps/`.
