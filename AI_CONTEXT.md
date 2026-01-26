# AI_CONTEXT

This file captures project-level context, conventions, and “current truth” so an assistant can help without re-deriving everything each session.

## Project

- Name: GeekLabs TD (geeklabs-td)
- Stack: Phaser 3 + Vite + JavaScript
- Style: grid-based placement on a fixed path; minimal clean UI; keyboard-forward controls

## Repo workflow

- Commit frequently (small, coherent commits).
- Push at the end of a session and before switching devices.
- When syncing another device: `git pull --rebase` (unless you intend to discard local work, then `git fetch` + `git reset --hard origin/main`).

## AI + Codex workflow (authoritative)

Primary loop:

1. We discuss the next change in ChatGPT.
2. Once the change is chosen, ChatGPT provides a single, specific prompt to paste into Codex (Codex is already running from repo root).
3. When Codex finishes, run `git diff` and paste the diff back into ChatGPT for review.
4. If changes are acceptable, run `npm run dev` to verify game state, then commit.
5. If changes need adjustment:
   - Prefer another Codex prompt (from ChatGPT) for multi-line edits/refactors, or
   - Use a one-liner `perl -i -pe ...` / `perl -0777 -i -pe ...` command (from ChatGPT) for surgical fixes.

Build expectations:

- Do not prompt to run `npm run dev` (assumed).
- Do prompt to run `npm run build` when code is changed (especially module structure, imports/exports, Vite config, or anything that could break the build pipeline).

Review rules:

- Provide diffs, not full-file rewrites, unless explicitly requested.
- Keep pasteable commands/config blocks free of inline commentary.

UI/HUD rules:

- HUD is rendered via the single top-left `this.ui` text line.
- `updateUI()` is the only HUD writer. Gameplay systems (bullets/enemies/waves) may update numeric state only.
- Life-loss feedback keeps the screen flash; any HUD pulse targets `this.ui` (not legacy HUD elements).

Verification commands:

- `grep -R "lifeText\|killText\|scoreText\|diffText" src/`
- `npm run build`

## Dev

- Run: `npm run dev`
- Build: `npm run build`

## Deploy (td.geekstreet.tv)

- Nginx static host: `joe@192.168.7.25`
- Web root: `/opt/docker/stacks/nginx-static/html/td/`
- Deploy from project root:
  - `npm run build`
  - `rsync -av --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/`

## Current gameplay shape (as implemented)

- Grid: 40px snap; top UI reserved space: 120px (TOP_UI).
- Placement is snap-to-grid; cannot place on path; cannot overlap; must have enough money.
- Towers:
  - Data-driven tower defs in `TOWER_DEFS` with tier arrays (cost/damage/range/fireMs/tint/scale).
  - Types: Basic, Rapid, Sniper.
  - Sniper is visually marked (“S” badge).
- Enemies:
  - Wave-driven spawner; intermission and running states.
  - Types: Runner, Brute, Armored (data-driven in `ENEMY_DEFS`).
  - Scaling per wave for HP and speed (per-enemy def params).
- Scoring:
  - Score increases on kills (reward + strength weight).
  - Clear bonus adds money + score on wave completion.
- Pause:
  - P toggles pause; physics + timers are paused; placement is canceled on pause.
  - Current pause UI is a simple “PAUSED (P to resume)” overlay. (A pause menu is planned.)

## Controls and UX

### Placement

- T: Toggle placement mode
- 1: Basic tower
- 2: Rapid tower
- 3: Sniper tower
- Left click (while placing): Place tower (only if valid)
- Right click (while placing): Cancel placement
- While placing: placement hint shows selected tower + cost/range and reminds: (1/2/3: switch)
- One-time toast appears when entering placement mode (discoverability)

Placement rules:

- Snap to grid (40px)
- Cannot place on path
- Cannot overlap an existing tower
- Must have enough money for the selected tower type

### Selection and actions

- Left click: Select tower (range ring shows only for selected)
- Shift+Click on tower: Upgrade
- U: Upgrade selected tower
- X: Sell selected tower
- Right click on tower: Sell selected tower
- F: Cycle targeting mode (Close → Strong → First)
- Esc:
  - If paused: resume
  - Else if placing: cancel placement
  - Else if a tower is selected: clear selection

### Waves

- SPACE: if in intermission, starts the next wave immediately (skips remaining intermission wait)

## Design constraints (do not break)

- Keep rings visible only for the selected tower (no hover rings).
- Keep tower tiers data-driven (avoid hard-coded tier if/else).
- Keep projectiles deterministic/manual (avoid relying on Arcade overlap for hits).
- Keep UI uncluttered; prefer contextual hints that appear only when relevant.

