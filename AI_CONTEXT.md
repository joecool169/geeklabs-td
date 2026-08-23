# GeekLabs-TD AI Context

Snapshot date: **2026-08-22**

## Project identity

GeekLabs-TD is a Phaser/Vite tower-defense project whose playable title is **Defense Protocol**. The intended game is endless, mechanics-first, readable, and progressively strategic. The web version remains the primary implementation and future mobile work should wrap the same core rather than rewrite it.

## Current baseline

The repository contains the committed coordinated balance pass. Basic remains unchanged; specialist roles, reward smoothing, class-age HP scaling, unlock preparation windows, and wave-cadence smoothing are implemented.

Forgejo is the authoritative remote. GitHub is maintained as a secondary mirror. Git is the sole source of truth; optional ZIP exports are disposable transport artifacts.

Validation on this baseline:

- `npm test`: 36/36 tests pass
- `npm run build`: passes with Vite 7.3.6
- `npm audit`: zero known vulnerabilities
- `git diff --check`: passes

The public site responds successfully but its JavaScript bundle predates the coordinated balance commits. The current checkpoint is intentionally not being deployed until controlled comparison runs lead to a reviewed balance revision.

Seeded per-wave composition and automatic balance checkpoints are implemented for the controlled Hard-mode comparisons. Use the same `seed` and distinct `run` query parameters as documented in `docs/context/BALANCE_TESTING.md`.

## Current progression

- Basic: Wave 1
- Rapid: Wave 10
- Sprinter: Wave 15
- Sniper: Wave 20
- Brute: Wave 25
- Laser: Wave 30
- Armored: Wave 35

## Current tower roles

- Basic: flexible general-purpose tower; stats unchanged
- Rapid: `1.25×` Runner and `1.50×` Sprinter damage; defaults to Sprinter Priority
- Sniper: `1.60×` Brute damage; defaults to Brute Priority
- Laser: 3 armor penetration, line pierce, target-lock ramp, three tiers; defaults to Armored Priority

Preferred targeting attacks the intended class furthest along the path, falls back to First when that class is absent, and remains part of each tower's manually cycled targeting modes.

Shared damage logic applies matchup multipliers, armor multipliers, and armor penetration.

## Current enemy/economy model

- Class-specific HP growth begins from each enemy class's unlock wave.
- Runner growth is 8.5%; Sprinter growth is 7.5%; Brute growth is 8%; Armored growth is 10%.
- Global 3% endurance compounding remains active after Wave 12.
- Rewards preserve fractional value through deterministic per-class carry while paying integer currency.
- Runner packs retain 60 ms internal spacing.
- Cadence compensation targets about 330 ms average spacing through Wave 30 and ramps toward 260 ms by Wave 40.

## Latest playtest and current balance state

A seeded Hard Basic-only run reached Wave 45. A Basic/Sniper-heavy specialist run reached Wave 46. Both were perfect through Wave 35, and specialist investment yielded only a marginal survival advantage. The product goal is to support runs beyond these waves, so economy was preserved and specialist progression was clarified instead of tightening Hard mode.

The current 10/15/20/25/30/35 progression and preferred targeting pass is implemented but not yet playtested. Compare a new Basic-only control with a true mixed-specialist run. Telemetry now records checkpoints through Wave 50 plus damage, kills, and invested capital by tower type.

## Operating rules

- Inspect current source before making project-specific claims.
- Distinguish implemented, tested, deployed, planned, and unresolved work.
- Keep source changes coherent and independently testable.
- Do not nerf Basic merely to force specialists.
- Avoid mixing structural refactors with balance changes.
- Treat Forgejo as authoritative and GitHub as a secondary mirror.
- Treat optional ZIP exports as transport only, never as project authority.

## Repository workflow

Work from the checked-out repository, verify changes, commit coherent revisions, push Forgejo first, and then mirror to GitHub. See `docs/context/WORKFLOW.md`. If repository access is unavailable, `docs/context/PORTABLE_EXPORT.md` describes an optional export from a committed revision.
