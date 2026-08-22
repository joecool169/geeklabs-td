# GeekLabs-TD AI Context

Snapshot date: **2026-08-22**

## Project identity

GeekLabs-TD is a Phaser/Vite tower-defense project whose playable title is **Defense Protocol**. The intended game is endless, mechanics-first, readable, and progressively strategic. The web version remains the primary implementation and future mobile work should wrap the same core rather than rewrite it.

## Current baseline

The repository contains the committed coordinated balance pass. Basic remains unchanged; specialist roles, reward smoothing, class-age HP scaling, unlock preparation windows, and wave-cadence smoothing are implemented.

Forgejo is the authoritative remote. GitHub is maintained as a secondary mirror. Git is the sole source of truth; optional ZIP exports are disposable transport artifacts.

Validation on this baseline:

- `npm test`: 31/31 tests pass
- `npm run build`: passes with Vite 7.3.6
- `npm audit`: zero known vulnerabilities
- `git diff --check`: passes

The public site responds successfully but its JavaScript bundle predates the coordinated balance commits. The current checkpoint is intentionally not being deployed until controlled comparison runs lead to a reviewed balance revision.

Seeded per-wave composition and automatic balance checkpoints are implemented for the controlled Hard-mode comparisons. Use the same `seed` and distinct `run` query parameters as documented in `docs/context/BALANCE_TESTING.md`.

## Current progression

- Basic: Wave 1
- Rapid: Wave 10
- Sniper: Wave 20
- Brute: Wave 22
- Laser: Wave 28
- Armored: Wave 30

## Current tower roles

- Basic: flexible general-purpose tower; stats unchanged
- Rapid: `1.25×` Runner damage, doubled armor effect, short-range swarm specialist
- Sniper: `1.60×` Brute damage, Strong targeting, long-range anti-Brute specialist
- Laser: 3 armor penetration, line pierce, target-lock ramp, three tiers, anti-Armored specialist

Shared damage logic applies matchup multipliers, armor multipliers, and armor penetration.

## Current enemy/economy model

- Class-specific HP growth begins from each enemy class's unlock wave.
- Brute growth is 8%; Armored growth is 10%; Runner remains 8.5%.
- Global 3% endurance compounding remains active after Wave 12.
- Rewards preserve fractional value through deterministic per-class carry while paying integer currency.
- Runner packs retain 60 ms internal spacing.
- Cadence compensation targets about 330 ms average spacing through Wave 30 and ramps toward 260 ms by Wave 40.

## Latest playtest and unresolved balance state

Earlier strong Hard runs failed around Waves 24-25. Reward smoothing improved progression to Wave 30. The coordinated pass then reached Wave 35 with 16 lives, $2,250 remaining, 20 towers, 1,636 kills, and score 27,553.

This likely means the combined pass overshot. The tower-role structure is improved, but Hard is presently too forgiving or provides too much purchasing power/time.

Do not immediately alter another single stat. Preserve the checkpoint and first compare:

- mixed specialist run
- Basic-heavy control run

Record Waves 20/25/30/35/40 and isolate whether excess strength comes mostly from economy, specialist upgrades/matchups, reduced Brute growth, or longer wave duration. Make one coordinated correction only after that analysis.

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
