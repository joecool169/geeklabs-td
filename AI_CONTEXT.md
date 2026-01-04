# AI_CONTEXT

This file captures project-level context, conventions, and “current truth” so an assistant can help without re-deriving everything each session.

## Project
- Name: GeekLabs TD (geeklabs-td)
- Stack: Vite + Phaser (tower defense prototype)
- Style: grid-based placement on a fixed path; minimal clean UI; keyboard-forward controls

## Repo workflow
- Commit frequently (small, coherent commits).
- Push at the end of a session and before switching devices.
- Prefer SSH remotes for GitHub pushes.

## Current controls and UX

### Placement
- T: Toggle placement mode
- 1: Basic tower
- 2: Rapid tower
- 3: Sniper tower
- Left click (while placing): Place tower (only if valid)
- Right click (while placing): Cancel placement

Placement rules:
- Snap to grid
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

### UI
- Bottom-right inspector shows selected tower stats:
  - Type, Tier
  - Target mode
  - Damage, Fire (ms and shots/sec), Range, DPS
  - Next upgrade cost
  - Sell refund
- Inspector has clickable buttons:
  - Upgrade (U)
  - Sell (X)
  - Target (F)

## Tower system

### Tower types
- Basic: balanced baseline
- Rapid: faster fire, lower damage, shorter range (anti-swarm)
- Sniper: slower fire, high damage, long range (anti-tank)

Tower data is defined in a table (data-driven tiers), not hard-coded tier if/else.

### Targeting modes
- Close: nearest enemy by distance
- Strong: highest current HP in range
- First: furthest progressed along the path (by path segment index + distance to next waypoint)

### Economy
- Enemies grant money on kill
- Selling a tower refunds ~70% of total spent (base + upgrades)

## Current gameplay loop
- Place towers
- Select towers, upgrade them, sell/reposition
- Enemies spawn continuously; wave number increases over time

## Next planned improvements (priority order)
1) Improve discoverability for tower type switching (1/2/3) while placing (placement hint / one-time toast).
2) Add wave structure: start-wave button, intermission, finite wave size, scaling, pacing.
3) Add second enemy archetype (fast/weak vs slow/tanky) to make tower roles clearer.
4) Add projectile visuals per tower type and/or hit feedback.
5) Add basic sound cues (place, upgrade, sell, hit, kill).

## Notes
- Keep rings visible only for the selected tower (no hover rings).
- Keep UI uncluttered; prefer contextual hints that appear only in placement mode.
