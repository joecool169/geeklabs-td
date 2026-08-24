# Art Asset Provenance

The v0.8.0 vertical slice uses OpenAI's built-in image generation in `stylized-concept` mode. Final assets were selected, trimmed, resized, and visually checked in the game at desktop, iPhone, and iPad layouts. Rejected iterations are not included in the project.

## Prompt set

- `industrial-scifi-reference-v1.png`: an orthographic top-down three-quarter specimen board combining welded gunmetal machinery, cyan sentry energy, a compact red reconnaissance drone, plated route materials, and restrained combat effects; no text, logos, people, or environment clutter.
- `playfield-floor-v1.png`: a seamless square top-down dark gunmetal floor with subtle plate seams, bolts, wear, and restrained blue-gray variation; low contrast and free of large focal features.
- `runner-v1.png`: a transparent-background compact red military science-fiction recon drone, viewed from above at a slight three-quarter angle, with a strong forward silhouette and minimal cyan detail.
- `basic-t1-v1.png`: a transparent-background compact cyan sentry with a clear barrel direction, industrial base, and simple tier-one silhouette.
- `basic-t2-v1.png`: the same sentry evolved into a broader, reinforced tier-two form while preserving its camera, facing, palette, and identity.
- `basic-t3-v1.png`: the same sentry evolved into its strongest tier-three form with heavier armor and a brighter cyan energy ring, while retaining the shared family silhouette.

## Shipped paths

- Reference: `docs/art/industrial-scifi-reference-v1.png`
- Playfield: `public/art/playfield-floor-v1.png`
- Runner: `public/art/units/runner-v1.png`
- Basic tower tiers: `public/art/towers/basic-t1-v1.png`, `basic-t2-v1.png`, and `basic-t3-v1.png`

Every runtime bitmap has a procedural fallback so a missing image cannot prevent play.
