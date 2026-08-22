# Roadmap

## Phase 1 — Responsive layout and interaction clarity — completed baseline

The responsive desktop/laptop layout, contextual sidebar, bottom tower strip, primitive-rendered game silhouettes, and improved wave-state presentation are established. Additional layout work should now be driven by mobile and touch requirements.

## Phase 2 — Balance calibration — current

The coordinated balance pass established explicit specialist roles and smoothed the modeled Wave 20-40 pressure curve, but the final Hard playtest likely showed an overshoot: Wave 35 was reached with 16 lives and $2,250 remaining.

Immediate work:

- preserve the current implementation as the `v0.3.0-balance-checkpoint` baseline
- use the implemented checkpoint telemetry and seedable wave composition described in `BALANCE_TESTING.md`
- run one mixed-specialist build and one Basic-heavy control
- record lives, cash, tower composition, tiers, first leak, and peak active enemies at Waves 20, 25, 30, 35, and 40
- isolate whether the main excess comes from spawn duration, specialist strength, reward smoothing, or enemy-growth reduction
- make one coordinated correction after analysis
- deploy only the reviewed balance revision and verify asset parity
- avoid returning to repeated isolated number tweaks

Do not assume that tower roles need another redesign. The present unresolved issue is aggregate Hard-mode calibration.

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
