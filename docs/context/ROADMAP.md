# Roadmap

## Phase 1 — Responsive layout and interaction clarity — completed baseline

The responsive desktop/laptop layout, contextual sidebar, bottom tower strip, primitive-rendered game silhouettes, and improved wave-state presentation are established. Additional layout work should now be driven by mobile and touch requirements.

## Phase 2 — Specialist progression validation — completed

The controlled v0.4.0 Hard comparison validated the 10/15/20/25/30/35 cadence and preferred targeting. Basic-heavy failed on Wave 46; mixed specialists failed on Wave 54. First leak moved from Wave 40 to Wave 48, and Rapid led specialist damage and kills.

The v0.4.0 balance is accepted. Preserve `v0.3.0-balance-checkpoint` as the earlier baseline and do not change tower values without new evidence.

## Phase 3 — Telemetry completion and staged refactor — current

- persist a final run snapshot at game over, including the failure wave and final totals
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
