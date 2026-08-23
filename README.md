# GeekLabs-TD

GeekLabs-TD is a mechanics-first tower defense game developed in the GeekLabs sandbox. The playable game is titled **Defense Protocol**.

A live version is hosted at <https://td.geekstreet.tv>.

## Current direction

The project now has an accepted Capacitor iOS foundation and a unified v0.7.0 command interface across desktop, iPhone, and iPad. The next product phase is release-candidate endurance testing, followed by onboarding or new content informed by playtest evidence.

Design priorities:

- long-form endless play
- gentle early onboarding
- gradually increasing strategic pressure
- readable tower/enemy roles
- meaningful choices among placement, buying, upgrading, and saving
- one Phaser/Vite core shared by web and the Capacitor iOS app

## Current features

- responsive Phaser playfield with desktop and short-laptop layouts
- grid-based tower placement
- path-based enemy movement
- wave-based spawning with concurrent wave support
- Easy, Medium, and Hard modes
- Basic, Rapid, Sniper, and Laser towers
- tower upgrades, selling, and targeting modes
- Runner, Sprinter, Brute, and Armored enemy progression
- distinct tower, enemy, projectile, impact, health, and range visuals
- contextual placement and selected-tower sidebar panels
- local and optional global leaderboards
- start, pause, wave-state, and game-over presentation
- regression tests for progression milestones
- seeded wave composition and automatic balance-run checkpoints
- final game-over telemetry snapshots, including partial failure waves
- explicit wave, tower, enemy, combat, projectile, run-state, input, UI, and platform-service boundaries
- touch controls with drag-to-aim placement, explicit confirmation, contextual tower actions, and guarded selling
- landscape iPhone/iPad and short-landscape browser layouts with safe-area support
- static deployment through Nginx

## Progression milestones

- Basic: wave 1
- Rapid: wave 10
- Sprinters begin: wave 15
- Sniper: wave 20
- Brutes begin: wave 25
- Laser: wave 30
- Armored enemies begin: wave 35

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

Touch devices use persistent Start Wave, Place, Cancel, and Pause controls. Tap a tower card, drag on the playfield to aim above your finger, and tap Place to confirm. Selecting a placed tower reveals Target, Upgrade, and two-step Sell actions.

## Project context

Forgejo is the authoritative repository and GitHub is a secondary mirror. The files under `docs/context/` capture current state, architecture, decisions, and roadmap details, while Git remains the source of truth. Portable ZIP exports are optional transport artifacts; see `docs/context/PORTABLE_EXPORT.md`.

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
