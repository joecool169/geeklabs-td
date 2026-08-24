# Art Asset Provenance

The v0.8.0–v0.10.0 production graphics use OpenAI's built-in image generation. Final assets were selected, background-extracted where necessary, trimmed, resized, centered on explicit pivots, and visually checked in the game at desktop, iPhone, and iPad layouts. Rejected iterations are not included in the project.

## Prompt set

- `industrial-scifi-reference-v1.png`: an orthographic top-down three-quarter specimen board combining welded gunmetal machinery, cyan sentry energy, a compact red reconnaissance drone, plated route materials, and restrained combat effects; no text, logos, people, or environment clutter.
- `playfield-floor-v1.png`: a seamless square top-down dark gunmetal floor with subtle plate seams, bolts, wear, and restrained blue-gray variation; low contrast and free of large focal features.
- `runner-v1.png`: a transparent-background compact red military science-fiction recon drone, viewed from above at a slight three-quarter angle, with a strong forward silhouette and minimal cyan detail.
- `basic-t1-v1.png`: a transparent-background compact cyan sentry with a clear barrel direction, industrial base, and simple tier-one silhouette.
- `basic-t2-v1.png`: the same sentry evolved into a broader, reinforced tier-two form while preserving its camera, facing, palette, and identity.
- `basic-t3-v1.png`: the same sentry evolved into its strongest tier-three form with heavier armor and a brighter cyan energy ring, while retaining the shared family silhouette.
- `command-core-v1.png`: a transparent compact fortified endpoint bunker with welded gunmetal armor, a central cyan energy core, antennas, conduits, and small amber warning details; non-directional and readable at mobile scale.
- `basic-base-v1.png` and `basic-head-t1/t2/t3-v1.png`: a component sheet derived from the established Basic tower references, containing one stationary three-quarter industrial base and three isolated strict top-down weapon heads pointing right at zero rotation; a second background-extraction pass produced genuine transparency without changing the components.
- `rapid-base-v1.png`, `rapid-head-t1/t2/t3-v1.png`, and `sprinter-v1.png`: a component sheet anchored to the approved references, using a green compact high-cadence weapon family and a lean signal-red interceptor pointing right; extracted into centered transparent runtime assets.
- `sniper-base-v1.png`, `sniper-head-t1/t2/t3-v1.png`, and `brute-v1.png`: an amber reinforced rail-cannon family with progressively longer, heavier barrels and a broad red heavy-assault drone; extracted into centered transparent runtime assets.
- `laser-base-v1.png`, `laser-head-t1/t2/t3-v1.png`, and `armored-v1.png`: a magenta focusing-emitter family progressing to a prismatic three-arm head, paired with a plated red/blue-gray siege drone with cyan weak-point lights; extracted into centered transparent runtime assets.
- `deployment-gate-v1.png`: a low, broad route-entry threshold with gunmetal pylons, a red warning field, and a restrained cyan status lamp, generated as a genuine transparent-alpha sprite.

## Shipped paths

- Reference: `docs/art/industrial-scifi-reference-v1.png`
- Playfield: `public/art/playfield-floor-v1.png`
- Runner: `public/art/units/runner-v1.png`
- Basic tower tiers: `public/art/towers/basic-t1-v1.png`, `basic-t2-v1.png`, and `basic-t3-v1.png`
- Basic tower components: `public/art/towers/basic-base-v1.png` and `public/art/towers/basic-head-t1-v1.png` through `basic-head-t3-v1.png`
- Command core: `public/art/structures/command-core-v1.png`
- Rapid components: `public/art/towers/rapid-base-v1.png` and `rapid-head-t1-v1.png` through `rapid-head-t3-v1.png`
- Sniper components: `public/art/towers/sniper-base-v1.png` and `sniper-head-t1-v1.png` through `sniper-head-t3-v1.png`
- Laser components: `public/art/towers/laser-base-v1.png` and `laser-head-t1-v1.png` through `laser-head-t3-v1.png`
- Specialist enemies: `public/art/units/sprinter-v1.png`, `brute-v1.png`, and `armored-v1.png`
- Deployment gate: `public/art/structures/deployment-gate-v1.png`

Every runtime bitmap has a procedural fallback so a missing image cannot prevent play.
