# Rocket turret prototype — September 27, 2026

Implemented on `codex/rocket-turret`, based on web `main`. This is a web
playtest candidate, not a production deployment or mobile release.
The owner authorized implementation after choosing the design and delegated
remaining tuning choices. Full-run balance acceptance is pending.

## Starting configuration

Historical baseline below. September 30 playtest adjustment: reload is now
**3 seconds at every tier**, following owner feedback about the long pause.
All other balance values below remain unchanged. Compare pacing and survival
against the original five-second candidate; improved full-run results are not
yet established.

| Setting | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- |
| Purchase / upgrade cost | $320 | $260 | $380 |
| Rockets per volley | 3 | 4 | 5 |
| Damage per rocket at blast center | 105 | 140 | 180 |
| Range | 155 | 175 | 195 |
| Reload after final launch | 5 seconds | 5 seconds | 5 seconds |

- Unlock at Wave 40; keyboard shortcut 5 and a fifth touch/desktop card.
- Focused homing volleys, launches 180 ms apart, flight speed 350 pixels/sec.
- Blast radius 58 pixels; linear falloff from full damage to 25% at the edge.
- Normal per-enemy armor reduction, no armor penetration.
- Default Densest Group targeting, tied by progress toward the exit. First,
  Close, Strong and Armored modes remain selectable.
- Dead targets redirect rockets to the nearest active enemy within 90 pixels
  of the last known target position. Without one, rockets fly to that position
  and explode. Flights expire after four active seconds at their current position.
- Upgrades do not reset reload or strengthen already queued/in-flight rockets.
- Selling cancels pending launches; airborne shots retain their damage/credit.
- Active gameplay time controls launches, flight and reload. Restart clears them.
- Temporary procedural layered launcher artwork has three, four or five tubes,
  a rotating rack, warm exhaust, and short, bounded blast effects.
- Rocket damage/kills use existing rewards and per-tower telemetry. DPS displays
  account for the entire volley/reload cycle and describe a single center target;
  splash adds damage to neighboring targets.
- Existing tower/enemy balance values are unchanged. Linking is deferred.

## Verified

- All 104 tests pass, including nine new rocket tests for focused volleys,
  retargeting, splash/armor, selling, targeting, reload/upgrades, kill telemetry,
  flight expiry, and enemy collection mutation during splash kills.
- Production build and whitespace checks pass.
- Headless Chrome exercised both Defense Grid and Relay Yard: Wave 39 lock,
  Wave 40 placement, all three tiers, homing/splash combat, telemetry damage,
  and pause/resume with rockets in flight. No browser errors observed.
- Desktop 1440×1000 and touch 844×390, 667×375, 1366×1024 were inspected.
  The selected rocket and all five tower cards fit the landscape touch layouts.
- Browser tests used temporary response instrumentation to create synthetic
  scenarios; no debug hook was added to production source. Online scores were
  disabled, and no scores were posted. These checks do not establish balance,
  moving-wave performance, or physical-device acceptance.

## Gameplay test

Run `npm run dev`, open the local address, select either map and play normally.
Rocket unlocks at Wave 40 and costs $320; press 5 or select its card.
Compare mixed defenses with/without Rocket using the same seed and difficulty.
Check dense packs, lone Brutes, Armored groups, targeting switches, moving fast
units, and the vulnerable reload window. Note wave reached, first leaks,
rocket investment, damage/kills and whether volleys feel worth their cost.

Before public release, decide whether existing leaderboard scores should share
standings with runs using the new turret; this candidate has not changed the API
or established a new score season. Any later mobile release needs its own native
and device validation.
# September 30 preview controls correction

Changing the selected map before engaging restarted the scene while Phaser's
keyboard plugin was disabled by setup. Direct gameplay entry now restores it.
Regression procedure: in a fresh browser select Relay Yard, engage, press Space,
pause/resume with P/Resume, select Basic with 1 and place it with the mouse. Reload
and switch back to Defense Grid, repeating the same interactions. Both directions
failed to start Wave 1 with the old code and passed with the correction. All 104
tests and the production build pass. This correction is local and awaits owner
acceptance; no public or native release was made.

## September 30 web release approval

Owner accepted the three-second reload candidate for public web release, including
the map-switch keyboard fix. Existing map-separated leaderboard history is retained
for this release; no reset or new score season is introduced. Scores span gameplay
versions and should not be treated as controlled balance comparisons. Native release
remains separate. Release verification is recorded in CURRENT_STATE.md.
