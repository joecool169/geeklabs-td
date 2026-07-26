# Roadmap

## Phase 1 — Trusted baseline and layout refinement

- Preserve commit `465de15` as the verified starting point.
- Center and constrain the full desktop composition.
- Clarify selected tower and placement mode visually.
- Replace developer-facing wave wording with player-facing language.
- Make click behavior and state transitions unambiguous.
- Keep the current gameplay and balance unchanged during layout work.

## Phase 2 — Architecture inventory and staged refactor

- Document scene responsibilities and invariants.
- Extract one responsibility at a time from `src/scene.js`.
- Separate leaderboard networking/storage from scene rendering.
- Move overlay creation toward reusable UI modules.
- Centralize run state where practical.
- Keep each refactor behavior-preserving and independently committed.

## Phase 3 — Unified input and touch-ready UI

- Introduce semantic game actions.
- Map keyboard and mouse into the action layer.
- Add touch-friendly buttons and contextual action panels.
- Remove dependence on right-click and hover.
- Ensure useful touch target sizes and safe-area spacing.
- Validate desktop behavior remains efficient for keyboard users.

## Phase 4 — Early iOS proof of concept

- Add a minimal Capacitor project.
- Build and run on a real iPhone.
- Verify canvas sizing and touch coordinates.
- Verify orientation and safe-area handling.
- Verify audio after user gesture.
- Verify pause/resume during app backgrounding.
- Verify local persistence across relaunch.
- Stress-test dense later waves for heat and performance.

## Phase 5 — Product-quality game loop

- Refine start, pause, and result flows.
- Improve onboarding/tutorial behavior.
- Add player-facing feedback where mechanics remain unclear.
- Continue balance and replay testing.
- Decide whether more maps, modes, towers, or progression are required before mobile release.
- Gather evidence that players restart and return before spending heavily on monetization infrastructure.

## Phase 6 — Mobile product and monetization

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

Possible later mobile value:

- offline play
- additional maps or challenge modes
- Game Center achievements and leaderboards
- mobile-specific presentation polish

## Later gameplay backlog

These remain exploratory and should not interrupt the current platform work:

- wave modifiers
- achievements
- voluntary challenge contracts
- overclock/overdrive mechanics
- tower linking
- tower health and saboteur enemies
- repair, shield, or support structures
- late-game economy and saturation solutions

See `CONTEXT_IDEAS.md` for non-binding design options.
