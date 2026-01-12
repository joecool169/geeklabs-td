# GeekLabs-TD

GeekLabs-TD is a **fun-to-play tower defense game** developed as part of the GeekLabs sandbox.

The current focus is **gameplay and mechanics**, not graphics or visual polish.

## Project Vision

GeekLabs-TD exists as a mechanics-first tower defense project where ideas can be tested, refined, and iterated quickly. The goal is to build a tower defense experience that feels good to play before investing time into art, animation, or presentation.

A playable demo is currently hosted at <https://td.geekstreet.tv>

## Design Priorities

- Responsive and satisfying core gameplay
- Clear, readable mechanics
- Depth through systems rather than visuals
- Fast iteration and experimentation

Graphics are intentionally minimal at this stage so development effort can focus on balance, pacing, player decision-making, and replayability.

## Current Features

- Grid-based tower placement
- Path-based enemy movement
- Wave-based spawning with multiple enemy types
- Manual wave start/skip during intermission (SPACE)
- Automatic tower targeting and firing with selectable targeting modes
- Deterministic projectile system (no physics instability)
- Multiple tower types (Basic/Rapid/Sniper)
- Tower upgrades (Tier 1–3)
- Score system based on kills and economy
- Pause (P)

## Controls

- 1 / 2 / 3: Select tower type
- T: Toggle placement mode
- Left click: Place (when placing) / Select tower
- Right click: Cancel placement / Sell selected tower
- U: Upgrade selected tower
- X: Sell selected tower
- F: Cycle targeting mode
- SPACE: Start next wave immediately (during intermission)
- P: Pause / resume
- Esc: Cancel placement / deselect (and resume if paused)

## Tech Stack

- Phaser 3
- Vite
- JavaScript
- Static deployment via Nginx

## Development Philosophy

GeekLabs-TD is a homelab project:

- Mechanics first
- Visual polish later
- Small, controlled changes
- Frequent testing
- Easy to deploy and share builds for feedback

Once the gameplay foundation is solid, visual style, effects, audio, and UI polish will be layered in deliberately.

## License

See LICENSE.
