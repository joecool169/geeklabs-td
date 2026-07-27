# Current State

Snapshot date: **2026-07-26**
Branch: **main**
Baseline: **complete clean `HEAD` archive uploaded after the progression-alignment commit**

## Repository and deployment

- Arch project: `/home/joe/projects/geeklabs-td`
- Remotes `github` and `origin` point to `git@github.com:joecool169/geeklabs-td.git`.
- Session changes were reviewed, committed, and pushed in coherent commits.
- The working tree was clean after the progression-alignment commit.
- `npm test`, `npm run build`, and `git diff --check` pass for the current progression implementation.
- Deployment command: `npm run deploy`.
- Production target: `joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/`.
- Live parity should be verified with the checksum dry run documented in `WORKFLOW.md`; this context update does not claim a final live checksum verification.

## Runtime and responsive layout

- Phaser logical canvas: `1080 × 730`
- Scale mode: `Phaser.Scale.FIT`
- Grid size: `40px`
- Reserved top HUD area: `120px`
- The browser page contains the Phaser stage, bottom tower strip, and fixed-width right sidebar.
- Page CSS now lives in `src/style.css`; `src/main.js` imports it.
- Shared dimensions and responsive scales are CSS custom properties.
- The complete desktop composition centers at sufficiently wide viewports.
- A compact rule for wide/short laptop viewports scales the stage and bottom bar together while leaving the sidebar readable.
- The MacBook layout was visually validated at 100% browser zoom without page scrolling.
- The sidebar has a stable outer height and `overflow-y: auto` only as a fallback.

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
- Endless-wave implementation; no victory condition currently exists

## Towers and progression

Tower definitions remain data-driven in `src/constants.js`.

- Basic — unlock wave 1
- Rapid — unlock wave 10
- Sniper — unlock wave 20; defaults to Strong targeting
- Laser — unlock wave 30; defaults to Armored targeting; currently has one tier

Target modes:

- Close
- Strong
- Armored
- First

Tower actions include placement, selection, upgrade, sell, and target-mode cycling.

### Tower presentation

- Basic: compact square turret with central core
- Rapid: round body with twin barrels
- Sniper: long barrel/crosshair profile
- Laser: angular diamond emitter
- Placed towers and placement ghosts share type-specific generated Phaser textures.
- Selected towers retain corner-bracket selection feedback.
- Valid ghosts use green range feedback; blocked ghosts use red.

## Enemy progression

Enemy definitions remain data-driven.

- Runner — waves 1+
- Brute — waves 20+
- Armored — waves 30+

Current progression behavior:

- Waves 1-19 are Runner-only.
- Runner pack pressure ramps during waves 10-15 to establish Rapid's role.
- Brute weight begins at `0.35` on wave 20 and ramps to `1.20` by wave 30.
- Armored weight begins at `0.25` on wave 30 and ramps to `1.00` by wave 42.
- Regression tests lock these milestones and ramps.

Enemies have distinct primitive-rendered silhouettes. Damaged enemies show compact health indicators while full-health enemies avoid unnecessary clutter.

## Wave pressure and economy

The first pressure/economy rebalance preserved waves 1-3 and changed later scaling:

- Additional density begins after wave 3.
- Spawn cadence gains a gradual pressure ramp.
- Enemy HP gains a midgame multiplier after wave 3.
- Enemy HP compounds by 3% per wave after wave 12.
- Enemy bounties taper after wave 3.
- Clear-bonus growth slows after wave 12.
- Each concurrent spawner passes its own `waveNumber` into enemy scaling, fixing under-scaled dumped waves.

The first post-patch Hard test through wave 10 still felt too similar and remained leak-free with Basic spam. The progression-alignment patch followed; it has not yet received the full waves 20-30 playtest needed to judge Rapid, Sniper, and Laser roles.

## UI and interaction state

### Bottom tower strip

- Sole visible four-tower selector
- Clear title, description, cost/unlock, shortcut, and state hierarchy
- Locked cards remain readable and non-interactive
- Selected state remains stronger than hover/focus
- Tower-specific accents use existing tower colors

### Placement context

The old duplicated sidebar build menu was replaced with a contextual panel showing:

- placement active state
- selected tower name
- cost
- range
- live Valid/Blocked status
- placement and cancellation instructions

### Selected-tower panel

- Prominent tower identity
- Compact 2×2 combat-stat grid
- Target, upgrade, and sell values integrated into their action buttons
- Normal management fits within the fixed sidebar height on the MacBook layout

### Wave-state feedback

- Ready/intermission: wave number and Space instruction
- Wave start: brief centered `WAVE X ENGAGED` banner
- Active wave: minimal groups/enemies status
- Wave complete: brief positive confirmation
- Pause: clear resume instruction
- Game over: distinct red-accented results state

## Combat presentation

- Selected and placement range overlays now use a thin boundary and subtle translucent fill.
- Coverage fill renders beneath gameplay entities; the exact range boundary remains readable.
- Basic: compact cyan projectile and restrained ring hit flash.
- Rapid: tiny green round and very brief spark.
- Sniper: instantaneous layered tracer and crisp crosshair impact.
- Laser: continuous layered piercing beam with brief flares on actual hits.
- Attack presentation preserves existing projectile/hitscan/continuous models and does not change combat mechanics.

## Current controls

- `1 / 2 / 3 / 4` — choose tower and enter placement
- `T` — toggle placement mode
- Left click — place while placing; otherwise select
- Right click — context-dependent cancel or sell
- `U` or Shift-click — upgrade selected tower
- `X` — sell selected tower
- `F` — cycle targeting mode
- `Space` — start an available wave
- `P` — pause/resume
- `Esc` — cancel placement, clear selection, or resume contextually

## Tests

`package.json` includes:

```json
"test": "node --test"
```

`test/progression.test.js` currently verifies:

- unlock milestones `1 / 10 / 20 / 30`
- Runner-only waves before 20
- Brute introduction and weight ramp
- Armored introduction and weight ramp
- Runner pack progression around waves 10-16

## Next playtest

Run Hard through at least wave 22, preferably wave 30, and record:

- lives and money at waves 10, 15, 20, 22, and 30
- tower count and mix
- upgrades purchased
- first leak
- peak enemies alive
- whether Rapid is useful from wave 10
- whether Sniper is worthwhile when Brutes arrive at wave 20
- whether Laser is worthwhile when Armored arrives at wave 30
- first wave where Basic-only play falls behind

Do not move unlock milestones again without this playtest evidence.

## Known architectural pressure

`src/scene.js` remains a large orchestration file with run state, input, overlays, leaderboards, placement/selection, Laser behavior, feedback, and lifecycle responsibilities. Several helpers live under `src/game/`, but further extraction should remain behavior-preserving and should not be mixed with balance changes.
