# GeekLabs-TD

GeekLabs-TD is a mechanics-first tower defense game developed in the GeekLabs sandbox. The playable game is titled **Defense Protocol**.

A live version is hosted at <https://td.geekstreet.tv>.

## Current direction

The project now has a coherent responsive desktop/laptop presentation and is moving through balance/progression validation before a staged mobile-readiness refactor.

Design priorities:

- long-form endless play
- gentle early onboarding
- gradually increasing strategic pressure
- readable tower/enemy roles
- meaningful choices among placement, buying, upgrading, and saving
- one Phaser/Vite core for web and a future native wrapper

## Current features

- responsive Phaser playfield with desktop and short-laptop layouts
- grid-based tower placement
- path-based enemy movement
- wave-based spawning with concurrent wave support
- Easy, Medium, and Hard modes
- Basic, Rapid, Sniper, and Laser towers
- tower upgrades, selling, and targeting modes
- Runner, Brute, and Armored enemy progression
- distinct tower, enemy, projectile, impact, health, and range visuals
- contextual placement and selected-tower sidebar panels
- local and optional global leaderboards
- start, pause, wave-state, and game-over presentation
- regression tests for progression milestones
- static deployment through Nginx

## Progression milestones

- Basic: wave 1
- Rapid: wave 10
- Sniper: wave 20
- Laser: wave 30
- Brutes begin: wave 20
- Armored enemies begin: wave 30

## Controls

- `1 / 2 / 3 / 4`: select a tower and enter placement mode
- `T`: toggle placement mode
- Left click: place or select
- Right click: cancel placement or sell selected tower contextually
- `U` or Shift-click: upgrade selected tower
- `X`: sell selected tower
- `F`: cycle targeting mode
- `Space`: start an available wave
- `P`: pause or resume
- `Esc`: cancel, deselect, or resume contextually

## Development commands

```bash
npm run dev
npm test
npm run build
npm run deploy
```

## Tech stack

- Phaser 3
- Vite
- modern JavaScript modules
- Node built-in test runner
- static Nginx deployment

## Development philosophy

- make one coherent change at a time
- verify visually and with tests/builds
- keep balance changes separate from structural refactors
- use playtest evidence before changing progression or tower value
- keep the web game free and evaluate a polished mobile edition later

## License

See `LICENSE`.
