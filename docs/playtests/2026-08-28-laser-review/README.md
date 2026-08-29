# Hard-mode Laser effectiveness review

## Method

- Surface: local browser, forced touch layout, 1280×720 viewport
- Build: `bf989d7` plus the local iPad-only layout/SystemBars changes; combat
  sources were unchanged
- Seed: `specialists-v0.4.0`
- Run label: `laser-review-20260828`
- Difficulty: Hard; normal speed; automatic wave cadence; no manually added
  waves; online scores off
- Placement: deliberate multi-road and corner coverage. Lasers were placed at
  road ends so their beams had opportunities to align with enemy packs.
- A browser input mistake in an initial setup put the first Basic at canvas
  center. That setup was restarted before this measured run and is excluded.

Purchases and upgrades are recorded in [purchases.json](purchases.json). Raw
checkpoint/final data are in [telemetry.json](telemetry.json).

## Run result

- Game over during wave 44: 2,533 kills, 41,452 score
- 19 integrity remained through wave 41. One opening Runner leaked from wave 1.
- The remaining 19 leaks came from waves 42–44; all 20 leaks were Runners.
- Peak active enemies: 77
- The final HUD background still displayed one integrity although final
  telemetry correctly recorded zero.
- $2,297 was deliberately left unspent after the comparison setup. Therefore
  wave 44 is not a high-score or maximum-survival result.

## Fixed-investment comparison

At the wave-40 checkpoint, the defense had four tier-three towers of each type.
No towers were placed, upgraded, sold, or retargeted afterward. The interval
below covers waves 41–43 and the fatal portion of wave 44.

| Type | Invested | Actual damage | Kills | Damage / credit | Cost share | Damage share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Basic | $980 | 33,881.7 | 44 | 34.57 | 15.4% | 11.9% |
| Rapid | $1,180 | 59,142.0 | 90 | 50.12 | 18.6% | 20.7% |
| Sniper | $1,760 | 107,081.1 | 139 | 60.84 | 27.7% | 37.5% |
| Laser | $2,440 | 85,219.7 | 83 | 34.93 | 38.4% | 29.9% |

Damage is actual HP removed after armor and is capped at remaining HP, so
overkill does not inflate the result. Kill credit is less informative: Lasers
had already dealt 3,102 damage at wave 30 but had only three kills.

## Findings

1. The Laser concern is supported in this run. Its 34.93 damage per credit was
   essentially Basic-level efficiency, 30% below Rapid and 43% below Sniper.
2. Lasers delivered useful absolute damage and visibly pierced lined-up enemies.
   They placed second in interval damage, but required 38.4% of all invested
   capital to produce 29.9% of interval damage.
3. All fatal leaks were Runners. Spending heavily on the anti-armor tower had a
   large opportunity cost during Runner-dense late waves. This run spawned only
   44 Armored enemies in total, versus 2,066 Runners.
4. Placement alone does not explain the result: road-end Lasers repeatedly had
   clear beam alignment. Per-tower damage, lock uptime, and pierce-hit counts are
   not currently recorded, so this run cannot distinguish an expensive chassis
   from underused lock/pierce mechanics.

## Suggested next step

This run is the pre-buff baseline for a mechanical Laser improvement. Keep its
$610 total tier-three investment, base damage, armor penetration, and pierce
falloff unchanged. Replace target-specific lock with persistent beam heat,
reach the ×2.5 ceiling after two seconds of firing, cool while idle, and let
Armored Priority preempt a non-Armored target without discarding heat.

Repeat this seed on the revised build and compare the same wave interval. Add
per-tower damage, Laser heat uptime, and enemies hit per beam tick before making
a second balance adjustment.
