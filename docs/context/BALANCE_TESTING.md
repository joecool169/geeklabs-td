# Controlled Hard-Mode Balance Runs

## Objective

Compare a mixed-specialist strategy with a Basic-heavy strategy under identical enemy compositions. Do not change balance values between the runs.

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
