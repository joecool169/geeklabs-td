# Defense Protocol Art Direction

Reference sheet: `industrial-scifi-reference-v1.png`

## Core idea

Defense Protocol is an industrial defense network upgraded with restrained military science-fiction technology. Dark, practical machinery establishes the world; controlled emissive light communicates gameplay.

## Visual rules

- Use welded steel, gunmetal, bolts, vents, conduits, heat wear, and small hazard markings for physical construction.
- Reserve cyan for friendly targeting and Basic-tower energy, signal red for hostile units, green for Rapid, amber for Sniper, and magenta for Laser.
- Keep at least 70% of every unit dark and neutral so class colors read as signals rather than decoration.
- Favor one strong silhouette and two or three large material shapes over dense surface detail.
- Use a consistent top-down three-quarter camera with lighting from the upper left.
- Keep floor and path values darker and less saturated than towers, enemies, projectiles, health indicators, and selection feedback.

## Runtime asset standard

- Author unit masters at 256×256 pixels or larger on transparent backgrounds.
- Tower families use a stationary base plus a tier-specific orthographic rotating head. The mechanical mount—not the bitmap bounds—is the rotation origin.
- Normalize each tower's visible base and main turret body to the 40px placement grid. Barrels may overhang modestly, but adjacent towers must remain visually separable.
- Runtime tower bases use 64px transparent canvases; rotating heads use 128px or 144px canvases with the mount at the declared origin.
- Runtime enemy textures use tight transparent canvases matching each class silhouette and display at the fixed per-class footprint declared in `src/presentation/artStandards.js`.
- Keep important silhouette features inside a central 80% safe area so scaling and glow do not clip.
- Use premultiplied-looking soft edges without opaque matte halos.
- First pass uses static unit sprites plus inexpensive Phaser transforms and particles; no frame animation is required.
- Retain the existing generated geometric textures as automatic fallbacks when a bitmap is unavailable.

## Readability gates

- Runner and Basic must remain identifiable at their current 24px and 34px footprints.
- Hostile direction of travel must read without relying only on rotation or color.
- Tier changes must alter the Basic tower silhouette, not merely its tint.
- Effects must disappear quickly and never hide health bars, targets, or the route.
- Up to 36 active enemies, all restrained combat feedback may render. From 37–60, high-frequency Rapid/Laser impacts yield while Basic/Sniper cues remain. Above 60, optional transient flourishes yield automatically and health bars are limited to meaningfully damaged units; at 80 active enemies, units must remain separable and frame pacing must remain comparable to the procedural baseline.

## First vertical slice

The first production graphics pass covers the industrial playfield; Runner, Sprinter, Brute, and Armored enemies; layered three-tier Basic, Rapid, Sniper, and Laser towers; the deployment gate and command core; aligned firing feedback; restrained movement/damage states; and density-aware late-wave effects. Procedural fallbacks remain available for every runtime class.

## Generated reference prompt

Built-in image generation was used for the reference sheet with the `stylized-concept` use case. It requested a landscape specimen board containing a cyan sentry, red reconnaissance drone, dark steel floor/path materials, and compact combat effects in a readable orthographic top-down three-quarter style, with no text, logos, people, or environment clutter.
