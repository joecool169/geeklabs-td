# Decision Log

## 2026-08-26 — Keep machine-specific deployment details out of Git

**Decision:** Track only a generic deployment configuration example. Store the
actual SSH host alias and remote checkout/stack paths in
`scripts/deploy.local.env`, which is ignored by Git and loaded by the deployment
script when present.

**Reason:** These values are not credentials, but publishing them provides
unnecessary infrastructure and workstation detail. Keeping them local preserves
the existing deployment flow without placing operational defaults in the public
repository.

**Constraint:** The deploy script must fail closed with a clear message when the
required values are absent. Credentials and tunnel tokens remain outside both
the tracked example and the ignored project-local file.

## 2026-08-26 — Separate the public-site and game repositories

**Decision:** Keep the shared Phaser/Capacitor game core in `geeklabs-td` and
maintain marketing, support, privacy, guide, updates, credits, leaderboard API,
gateway, and deployment definitions in a separate `geeklabs-site` repository.

**URL model:** Use `geeklabs.io` for the durable company and product presence,
`www.geeklabs.io` as a redirect, and `play.geeklabs.io` exclusively for the
playable build. Keep player and App Store resources under stable paths on the
root domain rather than creating a premature documentation subdomain.

**Reason:** Public policy and support content can change independently of game
releases, while the game repository remains focused on the shared runtime.

## 2026-08-26 — Use Cloudflare Tunnel as the only public ingress

**Decision:** Run the game, public site, gateway, and leaderboard as containers
on a dedicated game VM. Cloudflare Tunnel connects to the Nginx
gateway over the private Docker network; web ports do not need to be published
on the VM's LAN interface.

**Routing:** The gateway sends `geeklabs.io` to the public site and
`play.geeklabs.io` to the game, except `/api/*`, which goes to the leaderboard
service. This preserves the existing same-origin browser contract.

**Operations:** Firewall, SSH, and broader VM hardening remain a separate future
phase. The tunnel token is a secret stored outside Git.

## 2026-08-26 — Keep the initial leaderboard intentionally small

**Decision:** Use a minimal same-origin API backed by SQLite for optional global
scores. Store the submitted player name, difficulty, score, wave, kills, and
operational timestamps needed by the service.

**Data handling:** Disclose submitted score data and relevant server/Cloudflare
logs in the privacy policy. Maintain nightly same-VM database backups now, then
add an off-host or Proxmox-level backup before treating the service as durable.

**Constraint:** The first version is trust-based and does not claim competitive
anti-cheat, account identity, or client attestation.

## 2026-08-26 — Deploy the game from a reviewed Forgejo revision

**Decision:** Keep Forgejo authoritative and GitHub as a public mirror. The game
deploy command requires clean reviewed `main`, validates locally, pushes the
exact commit to Forgejo, fast-forwards the VM checkout, rebuilds only the game
container, refreshes the gateway, and checks the public game and API.

**Mirror rule:** The production command does not push GitHub. Mirror the same
reviewed commit explicitly after deployment so a GitHub outage cannot block the
production path.

**Evidence rule:** A repository push is not deployment proof. Record the
revision verified by the deploy and independently check the public endpoints.

## 2026-08-23 — Complete the first-pass production graphics system

**Decision:** Extend the approved industrial–sci-fi direction to Rapid/Sprinter, Sniper/Brute, and Laser/Armored, then release the result as v0.10.0 without changing accepted balance.

**Implementation model:** Every tower family uses a stationary production base and tier-specific centered weapon heads. All heads track targets, and projectiles, tracers, and beams originate from class-appropriate muzzle positions. Every enemy class uses directional bitmap art plus deterministic low-amplitude movement and damage-state feedback.

**Readability model:** Keep full combat feedback through 36 active enemies, reduce high-frequency Rapid/Laser impacts from 37–60, and suppress optional transient effects above 60 while limiting health bars to meaningfully damaged units. The deployment gate and route hardware are presentation-only and do not consume legal placement tiles.

**Next gate:** Validate late-wave heat, battery use, touch selection, and visual density on physical iPhone and iPad before treating the mobile build as an App Store release candidate.

## 2026-08-23 — Give defense and targeting visible physical meaning

**Decision:** Represent the defended objective with a command core beyond the route endpoint, and split Basic towers into stationary foundations plus rotating weapon heads.

