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

## Phase 7 — Unified command interface — completed

- establish one visual system for the HUD, command deck, tower cards, and overlays
- show tower role, unlock, affordability, placement validity, and selected-tower context at a glance
- make touch selection forgiving and confirm it in both the world and action deck
- keep phone, tablet, and desktop layouts inside their viewports without scrolling
- add restrained transitions, pressed states, keyboard focus, and reduced-motion support
- preserve the accepted balance and gameplay model

## Phase 8 — Industrial–sci-fi art vertical slice — completed

- establish the production palette, materials, camera, footprint, and readability rules
- add a restrained industrial floor and plated route treatment
- replace Runner with transparent bitmap art while retaining its procedural fallback
- give Basic T1–T3 visibly distinct production artwork
- coordinate Basic aiming, muzzle, projectile, impact, hit, and Runner destruction feedback
- validate the vertical slice at desktop, iPhone, and iPad layouts without changing balance

## Phase 9 — Interactive defense presentation — completed

- add a defended command core beyond the route endpoint
- coordinate integrity color, leak impact, and game-over feedback
- split Basic towers into stationary bases and tier-specific rotating heads
- align muzzle flashes and projectile origins with the swiveling barrels
- preserve all accepted balance and targeting behavior

## Phase 10 — Remaining unit art — completed

- Rapid and Sprinter paired slice — completed
- Sniper and Brute paired slice — completed
- Laser and Armored paired slice — completed
- layered three-tier swiveling specialist towers — completed
- restrained enemy movement and damage-state feedback — completed
- deployment gate and route hardware — completed
- cross-class desktop, iPhone, and iPad readability validation — completed
- density-aware effect and health-bar budgets — completed

## Phase 11 — Field validation and release readiness — next

- complete late-wave physical-device sessions with the full art set on iPhone and iPad
- record measured battery and thermal behavior during an endurance run
- verify force-quit preference restoration on the release candidate
- refine tower pivots or footprints only from physical-device evidence
- prepare App Store metadata, screenshots, privacy declarations, signing, and TestFlight when product scope is ready

## Later product work

- onboarding/tutorial refinement
- replay and endurance testing
- additional maps, modes, towers, or progression only when supported by playtest evidence
- free web version with a polished mobile edition considered later

See `CONTEXT_IDEAS.md` for non-binding gameplay possibilities.
