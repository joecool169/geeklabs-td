# Architecture

## Current architecture

### Entry and hosting

- `index.html` owns the browser page shell, branding/sidebar markup, placement context, selected-tower markup, and bottom tower strip container.
- `src/style.css` owns page layout, responsive rules, tower-card states, sidebar panels, and DOM overlay styling.
- `src/main.js` imports `src/style.css` and creates one Phaser game using a `1080 × 730` logical canvas with `Phaser.Scale.FIT`.
- `src/scene.js` defines the primary `GameScene` and remains the orchestration center.

### Runtime boundaries

- `src/core/RunState.js` and `RunController.js` — run state, economy, scoring, pause, lives, and terminal transitions
- `src/systems/WaveSystem.js` — intermissions, concurrent spawners, seeded composition, wave input, and clear rewards
- `src/systems/TowerSystem.js` — placement, selection, upgrades, selling, unlocks, and target-mode cycling
- `src/systems/EnemySystem.js` — spawning, movement, rewards, targeting queries, health visuals, and leaks
- `src/systems/CombatSystem.js` and `ProjectileSystem.js` — firing, projectile lifecycle, laser locks/piercing, damage, kills, and combat telemetry
- `src/presentation/WorldRenderer.js` — map/path rendering, procedural textures, range overlays, and placement geometry
- `src/input/InputController.js` and `actions.js` — keyboard/pointer events mapped to semantic game actions
- `src/ui/GameDomView.js` and `OverlayManager.js` — persistent DOM panels and start/pause/results overlays
- `src/game/ui.js` (`HudController`) — Phaser HUD, wave hints, transitions, and sidebar projection
- `src/services/` — preferences/storage, run query options, leaderboard I/O, and telemetry archive publication
- `src/platform/nativeRuntime.js` — Capacitor detection, lifecycle events, and native Preferences mirroring

Pure definitions and calculations remain under `src/constants.js` and `src/game/`. `src/scene.js` coordinates Phaser lifecycle and the explicit systems.

### Tests

- `npm test` runs Node's built-in test runner. The exact current count is kept in
  `CURRENT_STATE.md` rather than duplicated here.
- Focused system/service tests cover run state, input, world presentation, towers, enemies, combat, waves, preferences, leaderboard access, and telemetry publication.
- `test/progression.test.js` continues to protect all accepted balance and deterministic-composition invariants.

### Current strengths

- Core definitions are data-driven.
- Responsive page CSS is separated from HTML and uses centralized custom properties.
- Phaser FIT scaling and the compact stage rule preserve pointer mapping.
- Gameplay runtime responsibilities have explicit owners and dependencies.
- Projectiles are manually resolved rather than depending on unstable physics overlap behavior.
- Difficulty multipliers are centralized.
- The sidebar is contextual rather than duplicating tower selection.
- Production unit art is backed by procedural fallbacks, preserving readable
  towers, enemies, projectiles, impacts, and wave states if an asset fails.
- Progression has regression tests.

### Current weaknesses

- `src/scene.js` still creates Phaser HUD/effect objects and coordinates menus; further reduction should be driven by native lifecycle needs, not code movement alone.
- Balance tests are currently formula/regression tests; there is no deterministic simulation harness for full wave outcomes.
- Global score submission is intentionally lightweight and trust-based; there is
  no account identity, client attestation, or competitive anti-cheat boundary.

## Production and repository boundaries

This repository owns the game source, generated Vite bundle, Capacitor shell,
and Nginx game image. It does not own the public marketing/support site or the
persistent production service definitions.

```text
Cloudflare Tunnel
    |
    v
Nginx gateway (geeklabs-site deployment)
    |-- geeklabs.io ----------> public site container
    `-- play.geeklabs.io
          |-- /api/* ---------> leaderboard API + SQLite
          `-- everything else -> game container from this repository
```

The public site, gateway, leaderboard API, database volume, backup definitions,
and Compose stack live in the separate `geeklabs-site` repository. Keeping
`/api/*` on the game origin preserves the browser service contract without
embedding infrastructure ownership in the game core. Cloudflare Tunnel is the
only public ingress; containers communicate on a private Docker network and do
not require host-published web ports.

## Current layout behavior

### Wide desktop

- stage, bottom strip, and sidebar form one centered composition
- sidebar remains fixed-width
- large-screen scaling remains separate from compact laptop behavior

### Wide, short laptop

- stage and bottom strip scale together
- sidebar remains readable at normal size
- fixed sidebar height prevents document growth during placement and tower management
- validated on a MacBook at 100% browser zoom

### Touch layouts

- tablet / portrait phone: scaled playfield, persistent controls, horizontal tower carousel, and contextual action bar
- short landscape phone: playfield beside a compact two-column control and tower dock
- safe-area insets and viewport-level overlays are supported
- touch interaction does not depend on hover, right-click, or keyboard shortcuts

## Implemented organization

```text
src/
├── main.js
├── scene.js
├── core/
│   ├── RunState.js
│   └── RunController.js
├── systems/
│   ├── WaveSystem.js
│   ├── TowerSystem.js
│   ├── EnemySystem.js
│   ├── ProjectileSystem.js
│   └── CombatSystem.js
├── presentation/
│   └── WorldRenderer.js
├── ui/
│   ├── GameDomView.js
│   ├── OverlayManager.js
│   └── TouchSellGuard.js
├── input/
│   ├── InputController.js
│   └── actions.js
├── services/
│   ├── preferences.js
│   ├── runOptions.js
│   ├── leaderboard.js
│   └── telemetryArchive.js
└── game/
    └── pure calculations and HUD projection
```

## Input architecture

Game code consumes semantic commands rather than raw device events:

- `SELECT_TOWER`
- `ENTER_PLACEMENT`
- `PLACE_TOWER`
- `CANCEL`
- `SELECT_EXISTING_TOWER`
- `UPGRADE_TOWER`
- `SELL_TOWER`
- `CYCLE_TARGETING`
- `START_WAVE`
- `PAUSE`

Keyboard, mouse, touch, and future controller input should map into those commands.

## Native direction

- Preserve Phaser/Vite as the game core.
- Use the accepted Capacitor shell as the iOS wrapper.
- Keep physical-device endurance and restoration checks in the release gate.
- Add native-specific services only behind a platform boundary.
- Pause active gameplay when iOS becomes inactive and require an explicit resume after returning.
- Keep browser storage synchronous while mirroring managed values to native Preferences for durability.
- Test safe areas, app backgrounding, touch coordinate accuracy, audio activation, persistence, orientation, heat, and dense-wave performance.
- Do not start a parallel Swift gameplay implementation.
