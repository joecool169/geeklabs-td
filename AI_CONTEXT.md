# GeekLabs-TD AI Context

This file is the entry point for assistants working on **Defense Protocol / GeekLabs-TD**.
Read this file first, then consult the focused files under `docs/context/`.

## Project identity

- Game: Defense Protocol
- Repository/project: GeekLabs-TD
- Stack: Phaser 3.90 + Vite 7 + modern JavaScript modules
- Production URL: `https://td.geekstreet.tv`
- Primary project directory on Arch: `/home/joe/projects/geeklabs-td`
- Production host: `joe@192.168.7.25`
- Production web root: `/opt/docker/stacks/nginx-static/html/td/`

## Current working baseline

- Session date: 2026-07-26
- Branch: `main`
- The session's reviewed changes were committed and pushed in small coherent commits.
- The repository had a clean working tree after the progression-alignment commit.
- `npm test`, `npm run build`, and `git diff --check` passed for the latest progression work.
- This bundle was created from the complete clean `HEAD` archive uploaded after the progression-alignment commit.
- Production deployment uses `npm run deploy`; deployment remains separate from the complete-bundle workflow.

## Implemented during the 2026-07-26 refinement session

### Responsive page layout

- The complete stage-plus-sidebar composition centers on wide desktop viewports.
- A compact short-laptop rule makes the full interface fit a MacBook browser at 100% zoom.
- Page CSS was moved from `index.html` into `src/style.css`.
- Repeated layout dimensions and scales were centralized as CSS custom properties.
- The sidebar now has a stable height with internal overflow as a fallback rather than growing the page.

### UI hierarchy and interaction

- Bottom tower cards now have clearer title, description, cost/unlock, shortcut, selected, focus, hover, and locked states.
- Locked cards remain readable without appearing interactive.
- The duplicated sidebar build selector was replaced with a compact placement-context panel.
- Placement context shows selected tower, cost, range, live valid/blocked state, and cancel/place instructions.
- Selected-tower details were compacted into a readable stats grid with immediately accessible target, upgrade, and sell controls.
- Wave-ready, wave-start, active-wave, wave-complete, pause, and game-over messaging were clarified.
- The game remains endless; no victory state was invented.

### Playfield presentation

- Tower types now have distinct primitive-rendered silhouettes: Basic, Rapid, Sniper, and Laser.
- Enemy classes now have distinct silhouettes and compact damage-state health indicators.
- Selected/placement range displays use a thin boundary and subtle translucent coverage fill.
- Basic, Rapid, Sniper, and Laser attacks now have distinct visual signatures and restrained hit feedback.
- Rendering refinements did not change hitboxes, placement, targeting, damage, timing, pathing, or balance.

### Pressure, economy, and progression

- Waves 1-3 remain the gentle onboarding target.
- Post-wave-3 enemy density and cadence pressure were added.
- Enemy HP gains a midgame ramp and post-wave-12 endurance compounding.
- Bounties taper after onboarding and clear-bonus growth slows after wave 12.
- Concurrent spawners now scale enemies from each spawner's actual wave number.
- Progression is now:
  - Basic unlock: wave 1
  - Rapid unlock: wave 10
  - Sniper unlock: wave 20
  - Laser unlock: wave 30
- Waves 1-19 are Runner-only.
- Runner pack pressure ramps during waves 10-15 to establish Rapid's role.
- Brutes begin at wave 20 and ramp gradually alongside Sniper availability.
- Armored enemies begin at wave 30 and ramp gradually alongside Laser availability.
- Progression regression tests were added and `npm test` now runs Node's built-in test runner.

## Current priorities

1. Playtest Hard through at least waves 22-30 using the new progression.
2. Confirm waves 1-3 remain comfortable and wave 10 makes Rapid useful without an unfair spike.
3. Confirm Brutes appear at wave 20 and make Sniper worthwhile.
4. Confirm Armored enemies appear at wave 30 and make Laser worthwhile.
5. Track lives, money, tower mix, upgrades, peak enemies alive, and the first wave where Basic-only play falls behind.
6. Tune specialist value only from playtest evidence; do not immediately move unlock milestones again.
7. Continue toward semantic input and mobile readiness only after the current gameplay/UI baseline is documented and stable.

## Operating rules

- Inspect current source before making claims about implementation.
- Do not treat old roadmap items as unimplemented without verifying the code.
- Keep changes small, coherent, and independently testable.
- Do not combine architectural refactors with balancing or gameplay changes unless explicitly approved.
- Preserve data-driven tower tiers and enemy definitions.
- Preserve deterministic/manual projectile hit handling.
- Prefer contextual UI over permanently visible clutter.
- Keep early waves gentle; add strategic pressure through workload, composition, economy, and counters rather than abrupt leak damage.
- The intended long-term progression currently uses milestones at waves 1, 10, 20, and 30.
- Do not perform a Swift rewrite; the intended direction remains one Phaser/Vite game core with a native wrapper.

## Authoritative context files

- `docs/context/CURRENT_STATE.md` — implemented features and current condition
- `docs/context/WORKFLOW.md` — ChatGPT, Codex, Git, test, build, deploy, and bundle workflow
- `docs/context/ARCHITECTURE.md` — current structure, technical debt, and approved target direction
- `docs/context/ROADMAP.md` — near-term sequencing and later backlog
- `docs/context/DECISIONS.md` — dated decisions and rationale

## Complete bundle workflow

- The authoritative handoff filename is `geeklabs-td-context.zip`.
- One complete ZIP updates the repository and can be uploaded directly into the next ChatGPT conversation.
- Extract it over `~/projects/geeklabs-td`, review, stage with `git add -A`, commit, and push.
- Do not regenerate a ZIP after ChatGPT supplies the completed bundle.
- See `docs/context/WORKFLOW.md` for the exact workflow.

## Existing exploratory material

`CONTEXT_IDEAS.md` remains non-binding. It contains late-game design possibilities, not committed plans.
