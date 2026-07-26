# Current State

Snapshot date: **2026-07-26**
Verified source commit: **465de15**

## Repository and deployment

- Arch project: `/home/joe/projects/geeklabs-td`
- Branch: `main`
- Remotes `github` and `origin` both point to `git@github.com:joecool169/geeklabs-td.git`.
- Local `HEAD`, `github/main`, and `origin/main` were verified at `465de15`.
- Production build succeeds with Vite.
- Live deployment matches the generated `dist/` by checksum dry run.

## Runtime shape

- Phaser canvas logical size: `1080 × 730`
- Phaser scale mode: `FIT`, centered both axes
- Grid size: `40px`
- Reserved top HUD area: `120px`
- Browser page includes:
  - centered/scaled Phaser playfield
  - right-side branding and controls panel
  - bottom tower selection strip
  - high-resolution UI scale rules for large displays

## Implemented game flow

- Start screen with saved player name and difficulty selection
- Difficulties: Easy, Medium, Hard
- Difficulty-specific starting money, enemy HP/speed/reward multipliers, and score multipliers
- Wave-based spawning with intermissions and concurrent wave spawners
- Manual wave start with Space
- Pause overlay/menu
- Game-over results overlay
- Local top-10 leaderboards separated by difficulty
- Optional global leaderboard API with local fallback
- Persistent player name, difficulty, leaderboard, and help-overlay preference through `localStorage`

## Towers

Tower definitions remain data-driven in `src/constants.js`.

- Basic — unlock wave 1
- Rapid — unlock wave 10
- Sniper — unlock wave 20; defaults to Strong targeting
- Laser — unlock wave 40; defaults to Armored targeting; currently has one tier

Target modes:

- Close
- Strong
- Armored
- First

Tower actions include placement, selection, upgrade, sell, and target-mode cycling.

## Enemies

Enemy definitions remain data-driven.

- Runner
- Brute
- Armored

Enemies scale by wave and difficulty. Armored enemies have armor mitigation. Wave composition and spawn timing are generated from the current wave.

## Feedback and presentation

- Defense Protocol branding and favicon/touch icon
- Core SFX for place, upgrade, sell, wave, enemy death, life loss, and game over
- Enemy hit flash
- Life-loss screen feedback
- Consolidated HUD updates
- Bottom build menu with unlock state and affordability state
- Selected-tower information in the sidebar
- Help/control emphasis and path-pulse assistance

## Current controls

Desktop controls are keyboard-forward:

- `1 / 2 / 3 / 4` — choose tower and enter placement
- `T` — toggle placement mode
- Left click — place while placing; otherwise select
- Right click — context-dependent cancel or sell
- `U` or Shift-click — upgrade selected tower
- `X` — sell selected tower
- `F` — cycle targeting mode
- `Space` — start an available wave
- `P` — pause/resume
- `Esc` — cancel placement, clear selection, or close/resume contextually

## Layout assessment from 2026-07-26

The game now looks coherent and playable rather than like a raw Phaser prototype. The strongest elements are the readable path, consolidated HUD, tower cards, and grouped control panel.

Immediate layout concerns:

- The complete page composition is left-heavy on a wide desktop display.
- The game wrapper should be centered and constrained as a unified playfield-plus-sidebar layout.
- Placement mode and selected tower state need stronger visual signaling.
- Some control wording is ambiguous because click behavior changes by state.
- `Spawners` is developer-facing wave terminology and should become player-facing wording.
- The right-side control legend should become an interactive contextual action panel on touch devices.
- Mobile layouts should not depend on hover, right-click, or a physical keyboard.

## Known architectural pressure

`src/scene.js` is more than 2,000 lines and still owns substantial responsibilities:

- run state
- input binding
- start screen
- pause menu
- game-over screen
- leaderboard rendering and network calls
- tower placement and selection
- laser behavior
- feedback effects
- scene lifecycle

Several gameplay helpers have already been extracted into `src/game/`, but the scene remains the central monolith. The next refactor should reduce this concentration without changing game behavior.
