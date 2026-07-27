# Roadmap

## Phase 1 — Responsive layout and interaction clarity — completed baseline

Completed in the 2026-07-26 session:

- centered the wide desktop composition
- added compact short-laptop sizing validated on a MacBook at 100% zoom
- moved inline page CSS into `src/style.css`
- centralized shared layout dimensions and scales
- stabilized sidebar height
- made the bottom tower strip the primary selector
- replaced the duplicate sidebar build selector with placement context
- compacted selected-tower stats and actions
- refined wave-state messaging

Further layout work should be driven by touch/mobile needs rather than more desktop-only polish.

## Phase 2 — Current balance and progression validation

Immediate work:

- playtest Hard through waves 22-30
- verify wave 10 Runner-pack pressure makes Rapid useful
- verify Brutes appear at wave 20 and make Sniper worthwhile
- verify Armored enemies appear at wave 30 and make Laser worthwhile
- track lives, economy, tower mix, upgrades, peak active enemies, and first meaningful leak
- compare Basic-only, mixed, and upgrade-heavy builds
- tune specialist value only after playtest evidence
- profile dense later waves for browser/mobile performance

Do not change unlock milestones again without evidence from this playtest.

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
- validate desktop keyboard behavior remains efficient

## Phase 5 — Early iOS proof of concept

- add a minimal Capacitor project
- build and run on a real iPhone
- verify canvas sizing and touch coordinates
- verify orientation and safe-area handling
- verify audio after user gesture
- verify pause/resume during app backgrounding
- verify local persistence across relaunch
- stress-test dense later waves for heat and performance

## Phase 6 — Product-quality game loop

- refine onboarding/tutorial behavior
- continue balance, endurance, and replay testing
- decide whether more maps, modes, towers, or progression are required
- gather evidence that players restart and return before investing heavily in monetization

## Phase 7 — Mobile product and monetization

Preferred initial direction:

- web version remains freely playable
- mobile version is touch-optimized, installable, offline-capable, and polished
- likely free mobile trial or limited edition
- one non-consumable purchase unlocks the full mobile game

Avoid initially:

- subscriptions
- energy systems
- aggressive consumables
- monetization that intentionally damages balance

## Later gameplay backlog

These remain exploratory and should not interrupt current balance validation:

- wave modifiers
- achievements
- voluntary challenge contracts
- overclock/overdrive mechanics
- tower linking
- tower health and saboteur enemies
- repair, shield, or support structures
- late-game economy and saturation solutions

See `CONTEXT_IDEAS.md` for non-binding design options.
