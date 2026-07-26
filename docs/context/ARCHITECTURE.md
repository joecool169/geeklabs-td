# Architecture

## Current architecture

### Entry and hosting

- `index.html` owns the browser page shell, responsive CSS, branding panel, controls panel, and bottom tower strip container.
- `src/main.js` creates one Phaser game using a `1080 × 730` logical canvas and `Phaser.Scale.FIT`.
- `src/scene.js` defines the primary `GameScene` and remains the orchestration center.

### Extracted modules

- `src/constants.js` — tower and enemy definitions, target modes, shared helpers
- `src/game/config.js` — grid, UI reservation, wave concurrency, and difficulty configuration
- `src/game/utils.js` — geometry and placement utilities
- `src/game/bullets.js` — deterministic projectile behavior
- `src/game/enemies.js` — spawn, movement, and targeting helpers
- `src/game/towers.js` — tier, upgrade, sell, and targeting-cycle helpers
- `src/game/waves.js` — wave calculation, intermission, spawn, and completion state
- `src/game/ui.js` — extracted UI helper behavior

### Current strengths

- Core definitions are data-driven.
- Gameplay helpers have begun moving out of the scene.
- Projectiles are manually resolved rather than depending on unstable physics overlap behavior.
- Difficulty multipliers are centralized.
- Desktop page chrome is separated from the Phaser canvas.
- The game already has persistence, leaderboards, overlays, audio, and feedback.

### Current weaknesses

- `src/scene.js` is still a large multi-responsibility file.
- DOM overlay creation and styling are heavily embedded in JavaScript.
- Input handling is tied directly to keys and pointer events instead of semantic game commands.
- The desktop controls panel describes commands rather than acting as a reusable touch-control surface.
- Layout rules are distributed between `index.html`, `src/style.css`, Phaser scaling, and scene-generated DOM overlays.
- Web API calls and leaderboard presentation are coupled to the scene.
- There is no explicit platform abstraction for browser versus native lifecycle/storage/services.

## Approved target direction

The refactor should prepare one shared codebase for web and mobile. It should not become a full rewrite.

A reasonable target organization is:

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

## Responsive UI goal

Support three deliberate layouts:

### Wide desktop

- HUD above playfield
- playfield plus fixed-width sidebar
- bottom tower strip
- overall composition centered in the viewport

### Tablet / landscape phone

- compact HUD
- playfield
- bottom tower bar
- contextual selected-tower actions

### Portrait phone

- compact HUD
- scaled playfield
- horizontal tower carousel
- contextual action bar

Mobile must not depend on hover, right-click, or keyboard shortcuts.

## Native direction

- Preserve Phaser/Vite as the game core.
- Use Capacitor as the initial iOS wrapper candidate.
- Run an early device proof of concept.
- Add native-specific services only behind a platform boundary.
- Test safe areas, app backgrounding, touch coordinate accuracy, audio activation, persistence, orientation, heat, and dense-wave performance.
- Do not start a parallel Swift gameplay implementation.
