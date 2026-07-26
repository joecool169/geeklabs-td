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

## Verified baseline

- Baseline date: 2026-07-26
- Verified commit: `465de15`
- Branch: `main`
- `HEAD`, `github/main`, and `origin/main` were verified at the same commit.
- Working tree was clean.
- `npm run build` succeeded.
- A checksum-based rsync dry run showed the generated `dist/` matched the live server.

The source files in this bundle were exported from that verified repository state.

## Current priorities

1. Refine the desktop layout and make the page composition responsive.
2. Refactor in small, behavior-preserving stages rather than attempting another broad rewrite.
3. Separate gameplay commands from keyboard/mouse specifics so touch controls can use the same actions.
4. Make mobile readiness the target of the refactor.
5. Create an early Capacitor/iOS proof of concept before the entire game is considered finished.
6. Keep the web version free and explore a polished mobile edition with a one-time permanent unlock.

## Operating rules

- Inspect the current source before making claims about implementation.
- Do not treat old roadmap items as unimplemented without verifying the code.
- Keep changes small, coherent, and independently testable.
- Do not combine architectural refactors with balancing or gameplay changes unless explicitly approved.
- Preserve data-driven tower tiers and enemy definitions.
- Preserve deterministic/manual projectile hit handling.
- Keep tower range rings visible only for the selected tower.
- Prefer contextual UI over permanently visible clutter.
- Do not perform a Swift rewrite; the intended direction is one Phaser/Vite game core with a native wrapper.

## Authoritative context files

- `docs/context/CURRENT_STATE.md` — implemented features and known current condition
- `docs/context/WORKFLOW.md` — ChatGPT, Codex, Git, test, build, deploy, and bundle workflow
- `docs/context/ARCHITECTURE.md` — current structure, technical debt, and approved target direction
- `docs/context/ROADMAP.md` — near-term sequencing and later backlog
- `docs/context/DECISIONS.md` — dated decisions and rationale

## Existing exploratory material

`CONTEXT_IDEAS.md` remains non-binding. It contains late-game design possibilities, not committed plans.
