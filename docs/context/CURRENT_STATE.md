# Current State

Snapshot date: **2026-08-23**
Branch: **main**

Preserved baseline: **`v0.3.0-balance-checkpoint`**

Current reviewed release: **v0.9.0 interactive defense presentation**, preserving the accepted v0.4.0 balance, v0.4.1 architecture, and v0.7.0 interface

## Repository and validation

- Current project: `/Users/joe/projects/geeklabs-td`
- Forgejo is the authoritative remote; GitHub is a secondary mirror.
- Forgejo is authoritative and GitHub mirrors the reviewed main revision.
- `npm test` passes with **71/71 tests**.
- `npm run build` passes with Vite 7.3.6.
- `npm audit` reports zero known vulnerabilities.
- `git diff --check` passes.
- The v0.9.0 release candidate is built from independently tested art and integration slices.

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

## Controlled v0.4.0 result

The two Hard runs used seed `specialists-v0.4.0` with no balance changes between runs.

- Basic-heavy failed on Wave 46 with 2,758 kills and score 45,091. Its first leak was Wave 40.
- Mixed-specialist failed on Wave 54 with 3,682 kills and score 60,273. Its first leak was Wave 48.
- Correct specialist use added eight waves, 924 kills, and 15,182 score. At the shared Wave 45 checkpoint it retained all 20 lives with $8,895 invested, while Basic-heavy had 9 lives with $8,975 invested.
- Through Wave 45, Rapid dealt 492,150 damage and earned 1,216 kills; Sniper dealt 383,651.5 damage and earned 787 kills; Laser dealt 154,774.9 damage and earned 214 kills.

## Current assessment

The five-wave preparation windows and preferred targeting established a meaningful specialist advantage without nerfing Basic or reducing income. Rapid produced the most specialist damage and kills, resolving its prior lack of value. The v0.4.0 balance is accepted; no further tower-stat correction is currently justified.

## Architecture state

- GameScene is the Phaser lifecycle/orchestration boundary.
- Run, wave, tower, enemy, combat, projectile, world presentation, input, HUD, DOM overlays, leaderboard, preferences, query options, and telemetry publication have explicit owners.
- Runtime modules no longer depend on scene-bound `.call(this)` dispatch.
- Final partial-wave telemetry is persisted at game over.
- The staged refactor contains no balance changes.

## Touch interaction state

- Touch and hybrid devices receive a responsive control surface while desktop controls remain unchanged.
- Tower cards enter placement; dragging over the playfield aims a ghost offset above the finger, with an adaptive bottom-edge offset that keeps every grid row reachable.
- A successful build exits placement mode and returns to normal tower selection.
- Selected towers expose compact damage, range, rate, and DPS stats alongside Target, Upgrade, and Sell actions.
- Touch selling requires two taps and disarms automatically.
- Start Wave, Add Wave, Pause/Resume, Cancel, landscape-only iOS layout, safe areas, and viewport-level overlays are implemented.
- The canvas alone suppresses browser gestures; surrounding controls retain normal touch behavior.

## iOS proof-of-concept state

- The Capacitor 8 shell builds, signs, installs, and launches on an iPhone 17 Pro Max.
- The v0.9.0 build is installed on both the iPhone 17 Pro Max and a 12.9-inch iPad Pro; automated launch passed on the iPad, while iPhone launch was correctly blocked because the device was locked.
- Safe areas, landscape-left/right orientation, edge-row touch placement, contextual stats/actions, and lifecycle pause behavior pass Simulator validation.
- A physical-device Easy run reached Wave 54 with 37 towers and 40 active enemies without a reported touch or frame-pacing blocker.
- Audio now unlocks from DOM or canvas gestures, uses clearer levels, respects Silent Mode, and has a persistent Sound On/Off control.
- Native Preferences mirrors managed browser settings. A measured thermal/battery run and final force-quit restoration audit remain release-candidate checks rather than proof-of-concept blockers.

## Presentation polish state

- The HUD uses a compact, higher-contrast hierarchy with grouped values and readable large-number formatting.
- Tower cards communicate locked, affordable, unaffordable, selected, and newly unlocked states.
- Touch controls retain 48px landscape targets and now expose clearer ready, placement, context, pause, upgrade, and pressed states.
- Short-landscape pause actions fit without scrolling, and the large-touch layout uses more of the iPad width without overflowing vertically.
- Placement and upgrades receive restrained visual pulses; unlocks coordinate animation, toast, and sound.
- Kill audio uses the existing rate limiter, while light-enemy health bars stay hidden until meaningful damage reduces dense-wave clutter.
- Desktop, iPhone, and iPad now share a compact command-HUD visual language with clear credits, integrity, wave, tower, and status hierarchy.
- Tower cards expose role and unlock context; placement reports validity and cost directly in the command deck.
- Start, pause, help, and game-over overlays use one responsive protocol-panel system.
- Touch tower selection receives forgiving hit detection plus visible world and action-panel confirmation.
- Restrained transitions include a reduced-motion fallback.

## Art vertical-slice state

- The approved direction combines welded industrial machinery with restrained military science-fiction energy accents.
- The playfield uses a low-contrast steel-panel texture beneath plated route edges, conduits, joints, and hazard cues.
- Runner uses transparent bitmap artwork, follows route rotation, retains a compact footprint, and falls back to the generated geometric texture if the asset is unavailable.
- Basic T1–T3 use distinct transparent silhouettes and retain their accepted gameplay stats.
- Basic placement uses the deployed T1 footprint plus a precise center reticle.
- Basic towers use a stationary industrial base and tier-specific rotating weapon head; muzzle flashes and projectiles originate at the barrel tip.
- A defended command core sits beyond the final path node and communicates healthy, damaged, critical, leak-impact, and game-over states without changing gameplay balance.
- Basic muzzle, projectile, impact, hit-flash, and Runner destruction feedback use short-lived, lightweight effects; extra muzzle and destruction flourishes yield automatically above 72 active enemies.
- Rapid, Sniper, Laser, Sprinter, Brute, and Armored intentionally retain their procedural silhouettes until their own art slices are validated.
- The production art reference and rules are recorded in `docs/art/ART_DIRECTION.md`.

## Next step

1. Confirm v0.9.0 readability and thermal behavior in a late-wave session on both the installed iPhone and iPad.
2. Extend the validated style to Rapid/Sprinter, Sniper/Brute, and Laser/Armored as paired visual slices.
3. Leave accepted balance values unchanged until new evidence identifies a specific problem.

## Source-of-truth workflow

Git is authoritative. Push Forgejo first and then mirror the same commit and tags to GitHub. ZIP exports are optional transport artifacts created only when repository access is unavailable; see `PORTABLE_EXPORT.md`.
