# Current State

Snapshot date: **2026-08-22**
Branch: **main**

Preserved baseline: **`v0.3.0-balance-checkpoint`**

Current candidate: **v0.4.0 specialist progression**

## Repository and validation

- Current project: `/Users/joe/projects/geeklabs-td`
- Forgejo is the authoritative remote; GitHub is a secondary mirror.
- Forgejo and GitHub matched before the v0.4.0 specialist-progression work began.
- `npm test` passes with **36/36 tests**.
- `npm run build` passes with Vite 7.3.6.
- `npm audit` reports zero known vulnerabilities.
- `git diff --check` passes.
- The public site responds successfully, but its JavaScript bundle predates the final July 27 balance commits. Production is therefore not the current gameplay baseline.

## Current gameplay baseline

Defense Protocol remains an endless Phaser/Vite tower-defense game with Easy, Medium, and Hard modes, concurrent wave support, local and optional global leaderboards, persistent settings, contextual tower controls, and responsive desktop/laptop presentation.

### Progression milestones

- Basic tower: Wave 1
- Rapid tower: Wave 10
- Sprinter enemy: Wave 15
- Sniper tower: Wave 20
- Brute enemy: Wave 25
- Laser tower: Wave 30
- Armored enemy: Wave 35

Each specialist now has a five-wave preparation window before its intended threat appears.

## Coordinated balance model

Basic tower statistics remain unchanged.

- **Rapid** receives `1.25×` damage against Runners, `1.50×` against Sprinters, and defaults to Sprinter Priority.
- **Sniper** receives `1.60×` damage against Brutes and defaults to Brute Priority.
- **Laser** penetrates 3 armor, retains line pierce and target-lock ramping, and now has three upgrade tiers.
- **Laser** defaults to Armored Priority.
- Preferred modes fall back to First and remain manually cycleable alongside the generic targeting modes.
- Shared damage calculation applies matchup multipliers, armor multipliers, and armor penetration consistently.
- Specialist upgrades were raised to make intended-match investment competitive with Tier-1 spam.

Enemy class HP scaling begins at each class's unlock wave rather than inheriting earlier class-age growth.

- Runner class growth: 8.5% per class-age wave
- Sprinter class growth: 7.5%
- Brute class growth: 8%
- Armored class growth: 10%
- Global endurance growth remains 3% per wave after Wave 12

Enemy rewards use deterministic fractional carry per enemy class. Currency payouts remain integers, but fractional reward value is preserved across kills and reset for each new game.

Wave cadence compensates for compressed 60 ms Runner packs. Average cadence remains near 330 ms through Wave 30, then ramps toward 260 ms by Wave 40. This smoothed modeled required-DPS growth to about 7% per wave for Waves 20-30 and 8% for Waves 31-40.

## Controlled baseline result

A seeded Hard Basic-only run reached Wave 45 with 2,649 kills and score 45,146. A Basic/Sniper-heavy comparison reached Wave 46 with 2,712 kills and score 46,231. Both cleared Wave 35 without leaks; the Basic-only run first leaked on Wave 39.

## Current assessment

Specialists produced only a one-wave practical advantage, and Rapid was not attractive enough to use. Because the goal is longer endurance play, the current work clarifies specialist value instead of reducing income: Sprinter becomes Rapid's explicit threat, each specialist gets a five-wave preparation window, and preferred targeting makes counters automatic without removing manual control.

## Next step

Preserve this build as the baseline and perform controlled comparison runs:

Follow `BALANCE_TESTING.md` against the new progression:

1. Run a mixed-specialist build versus a Basic-heavy control using the same seed.
2. Review checkpoints from Waves 10 through 50, including damage, kills, and investment by tower type.
3. Verify that Rapid visibly answers Sprinters and that specialists create a meaningful endurance advantage.
4. Change Rapid range or projectile behavior only if preferred targeting and the new threat still fail to establish its value.
5. Deploy only after reviewing the comparison.

## Source-of-truth workflow

Git is authoritative. Push Forgejo first and then mirror the same commit and tags to GitHub. ZIP exports are optional transport artifacts created only when repository access is unavailable; see `PORTABLE_EXPORT.md`.