**Implementation model:** The command core is presentation-only and reflects integrity through restrained tint and impact effects. Basic targeting rotates only the orthographic weapon head; the perspective-sensitive base remains stationary, and shots originate at the barrel tip.

**Constraint:** Preserve accepted balance, path geometry, collision, targeting, and economy values. Every new bitmap retains a generated fallback.

**Placement refinement:** Center the command core on the existing terminal path node so its footprint does not consume or overlap a legal placement tile. Anchor every layered tower component to its mechanical neck rather than its bitmap bounds.

## 2026-08-23 — Adopt the industrial–sci-fi visual identity

**Decision:** Establish the production art direction with one complete Basic-versus-Runner vertical slice before replacing the remaining procedural units.

**Visual model:** Dark welded steel and facility infrastructure establish the industrial world; controlled cyan, green, amber, magenta, and signal-red emissions communicate gameplay roles. Large silhouettes outrank surface detail at mobile scale.

**Implementation model:** Load transparent bitmap art under the existing texture identities and preserve generated geometric textures as automatic fallbacks. Use static unit sprites plus short-lived Phaser effects rather than frame-heavy animation.

**Next gate:** Validate v0.8.0 in late waves on physical iPhone and iPad, then extend the style in paired specialist/threat slices without changing accepted balance values.

## 2026-08-23 — Release v0.7.0 unified command interface

**Decision:** Replace the incremental browser/mobile presentation with one compact command-HUD system across desktop, iPhone, and iPad while preserving the accepted balance and architecture.

**Interaction model:** Expose tower roles, unlocks, affordability, placement status, and selected-tower actions directly in the command deck. Keep touch selection forgiving, confirm it visually, and exit placement after each successful build.

**Presentation model:** Use shared tactical panels for start, pause, help, and game over; keep all supported landscape layouts inside the viewport; and limit motion to short confirmation transitions with a reduced-motion fallback.

**Next gate:** Complete measured battery/thermal endurance, force-quit restoration, and a late-wave v0.7.0 session before App Store preparation.

## 2026-08-23 — Adopt landscape-only mobile interaction polish

**Decision:** Support landscape left and right on iPhone and iPad, with the iOS full-screen compatibility preference enabled. Keep the shared web layout responsive, but treat portrait as unsupported in the native app.

**Touch model:** Exit placement after each successful build, taper the above-finger aiming offset near the bottom edge so every grid row remains reachable, and expose compact selected-tower damage, range, rate, and DPS stats.

**Presentation model:** Use a compact, non-scrolling pause menu on short landscape screens and modestly widen the touch stage on large iPads while preserving safe areas and vertical fit.

**Platform note:** `UIRequiresFullScreen` preserves compatibility behavior on older supported iPadOS releases. iPadOS 26 may present the app as a fixed-size compatibility window under its newer windowing system.

## 2026-08-23 — Release v0.6.0 presentation polish

**Decision:** Release the accepted Capacitor foundation and presentation-polish slices together as v0.6.0 while preserving all v0.4.0 balance values.

**Presentation model:** Use a compact high-contrast HUD, explicit tower affordability and unlock states, grouped 48px touch controls, restrained placement/upgrade pulses, coordinated unlock feedback, and reduced light-enemy health-bar noise during dense waves.

**Audio model:** Respect iOS Silent Mode, unlock Web Audio from DOM or canvas gestures, keep a persistent in-game sound control, and rate-limit repeated kill feedback.

**Next gate:** Complete measured battery/thermal endurance and force-quit preference restoration on the release candidate before broader mobile distribution.

## 2026-08-23 — Accept the iOS proof of concept

**Decision:** Accept the Capacitor 8 shell as the mobile-development foundation and proceed to presentation polish without changing the shared Phaser game core or accepted balance.

**Evidence:** The signed app builds, installs, and launches on an iPhone 17 Pro Max. Touch play reached Wave 54 on Easy with 37 towers and 40 active enemies without a reported interaction or frame-pacing blocker. Physical-device audio activation and the persistent sound control pass; Simulator safe-area, orientation, lifecycle pause, and native-preference checks pass.

**Release follow-up:** Keep a measured battery/thermal endurance run and final force-quit restoration audit in the release-candidate gate. They are not blockers for continuing product work.

## 2026-08-23 — Establish the Capacitor iOS boundary

**Decision:** Use a minimal Capacitor 8 iOS shell with the existing Phaser/Vite bundle as the only game core. The native runtime is isolated under `src/platform/`.

