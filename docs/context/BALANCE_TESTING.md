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