## Roadmap (priority order)

This is the to-do list for upcoming work. “Easy” is the current baseline play mode.

### 1) Difficulty modes: Easy / Medium / Hard

Goal:

- Preserve current balance as “Easy”.
- Add “Medium” and “Hard” that are clearly harder without feeling unfair.

Implementation direction:

- Introduce a `difficulty` setting selected at game start (before the first wave).
- Drive difficulty via multipliers applied in ONE place so tuning is centralized:
  - Enemy HP multiplier
  - Enemy speed multiplier
  - Enemy reward multiplier (usually down for harder)
  - Starting money
  - Intermission length and/or auto-start behavior
  - Wave scaling parameters (total enemies, spawn delay floor, weight ramps)
- Ensure difficulty impacts wave config and enemy spawn stats consistently.

### 2) Username prompt at game start + Top 10 scoreboard at game over

Goal:

- Prompt for a username when starting a run.
- On game over, show:
  - Final score
  - Wave reached
  - Kills
  - Username
  - Top 10 leaderboard (persistent)

Implementation direction:

- Store leaderboard in `localStorage` (no backend required initially).
- Leaderboard entry shape:
  - name, score, wave, kills, dateISO, difficulty
- Sorting:
  - Primary: score desc
  - Tie-breakers: wave desc, kills desc, date asc (optional)
- “Game over” flow:
  - Stop simulation
  - Show overlay with results and leaderboard
  - Provide options: Restart, Change Name, Change Difficulty

### 3) Pause menu

Goal:

- Replace the current pause text overlay with a pause menu overlay.

Menu contents (minimum viable):

- Resume
- Restart run
- Help/Controls toggle (optional)
- SFX/Music toggles (optional future)
- Quit to start screen (if you add a start screen for username/difficulty)

Implementation direction:

- Keep using the existing `setPaused()` mechanics (physics + timers paused).
- Add a UI container/overlay with interactive buttons.
- Ensure it blocks gameplay input while visible.

### 4) New turrets (Laser, Sniper...)

Notes:

- Sniper already exists as a tower type; keep it and add new ones (e.g., Laser).

Goal:

- Expand tower variety without disrupting the data-driven tower system.

Implementation direction:

- Add new tower entries in `TOWER_DEFS` with tier arrays and distinct behavior hooks.
- Prefer a “tower behavior” pattern:
  - Keep shared targeting and cooldown logic
  - Allow per-tower fire behavior (bullet vs beam vs piercing)
- Candidate tower behaviors:
  - Laser: beam/continuous damage or high-rate low-damage with armor interaction
  - True Sniper variant: very high single shot, slow cadence, strong vs tanks

### 5) Turret linking

Goal:

- Add an interaction where towers can link (buff, share targeting, chain lightning, etc.).

Implementation direction:

- Define the design first (link = what effect?).
- Keep it explicit and readable:
  - Link range ring
  - Visible link lines between towers
- Suggested initial linking designs (pick one, implement cleanly):
  - Support link: linked towers gain +X% fire rate or +range
  - Chain link: shots can jump to a second target within a short hop radius
  - Targeting link: one “controller” tower designates targets for linked towers

### 6) High-level enemy that attacks turrets while moving

Goal:

- At higher waves, introduce a new enemy archetype that damages towers on its path (adds base-defense pressure).

Implementation direction:

- Enemy type example: “Saboteur” / “Raider”
- Behavior:
  - While traversing path, periodically targets the nearest tower within attack radius
  - Deals damage to tower HP (requires tower health system)
- Balance guardrails:
  - Spawn only after a threshold wave (e.g., 25+)
  - Low frequency at first; scale slowly

### 7) Support structures for turret health (repair/heal/armor)

Goal:

- Once towers can be attacked, provide counterplay via support structures.

Implementation direction:

- Add tower HP baseline and damage/repair loops.
- Add support structures (distinct from towers):
  - Repair node: heals nearby towers over time
  - Shield/armor node: reduces incoming damage
  - “Link hub”: increases linking capacity or link range (if linking exists)

## Implementation notes

- Prefer adding new state as explicit scene fields (kept near other run-state).
- Prefer UI overlays built as Phaser Containers with depth above gameplay.
- Keep difficulty/name selection and game-over UI self-contained (avoid scattering checks across update loops).
- For persistence, use `localStorage` keys with a project prefix (e.g., `geeklabs_td_leaderboard_v1`).

## Known current issues / tuning watchlist

- Early wave feel: first wave should be survivable with a couple towers and not feel “spiky”.
- Wave pacing: intermission + SPACE skip should feel responsive and predictable.
- UI crowding: keep HUD readable; avoid overlapping playfield.
