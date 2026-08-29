# Controlled Hard-Mode Balance Runs

## Objective

Compare a mixed-specialist strategy with a Basic-heavy strategy under identical enemy compositions. Do not change balance values between the runs.

## August 28 follow-up

Two observational Hard games prompted UI fixes, not balance changes:

| Surface | Final wave | Kills | Score |
| --- | ---: | ---: | ---: |
| Browser, forced touch layout | 52 | 3,443 | 56,287 |
| Native iPhone 17 Pro Simulator | 49 | 3,089 | 50,629 |

Both ran at normal speed. They used different seeds/placements; the browser run
also included an early concurrent-wave test. Do not treat the three-wave gap as
a platform or balance regression. No new controlled full-game matrix has been
completed since these observations.

### Laser effectiveness run — 2026-08-28

A normal-speed Hard browser run used seed `specialists-v0.4.0` and four
fully-upgraded towers of every type. From the wave-40 checkpoint through the
fatal portion of wave 44, the build and targeting stayed fixed. Laser produced
85,219.7 actual damage at 34.93 damage per invested credit: essentially equal
to Basic (34.57), below Rapid (50.12), and below Sniper (60.84). Laser consumed
38.4% of invested capital and produced 29.9% of interval damage. It visibly
pierced road-aligned packs, so the result is not simply a deliberately poor
placement. All 20 leaks were Runners.

This pre-buff run supports the user's concern about Laser effectiveness. The
selected first adjustment leaves cost, base damage, armor penetration, and
pierce falloff unchanged: Laser heat now reaches its ×2.5 ceiling after two
seconds, persists across target changes, cools while idle, and lets Armored
Priority preempt a non-Armored target without losing heat. Repeat the seed on
the revised build before making a second adjustment. Raw data, purchase order,
limitations, and the full analysis are in
[`docs/playtests/2026-08-28-laser-review/`](../playtests/2026-08-28-laser-review/).

Next controlled matrix: use seeds `specialists-v0.4.0`, `hard-review-b`, and
`hard-review-c`, with one mixed-specialist and one Basic-heavy run per seed.
Use unique run labels (for example `review-b-mixed-1`), the same build, normal
speed, automatic waves, and a recorded placement/upgrade order. Keep online
scores off for test runs. Record the build, surface, input method, and viewport.

Compare lives, money, investment, damage contribution, enemy mix, and escapes
through waves 40–55. Export each run before reusing a label. Repeat any apparent
outlier before changing HP, rewards, tower stats, or cadence.

New runs record `escapedByType` and `escapesByWave` in checkpoints and the final
snapshot. Wave attribution follows the escaped enemy's originating spawner,
including concurrent waves. Counts stop at game over: enemies still alive do
not count as escapes. Older archives lack these additive fields; do not infer
escapes from spawned minus killed. Checkpoints remain in telemetry/console but
no longer interrupt players with a diagnostic toast.

The next-wave HUD preview uses an independent seeded generator and includes
forced Runner packs. Automated tests compare it with actual WaveSystem spawns;
that verifies composition, not player survival or frame pacing.

## Start the runs

Use the same `seed` value and a different `run` label for each run:

```text
http://localhost:5173/?seed=specialists-v0.4.0&run=mixed-specialist
http://localhost:5173/?seed=specialists-v0.4.0&run=basic-heavy
```

Select Hard mode for both. Avoid manually adding concurrent spawners or starting waves early; consistent pacing makes peak-pressure comparisons easier to interpret.

## Automatic checkpoints

After Waves 10, 15, 20, 25, 30, 35, 40, 45, and 50 clear, the game records:

- seed and run label
- money, lives, score, and kills
- current towers by type and tier
- current upgrade count
- first leak wave and total leaks
- active enemies at the checkpoint
- peak active enemies across the run and since the preceding checkpoint
- cumulative enemy spawns and kills by type
- invested capital, damage, and kills by tower type

Each checkpoint appears in the browser console and is persisted automatically. The two labeled runs are stored separately.

## Retrieve the data

In the browser console:

```js
copy(JSON.stringify(window.defenseProtocolTelemetryRuns, null, 2))
```

The underlying local-storage key is:

```text
defense_protocol_balance_telemetry_v2
```

Keep the exported JSON with the playtest notes. Compare the runs before selecting a balance correction.

## Accepted v0.4.0 result

The controlled Hard comparison completed on 2026-08-22:

| Run | First leak | Game over | Kills | Score |
| --- | ---: | ---: | ---: | ---: |
| Basic-heavy | 40 | 46 | 2,758 | 45,091 |
| Mixed-specialist | 48 | 54 | 3,682 | 60,273 |

At Wave 45 the two builds had nearly identical investment: $8,975 Basic-heavy versus $8,895 mixed-specialist. Basic-heavy had 9 lives and 11 leaks; mixed-specialist retained 20 lives with no leaks.

The eight-wave survival gain validates the specialist progression. Rapid led specialist contribution through Wave 45 with 492,150 damage and 1,216 kills. No additional balance adjustment was selected.

The archive now persists a `final` snapshot at game over in addition to completed checkpoints. The accepted Wave 46 and Wave 54 results above predate that addition and remain the authoritative comparison record.
