# Architecture

## Current architecture

### Entry and hosting

- `index.html` owns the browser page shell, branding/sidebar markup, placement context, selected-tower markup, and bottom tower strip container.
- `src/style.css` owns page layout, responsive rules, tower-card states, sidebar panels, and DOM overlay styling.
- `src/main.js` imports `src/style.css` and creates one Phaser game using a `1080 × 730` logical canvas with `Phaser.Scale.FIT`.
- `src/scene.js` defines the primary `GameScene` and remains the orchestration center.

### Extracted modules

- `src/constants.js` — tower and enemy definitions, unlocks, target modes, shared helpers
- `src/game/config.js` — grid, UI reservation, wave concurrency, and difficulty configuration
- `src/game/utils.js` — geometry and placement utilities
- `src/game/bullets.js` — deterministic projectile behavior and projectile visual signatures
- `src/game/enemies.js` — spawn, scaling, movement, targeting, enemy visuals, and health indicators
- `src/game/towers.js` — tier, upgrade, sell, and targeting-cycle helpers
- `src/game/waves.js` — wave calculation, progression composition, intermission, spawn, and completion state
- `src/game/ui.js` — DOM UI helper behavior and contextual state rendering
- `src/game/random.js` — stable seed normalization and independent per-wave random streams
- `src/game/telemetry.js` — controlled-run checkpoint collection and tower summaries

### Tests

- `npm test` runs Node's built-in test runner.
- `test/progression.test.js` protects unlock milestones, enemy introduction waves, composition ramps, Runner pack progression, seeded runtime spawning, and telemetry summaries.

### Current strengths

- Core definitions are data-driven.
- Responsive page CSS is separated from HTML and uses centralized custom properties.
- Phaser FIT scaling and the compact stage rule preserve pointer mapping.
- Gameplay helpers have begun moving out of the scene.
- Projectiles are manually resolved rather than depending on unstable physics overlap behavior.
- Difficulty multipliers are centralized.
- The sidebar is contextual rather than duplicating tower selection.
- Towers, enemies, range coverage, projectiles, impacts, and wave states are readable without external art assets.
- Progression has regression tests.

### Current weaknesses

- `src/scene.js` is still a large multi-responsibility file.
- DOM overlay creation and styling remain partly embedded in JavaScript.
- Input handling is tied directly to keys and pointer events instead of semantic game commands.
- The desktop control legend is not yet a reusable touch-control surface.
- Web API calls and leaderboard presentation are coupled to the scene.
- There is no explicit platform abstraction for browser versus native lifecycle/storage/services.
- Balance tests are currently formula/regression tests; there is no deterministic simulation harness for full wave outcomes.

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

### Future mobile layouts

- tablet / landscape phone: compact HUD, playfield, bottom tower bar, contextual tower actions
- portrait phone: compact HUD, scaled playfield, horizontal tower carousel, contextual action bar
- mobile must not depend on hover, right-click, or keyboard shortcuts

## Approved target direction

The refactor should prepare one shared codebase for web and mobile. It should not become a full rewrite.

A reasonable target organization remains:

```text
src/
├── main.js
├── scenes/
│   ├── BootScene.js
│   ├── MenuScene.js
│   ├── GameScene.js
│   └── ResultsScene.js
├── systems/
│   ├── WaveSystem.js
│   ├── TowerSystem.js
│   ├── EnemySystem.js
│   ├── ProjectileSystem.js
│   ├── EconomySystem.js
│   └── ScoreSystem.js
├── ui/
│   ├── Hud.js
│   ├── TowerBar.js
│   ├── TowerActions.js
│   ├── PauseMenu.js
│   └── ResultsPanel.js
├── input/
│   ├── InputController.js
│   ├── KeyboardInput.js
│   └── PointerInput.js
├── platform/
│   ├── PlatformService.js
│   ├── WebPlatform.js
│   └── NativePlatform.js
└── data/
    ├── towers.js
    ├── enemies.js
    └── difficulties.js
```

This is a direction, not an instruction to move every file at once.

## Input architecture goal

Game code should consume semantic commands rather than raw device events:

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
- Use Capacitor as the initial iOS wrapper candidate.
- Run an early device proof of concept.
- Add native-specific services only behind a platform boundary.
- Test safe areas, app backgrounding, touch coordinate accuracy, audio activation, persistence, orientation, heat, and dense-wave performance.
- Do not start a parallel Swift gameplay implementation.
