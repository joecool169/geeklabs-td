# Current State

Snapshot date: **2026-08-22**
Branch: **main**  
Baseline: **committed coordinated balance checkpoint at `ec50844`**

## Repository and validation

- Current project: `/Users/joe/projects/geeklabs-td`
- Forgejo is the authoritative remote; GitHub is a secondary mirror.
- Before this context refresh, `main`, `forgejo/main`, and `origin/main` matched `ec50844`, with a clean working tree.
- `npm test` passes with **27/27 tests**.
- `npm run build` passes with Vite 7.3.6.
- `npm audit` reports zero known vulnerabilities.
- `git diff --check` passes.
- The public site responds successfully, but its JavaScript bundle predates the final July 27 balance commits. Production is therefore not the current gameplay baseline.

## Current gameplay baseline

Defense Protocol remains an endless Phaser/Vite tower-defense game with Easy, Medium, and Hard modes, concurrent wave support, local and optional global leaderboards, persistent settings, contextual tower controls, and responsive desktop/laptop presentation.

### Progression milestones

- Basic tower: Wave 1
- Rapid tower: Wave 10
- Sniper tower: Wave 20
- Brute enemy: Wave 22
- Laser tower: Wave 28
- Armored enemy: Wave 30

This sequencing gives the player a preparation window before Brutes and Armored enemies appear.

## Coordinated balance model

Basic tower statistics remain unchanged.

- **Rapid** receives `1.25×` damage against Runners and counts armor twice, establishing a swarm-clearing role with poor armored performance.
- **Sniper** receives `1.60×` damage against Brutes and retains Strong targeting, establishing a long-range anti-Brute role.
- **Laser** penetrates 3 armor, retains line pierce and target-lock ramping, and now has three upgrade tiers.
- Shared damage calculation applies matchup multipliers, armor multipliers, and armor penetration consistently.
- Specialist upgrades were raised to make intended-match investment competitive with Tier-1 spam.

Enemy class HP scaling begins at each class's unlock wave rather than inheriting earlier class-age growth.

- Runner class growth: 8.5% per class-age wave
- Brute class growth: 8%
- Armored class growth: 10%
- Global endurance growth remains 3% per wave after Wave 12

Enemy rewards use deterministic fractional carry per enemy class. Currency payouts remain integers, but fractional reward value is preserved across kills and reset for each new game.

Wave cadence compensates for compressed 60 ms Runner packs. Average cadence remains near 330 ms through Wave 30, then ramps toward 260 ms by Wave 40. This smoothed modeled required-DPS growth to about 7% per wave for Waves 20-30 and 8% for Waves 31-40.

## Final playtest result

The coordinated patch materially overshot the prior difficulty wall.

Hard-mode playtest at Wave 35:

- 16 lives remaining
- $2,250 unspent
- 20 towers
- 1,636 kills
- score 27,553

Earlier strong runs commonly failed around Waves 24-25. Reward smoothing alone enabled a run to reach Wave 30. The full coordinated pass then made Wave 35 survivable with substantial lives and cash remaining.

## Current assessment

The structural tower-role problem is substantially improved: specialists now have clear intended matchups and Basic is no longer the only safe strategy. The unresolved problem is **overall difficulty calibration** after combining several beneficial changes.

Likely contributors to the overshoot include:

- longer effective spawn duration
- much stronger specialist upgrades
- explicit matchup bonuses
- reduced Brute class growth
- accumulated benefit from reward smoothing

No further balance change was selected during this session. The current committed implementation is a useful tested checkpoint.

## Next step

Preserve this build as the baseline and perform controlled comparison runs:

1. Add lightweight checkpoint telemetry and make random wave composition seedable.
2. Run a mixed-specialist build versus a Basic-heavy control.
3. Record lives, money, tower mix, tiers, first leak, and peak enemies at Waves 20, 25, 30, 35, and 40.
4. Determine whether excess survivability comes primarily from economy, specialist power, or slower spawning.
5. Make one coordinated correction after reviewing the evidence rather than returning to repeated micro-tweaks.
6. Deploy the reviewed balance revision and verify local/production asset parity.

## Source-of-truth workflow

Git is authoritative. Push Forgejo first and then mirror the same commit and tags to GitHub. ZIP exports are optional transport artifacts created only when repository access is unavailable; see `PORTABLE_EXPORT.md`.
