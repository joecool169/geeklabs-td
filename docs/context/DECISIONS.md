# Decision Log

## 2026-07-26 — Verify all three deployment states before context work

**Decision:** Confirm Arch, GitHub, and the live server are synchronized before rebuilding project context.

**Result:** `HEAD`, `github/main`, and `origin/main` matched commit `465de15`; the working tree was clean; the build succeeded; and the built output matched production by checksum dry run.

## 2026-07-26 — Rebuild context as a portable ZIP

**Decision:** Use a `geeklabs-context.zip` workflow similar to the homelab project.

**Reasoning:** A portable bundle gives ChatGPT the current source plus human decisions, reducing reliance on stale prose and making work across devices more consistent.

**Constraint:** GitHub remains the code authority. The ZIP is not a backup or an alternative source-control system.

## 2026-07-26 — Include source files in the context bundle

**Decision:** Include tracked game source and project metadata, not only documentation.

**Reasoning:** The code is the most reliable evidence of implemented behavior and architecture. Documentation alone had already drifted behind the live game.

**Excluded:** `.git`, `node_modules`, `dist`, caches, logs, and generated artifacts.

## 2026-07-26 — Layout before major platform work

**Decision:** Refine the current page layout before beginning substantial iOS packaging work.

**Reasoning:** The current game is playable and coherent, but the desktop composition is left-heavy and state feedback needs improvement. The layout work should establish responsive patterns usable by mobile.

## 2026-07-26 — Refactor for mobile readiness, not for its own sake

**Decision:** Refactor in small, behavior-preserving stages with touch and platform separation as the architectural goal.

**Reasoning:** A broad earlier refactor attempt created risk. The next effort must have explicit boundaries, verification steps, and one coherent concern per commit.

## 2026-07-26 — One shared game core

**Decision:** Keep Phaser/Vite as the common web and mobile game implementation.

**Rejected direction:** Rewriting gameplay in Swift.

**Likely native approach:** Capacitor wrapper, subject to an early real-device proof of concept.

## 2026-07-26 — Free web, monetized mobile

**Decision:** Keep the web version freely playable and investigate monetizing the polished mobile version.

**Likely first model:** A free or limited mobile trial with one permanent non-consumable full-game unlock.

**Avoid initially:** subscriptions, energy systems, aggressive consumables, and balance-distorting monetization.

**Product test:** Monetization work should follow evidence that players complete sessions, restart, and return.
