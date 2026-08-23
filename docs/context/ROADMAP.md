# Roadmap

## Phase 1 — Responsive layout and interaction clarity — completed baseline

The responsive desktop/laptop layout, contextual sidebar, bottom tower strip, primitive-rendered game silhouettes, and improved wave-state presentation are established. Additional layout work should now be driven by mobile and touch requirements.

## Phase 2 — Specialist progression validation — completed

The controlled v0.4.0 Hard comparison validated the 10/15/20/25/30/35 cadence and preferred targeting. Basic-heavy failed on Wave 46; mixed specialists failed on Wave 54. First leak moved from Wave 40 to Wave 48, and Rapid led specialist damage and kills.

The v0.4.0 balance is accepted. Preserve `v0.3.0-balance-checkpoint` as the earlier baseline and do not change tower values without new evidence.

## Phase 3 — Telemetry completion and staged refactor — completed

- final run snapshots now persist the failure wave and final totals
- run transitions are centralized in `RunState` and `RunController`
- wave, tower, enemy, projectile, combat, world-rendering, input, HUD, and overlay responsibilities have explicit owners
- storage, query options, leaderboard access, and telemetry publication are isolated services
- each behavior-preserving slice was tested, built, smoke-tested, and committed independently
- v0.4.0 balance values were preserved

## Phase 4 — Touch-ready UI — completed

- semantic game actions are implemented
- keyboard and mouse map through the action layer
- touch-friendly controls and contextual actions are implemented
- touch play no longer depends on right-click or hover
- action targets, responsive touch layouts, and safe-area spacing are implemented
- desktop keyboard and mouse behavior is preserved

## Phase 5 — Early iOS proof of concept — completed

- add a minimal Capacitor project — completed
- add native lifecycle pause and durable preference mirroring — completed
- build and run in the iOS Simulator — completed with Xcode 26.6 and iOS 26.5
- build, install, and launch on a real iPhone — completed on an iPhone 17 Pro Max
- verify canvas sizing, touch coordinates, orientation, safe areas, audio activation, pause/resume, preference bridging, and dense-wave performance — completed
- retain measured battery/thermal endurance and force-quit restoration as release-candidate checks

See `IOS_POC.md` for the exact validation commands and device checklist.

## Phase 6 — Presentation polish — completed

- strengthen HUD and state hierarchy without changing gameplay balance
- refine touch-control spacing, alignment, and interaction states
- coordinate visual and audio feedback for placement, upgrades, leaks, unlocks, and wave transitions
- reduce visual noise and preserve target readability during dense waves
- exit placement after a successful build and preserve access to every grid row
- expose selected-tower combat stats on touch layouts
- compact the short-landscape pause menu and refine the large iPad layout
- ship the native app in landscape-left/right orientation only
- complete web, Simulator, and physical-device validation before release

## Later product work

- onboarding/tutorial refinement
- replay and endurance testing
- additional maps, modes, towers, or progression only when supported by playtest evidence
- free web version with a polished mobile edition considered later

See `CONTEXT_IDEAS.md` for non-binding gameplay possibilities.