**Lifecycle:** When iOS makes the app inactive, pause any active run. Returning to the app refreshes canvas sizing but requires the player to resume explicitly, preventing unseen simulation progress.

**Persistence:** Keep the synchronous browser storage contract and mirror `defense_protocol_*` values to Capacitor Preferences. Browser values win when present; Preferences restores them when WebKit storage is missing.

**Validation status:** Project generation, native sync, tests, audit, shared-web smoke checks, Xcode compilation, Simulator launch, touch placement, orientation, safe areas, and background pause pass. Real-device signing, audio, persistence, heat, and dense-wave testing remain mandatory before accepting Capacitor for the mobile edition.

## 2026-08-23 — Ship the touch-ready browser surface

**Decision:** Release touch controls as v0.5.0 while preserving desktop controls and all accepted balance values.

**Interaction model:** Tower cards enter placement, touch dragging aims a ghost above the finger, and a Place button confirms. Placed towers expose contextual Target, Upgrade, and two-step Sell actions. Start/Add Wave, Cancel, and Pause/Resume remain persistently available.

**Layout model:** Portrait/tablet layouts use a horizontal tower strip; short landscape layouts place controls beside the playfield. Safe-area insets and viewport-level overlays are mandatory.

**Next phase:** Use this browser-validated touch surface for an early Capacitor build on a real iPhone.

## 2026-08-22 — Complete the behavior-preserving architecture refactor

**Decision:** Release the staged refactor as v0.4.1 without changing the accepted v0.4.0 balance.

**Result:** Final partial-wave telemetry now persists at game over. Run state, semantic input, overlays, browser services, world rendering, towers, enemies, projectiles, combat, waves, and HUD presentation have explicit owners. Each slice was independently tested and committed.

**Next phase:** Build touch controls on the semantic action layer, then use that browser-validated surface for an early Capacitor iOS proof of concept.

## 2026-08-22 — Accept v0.4.0 specialist progression

**Decision:** Accept the five-wave specialist progression and preferred-targeting balance without another tower-stat adjustment, and release v0.4.0.

**Evidence:** Under the same `specialists-v0.4.0` seed on Hard, Basic-heavy failed on Wave 46 while mixed specialists failed on Wave 54. First leak moved from Wave 40 to Wave 48. At Wave 45, mixed specialists retained 20 lives with $8,895 invested while Basic-heavy had 9 lives with $8,975 invested. Rapid led specialist contribution with 492,150 damage and 1,216 kills through that checkpoint.

**Follow-up completed in v0.4.1:** The v2 archive now retains the final partial-wave state at game over.

## 2026-08-22 — Establish five-wave specialist preparation windows

**Decision:** Use Rapid 10 / Sprinter 15 / Sniper 20 / Brute 25 / Laser 30 / Armored 35.

**Decision:** Rapid, Sniper, and Laser default to Sprinter, Brute, and Armored priority respectively. Preferred modes target the intended class furthest along the path, fall back to First, and remain part of manual targeting cycles.

**Reasoning:** Seeded Hard comparisons showed only a one-wave advantage for specialist investment, while the intended product goal is to support longer endurance runs. Explicit threats and automatic-but-overridable priorities make each counter teachable and practically usable without nerfing Basic or reducing the economy.

**Supersedes:** Earlier progression decisions placing Brutes at Waves 20 or 22, Laser at Wave 28, and Armored at Wave 30.

## 2026-08-22 — Make Forgejo authoritative and retire mandatory ZIP handoffs

**Decision:** Forgejo is the authoritative repository. GitHub remains a secondary mirror and receives the same reviewed commits and tags for now.

**Decision:** Git is the sole source of truth. Portable ZIPs are optional transport artifacts for situations where repository access is unavailable; they are not authoritative snapshots or a required completion artifact.

**Reasoning:** Direct repository access preserves history, avoids a second potentially stale project copy, and makes the inspected commit explicit.

**Supersedes:** The mandatory ZIP workflow decisions dated 2026-07-26. Those entries remain below as historical context.

## 2026-08-22 — Defer deployment until balance calibration is reviewed

**Decision:** Preserve and tag the coordinated balance checkpoint, run controlled mixed-specialist and Basic-heavy comparisons locally, make one evidence-based correction, and deploy the reviewed revision rather than the known-overpowered checkpoint.

**Deployment rule:** Deploy only a clean committed revision, then verify local and production contents with an rsync checksum dry run.

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
