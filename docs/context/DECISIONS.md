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

## 2026-07-26 — Preserve gentle early waves while building long-term pressure

**Decision:** Waves 1-3 should remain comfortable and usually leak-free for competent play. Difficulty should emerge gradually through density, composition, health scaling, economy tension, placement, upgrades, and tower counters rather than abrupt leak damage or early punishment.

**Reasoning:** Defense Protocol is intended to support long endurance runs. Early life loss should reflect poor decisions, not an onboarding difficulty spike.

## 2026-07-26 — Keep milestone progression at 1 / 10 / 20 / 30

**Decision:** Use the following current progression milestones:

- Basic: wave 1
- Rapid: wave 10
- Sniper: wave 20
- Laser: wave 30

**Reasoning:** The user wants unlocks to feel earned across a long-running game and did not want all specialist towers moved into the first twelve waves. Laser was moved from wave 40 to wave 30 to reduce an overly long late gap.

## 2026-07-26 — Align enemy threats with specialist availability

**Decision:** Keep waves 1-19 Runner-only, ramp Runner packs around Rapid's wave-10 unlock, introduce Brutes with Sniper at wave 20, and introduce Armored with Laser at wave 30.

**Reasoning:** Unlocks should teach counters. The player should not face a class-specific threat many waves before the intended answer is available.

## 2026-07-26 — Treat bottom cards as the primary tower selector

**Decision:** The bottom tower strip is the sole visible four-tower selector. The right sidebar is contextual: placement information while placing and management information while a tower is selected.

**Reasoning:** The former sidebar Build Menu duplicated the bottom controls, consumed height, and weakened hierarchy.

## 2026-07-26 — Stable sidebar height over document growth

**Decision:** Keep the sidebar at a stable height matching the responsive stage and use internal overflow only as a fallback.

**Reasoning:** Normal placement and tower-selection state changes must not increase document height or reintroduce page scrolling on a MacBook at 100% zoom.

## 2026-07-26 — Improve readability with primitives before adding art assets

**Decision:** Distinguish towers, enemies, attacks, impacts, health, and range coverage using Phaser-generated primitives and restrained tactical effects.

**Reasoning:** This materially improves playfield readability while preserving the mechanics-first direction and avoiding an asset pipeline before gameplay is settled.

## 2026-07-26 — One complete ZIP for repository and ChatGPT handoff

**Decision:** Use one complete `geeklabs-td-context.zip` as both the repository-import bundle and the context uploaded into the next ChatGPT conversation.

**Reasoning:** A single self-contained handoff mirrors the established homelab workflow, eliminates patch-versus-source confusion, and ensures the next conversation can inspect the exact source and documentation baseline.

**Workflow:** ChatGPT returns the completed bundle; the user extracts it over `~/projects/geeklabs-td`, reviews and commits the resulting changes, and uploads that same ZIP in the next conversation. The user does not regenerate the ZIP locally.

## 2026-07-27 — Use preparation windows for specialist counters

**Decision:** Keep Sniper at Wave 20 and move Brutes to Wave 22; move Laser to Wave 28 while Armored enemies remain at Wave 30.

**Reasoning:** A counter should be available before the threat it is intended to answer. Two preparation waves allow placement, saving, upgrading, and player learning.

## 2026-07-27 — Preserve fractional enemy rewards

**Decision:** Replace per-kill reward flooring with deterministic fractional carry tracked per enemy class and reset on a fresh game.

**Reasoning:** Integer flooring created a severe Wave-21 income cliff even while enemy pressure increased. Carry preserves integer payouts without discarding earned fractional value.

## 2026-07-27 — Define specialist roles explicitly without nerfing Basic

**Decision:** Leave Basic unchanged and establish matchup rules: Rapid against Runners, Sniper against Brutes, and Laser against Armored enemies.

**Reasoning:** Basic had become the only economically safe option. Specialists must outperform it in their intended matchups without becoming universally superior.

## 2026-07-27 — Preserve the coordinated rebalance as a checkpoint

**Decision:** Commit and document the coordinated balance pass even though the final Hard run indicates it likely went too far.

**Evidence:** Wave 35 was reached with 16 lives, $2,250, and 20 towers.

**Reasoning:** The pass solved structural role and progression defects and provides a stable baseline. Future work should isolate the largest source of excess difficulty reduction through controlled comparison rather than continue ad hoc tweaking.
