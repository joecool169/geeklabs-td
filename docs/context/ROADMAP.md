# Roadmap

## Phase 1 — Responsive layout and interaction clarity — completed baseline

The responsive desktop/laptop layout, contextual sidebar, bottom tower strip, primitive-rendered game silhouettes, and improved wave-state presentation are established. Additional layout work should now be driven by mobile and touch requirements.

## Phase 2 — Specialist progression validation — current

The first seeded comparison reached Wave 45 with Basic-only and Wave 46 with a Basic/Sniper-heavy build. The product goal is longer endurance play, while the one-wave specialist advantage was too small to justify the counter system.

Immediate work:

- preserve `v0.3.0-balance-checkpoint` as the pre-progression baseline
- validate the implemented 10/15/20/25/30/35 specialist/threat cadence
- validate Sprinter, Brute, and Armored preferred targeting plus manual cycling
- run one mixed-specialist build and one Basic-heavy control
- compare damage, kills, investment, lives, cash, and peak enemies through Wave 50
- expect a meaningful endurance advantage from correct specialist use
- adjust Rapid range or projectile behavior only if the new role still underperforms
- deploy only the reviewed progression revision and verify asset parity

Do not reduce economy merely to shorten runs. The intended direction is a higher survival ceiling through meaningful specialist use.

## Phase 3 — Architecture inventory and staged refactor

- document scene responsibilities and invariants
- extract one responsibility at a time from `src/scene.js`
- separate leaderboard networking/storage from scene rendering
- move overlay creation toward reusable UI modules
- centralize run state where practical
- keep each refactor behavior-preserving and independently committed
- do not mix code movement with balancing

## Phase 4 — Unified input and touch-ready UI

- introduce semantic game actions
- map keyboard and mouse into the action layer
- add touch-friendly controls and contextual actions
- remove dependence on right-click and hover
- ensure useful touch target sizes and safe-area spacing
- preserve efficient desktop keyboard behavior

## Phase 5 — Early iOS proof of concept

- add a minimal Capacitor project
- build and run on a real iPhone
- verify canvas sizing, touch coordinates, orientation, safe areas, audio activation, pause/resume, persistence, heat, and dense-wave performance

## Later product work

- onboarding/tutorial refinement
- replay and endurance testing
- additional maps, modes, towers, or progression only when supported by playtest evidence
- free web version with a polished mobile edition considered later

See `CONTEXT_IDEAS.md` for non-binding gameplay possibilities.
