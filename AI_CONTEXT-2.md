## Current controls and UX

### Placement

- T: Toggle placement mode
- 1: Basic tower
- 2: Rapid tower
- 3: Sniper tower
- Left click (while placing): Place tower (only if valid) [1]
- Right click (while placing): Cancel placement [1]
- Esc:
  - If placing: cancel placement (same outcome as right click cancel)
  - Else if a tower is selected: clear selection
- While placing: placement hint shows selected tower + cost/range and reminds: (1/2/3: switch) (discoverability improvement)

Placement rules:

- Snap to grid (40px) [1]
- Cannot place on path [1]
- Cannot overlap an existing tower [1]
- Must have enough money for the selected tower type [1]

### Selection and actions

- Left click: Select tower (range ring shows only for selected) [1]
- Shift+Click on tower: Upgrade [1]
- U: Upgrade selected tower [1]
- X: Sell selected tower [1]
- Right click on tower: Sell selected tower [1]
- F: Cycle targeting mode (Close → Strong → First) [1]

### Pause

- P: Toggle pause
  - Pausing should freeze gameplay simulation and enemy spawning.
  - Intended to later become a pause menu (future UI), but for now is a simple toggle.

### UI

- HUD text currently sits near the top-left (money/lives/wave + controls/help text). This can feel crowded on smaller screens and overlaps the playfield.
- Bottom-right inspector shows selected tower stats [1]:
  - Type, Tier
  - Target mode
  - Damage, Fire (ms and shots/sec), Range, DPS
  - Next upgrade cost
  - Sell refund
- Inspector has clickable buttons [1]:
  - Upgrade (U)
  - Sell (X)
  - Target (F)

#### UI / layout goals

- Keep UI uncluttered; prefer contextual hints that appear only in placement mode. [1]
- Avoid crowding the game map, especially top-left HUD text.
- Prefer responsive UI anchoring (UI elements reposition on resize) over scaling gameplay coordinates.
  - Keep gameplay in a stable “logical” coordinate system so the 40px grid and path math remain consistent.
  - Re-anchor UI to corners/edges on resize (top-left, top-right, bottom-right, etc.).

Recommended near-term UI changes:
- Make the “help/controls” line toggleable (e.g., H to show/hide) or show it once per session.
- Consider moving HUD to top-right/top-center to reduce map overlap.
- Add a `layoutUI()` function and call it on create + resize to keep UI readable at different resolutions.

## Tower system

### Tower types

- Basic: balanced baseline [1]
- Rapid: faster fire, lower damage, shorter range (anti-swarm) [1]
- Sniper: slower fire, high damage, long range (anti-tank) [1]
  - Sniper towers should be visually distinct after placement (e.g., an “S” badge/marker).

Tower data is defined in a table (data-driven tiers), not hard-coded tier if/else. [1]

### Targeting modes

- Close: nearest enemy by distance [1]
- Strong: highest current HP in range [1]
- First: furthest progressed along the path (by path segment index + distance to next waypoint) [1]

### Economy

- Enemies grant money on kill [1]
- Selling a tower refunds ~70% of total spent (base + upgrades) [1]

## Current gameplay

- Grid placement (40px) [1]
- Enemies follow a fixed path [1]
- Towers auto-target and fire [1]
- Manual projectile logic (not Arcade overlap) [1]
- Enemies spawn continuously; wave number increases over time [1]

## Important implementation notes

- Use keyboard Shift state [1]:
  - `this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);`
  - check `this.keyShift.isDown` (pointer.shiftKey was unreliable)

- Input/UI structure (current code shape):
  - UI text elements are currently created at fixed pixel positions near the top-left in `scene.js` [2].
  - A future layout pass should centralize UI placement into a function (so resize/layout changes don’t get scattered).

## Next planned improvements (priority order)

1) Improve game layout / responsiveness
   - Reduce top-left UI crowding (toggle help text; move/anchor HUD; keep inspector bottom-right).
   - Add `layoutUI()` + resize handling for different resolutions.
   - Decide on approach:
     - Prefer responsive UI anchoring (recommended first), not full world scaling.

2) Add wave structure: start-wave button, intermission, finite wave size, scaling, pacing. [1]

3) Add second enemy archetype (fast/weak vs slow/tanky) to make tower roles clearer. [1]

4) Add projectile visuals per tower type and/or hit feedback. [1]

5) Add basic sound cues (place, upgrade, sell, hit, kill). [1]

## Completed / implemented recently

- Placement-mode discoverability:
  - Placement hint explicitly reminds 1/2/3 switching while placing.
  - One-time placement toast/hint on entering placement mode.

- Quality-of-life input:
  - Esc cancels placement and clears selection.
  - P toggles pause (simple pause for now; menu later).

- Visual clarity:
  - Sniper towers have an “S” marker so they’re easy to identify.

## Notes

- Keep rings visible only for the selected tower (no hover rings). [1]

## Future candidates (lower priority / exploratory)

- Tower combining [1]
- Interest-based economy [1]
- Enemy resistances [1]
