# Current State

## Latest Apple status — September 22 resubmission

Version **1.0 (4)** is **Waiting for Review**, verified live after authorized
resubmission. Manual release remains enabled. Physical launch/rendering passed
on both devices, and Joe confirmed gameplay, sound, and background/resume.
Upload source: `ios/v1.0-build-4` at `e5d84fc`. No public release or web deploy.
This supersedes the earlier pending-device/upload notes below. See
[review record](../app-store/REVIEW-2026-09-22.md).

- Snapshot date: **2026-09-22**
- Branch: **`main`**
- Current web release: **Relay Yard update (`9fecd09`); UI version `v0.10.0`**
- Preserved balance baseline: **`v0.3.0-balance-checkpoint`**

This is the volatile operational snapshot. Architecture, historical rationale,
and longer-term work live in the other documents linked from the
[context index](README.md).

## iOS App Review crash fix — September 22, 2026

- Live Apple status: 1.0 (3) **Rejected** for launch crash on iPad Air 11-inch
  (M3), iPadOS 27.0. Both reports identify the missing UIKit scene lifecycle.
- The native fix originated at `e5d84fc` on `codex/release-ios-1.0` and is ported
  to main. No Relay Yard feature changes entered the frozen iOS branch.
- Signed archive `ios/Archives/DefenseProtocol-1.0-4.xcarchive` passes signature
  verification; its 45 packaged public/gameplay files exactly match build 3.
- 91 release-branch tests and native builds pass. Matching-model iPadOS 27
  simulator reproduces the old failure and verifies corrected launch/rendering,
  background pause and force-quit settings retention.
- Physical-device acceptance is pending: iPhone installation succeeded but its
  screen was locked; iPad connection timed out. Build 4 is not uploaded or
  resubmitted. Manual release remains selected; no production deployment.
- See [review evidence](../app-store/REVIEW-2026-09-22.md). This supersedes older
  Waiting for Review status below.

## Relay Yard web deployment — 2026-09-20

- Owner authorized live deployment. Game source `9fecd09` was merged into main
  and deployed using `npm run deploy`; all 95 tests and the production build pass.
  Release tag: `web/v0.10.0-relay-yard-20260920`.
- Companion site/API deployed first at `140190a` (same tree as local `6c75349`).
  Live database backup `pre-relay-yard-20260921.sqlite3` is in the VM leaderboard
  backup directory and passes quick_check. Migration retains all 16 original
  rows unchanged as `classic`; live database quick_check passes.
- Public API confirms separate classic and Relay Yard boards. Public website
  map selector works. Browser entered Relay Yard with online submission off;
  no test score posted and no browser errors observed.
- Served JS `index-JOKqZrN_.js` and CSS `index-C4xXH-Eo.css` match local production
  artifacts byte for byte. JS SHA-256:
  `0f2f64a79fd102c8c12850b4c9ad95cda9fa92c339cdd147c3850eb9f4660c84`.
- iOS stabilization branch `codex/release-ios-1.0` now points to recorded build-3
  source `87e4715` on Forgejo and GitHub. No native build/sync/archive, App Store
  change, or new native feature release occurred. Full-run map balance testing
  remains future web playtesting work.

## Relay Yard implementation and pre-release validation — 2026-09-20

- Added the approved broad S route with three passes, two bends, two concrete
  platforms, and blue-green industrial scenery. Defense Grid remains available.
  Both routes are 3,260 pixels; tower balance and waves are unchanged.
- Setup offers route previews, map and difficulty selection, and remembered map.
  Replay retains the map; change-map returns to setup. HUD, results, local
  standings, and telemetry identify the map. Old local scores retain their keys.
- Online Relay Yard reads/submissions require the server to confirm map support;
  an older server cannot silently mix them into Defense Grid standings.
- Companion site/API work is in the Mac `geeklabs-site` repository on
  `codex/relay-yard-leaderboards`. It adds a default-classic database migration,
  per-map retention and filtering, and a public leaderboard map selector.
- Release order: back up the live leaderboard database, deploy/review the
  compatible API and site, then deploy the game candidate. At candidate preparation, no live or native changes were made. The authorized
  web deployment is recorded above.
- Validation: 95 game tests and production build; companion site build, 9
  rendered-page checks, and 5 API tests including legacy-schema migration,
  map/difficulty isolation, invalid maps, and per-map score retention.
- Local browser checks: route rendering, tower placement, remembered selection,
  replay, and map switching. Landscape phone menu fits at 844×390; this is browser
  validation, not physical iOS validation or a full-run balance acceptance test.

## Read-only VM audit — 2026-09-20

Follow-up tasks: [VM maintenance checklist](VM_MAINTENANCE.md). Audit only;
no packages, services, firewall, SSH settings, or backups were changed.

- Confirmed VM 108 on WorkLab Proxmox node hpe-pve2; 2 vCPUs, 4 GB configured
  RAM, 60 GB disk. Ubuntu 26.04.1; running kernel 7.0.0-30-generic.
- Website, game, and leaderboard returned HTTP 200. Containers healthy; no
  failed systemd units or broken package state. Time synchronized. Disk 29%
  used with about 40 GB available; roughly 2.3 GB memory available.
- Docker, Compose, Git, Python, SQLite, curl, compression/archive utilities,
  rsync, user-local Node 22/npm, and QEMU guest agent are present.
- Nightly leaderboard backup succeeded September 20 at 03:20 UTC. Live database
  quick-check passed. Latest gzip backup decompressed and passed SQLite
  quick-check in memory after normalizing WAL header flags in the validation
  copy only. Original backup unchanged; no full restore test performed.
- Backup script retains daily database snapshots locally for roughly 31 days.
  Proxmox cluster backup job list was empty; no VM 108 backup appeared in the
  host's configured backup storage. Off-VM recovery coverage remains unverified.
- UFW inactive; Proxmox firewall status disabled/running. VM input policies
  default ACCEPT with Tailscale rules. SSH listens on all IPv4/IPv6 interfaces,
  accepts passwords, permits root keys (not root passwords), and allows
  unrestricted passwordless sudo for joe. Upstream exposure was not audited.
- SSH key/authorized-key permissions restricted; tunnel token permissions
  restricted and mounted read-only. No token contents exposed. SSH logs showed
  zero failed-password/invalid-user events in the preceding seven days; this
  is not a compromise assessment.
- Containers publish no host web ports, are not privileged, and use
  no-new-privileges plus rotated logs. Most roots are read-only; leaderboard and
  tunnel run as non-root. No explicit container memory/process limits found.
- Automatic updates active; package lists refreshed that day. 22 updates pending,
  including Docker components, networking packages, and Tailscale. Reboot required
  for installed kernel 7.0.0-31 and system-library updates.
- Persistent priority-2500 LAN route rule present and LAN routing correct.
  About 5 GB build cache reclaimable; cleanup optional. External alert coverage
  and container vulnerability status were not comprehensively verified.

## Verified web catch-up deployment — 2026-09-20

- Owner authorized bringing the live web game up to date. Deployed reviewed
  commit `da828e114edbe3d8a7188099d5415572c67984d5` through the existing script.
  Release tag: `web/v0.10.0-20260920`. The UI version remains v0.10.0.
- Shared change since the previous web release: corrected tower head/base
  mounting across all four tower types, upgrades, previews, and Basic fallback
  rendering. Gameplay balance, waves, scoring, and leaderboard contract unchanged.
- Platform review: Docker excludes the iOS tree. Privacy manifest, signing,
  native version/build settings, and orientation configuration remain iOS-only.
  Native preference mirroring and lifecycle listeners are guarded by
  `isNativePlatform()` and remain inactive in the browser. Web mouse/keyboard
  and responsive touch controls remain available.
- All **91 tests** and the production build passed. VM checkout matched the
  requested commit. Game and gateway became healthy; leaderboard remained healthy.
- Public JavaScript `index-B6Md-UYt.js` and CSS `index-D4B_JORn.css` match the
  validated local build byte for byte. Main JS SHA-256:
  `465c43245eec81ddf74a90b5204edcd8f4a20fc10fd21161e317ec394b6d6a8b`.
  Running image:
  `sha256:7068f5b716d9024310ad04e3d82ac2e83e3bade8995e6be64c834c7ce4c9eee0`.
- Public leaderboard GET succeeded. Browser menu and game entry passed with
  online submission disabled; no test score submitted. This was a smoke check,
  not a new full-length playtest or physical-device acceptance run.
- Live Apple check: iOS version 1.0, build 3 is **Waiting for Review**;
  manual release remains selected. No Apple settings or submission changed.
- Subsequent documentation commits do not change this deployed revision.

## Release direction — 2026-09-20

Features and updates will be validated on the web before later App Store
releases. The web game is expected to remain free and open source. Read
[RELEASE_STRATEGY.md](RELEASE_STRATEGY.md) for the recommended branch/tag
workflow and the existing, unimplemented mobile monetization proposal.

## Remote development handoff — 2026-09-20

- The Mac remains the primary complete workspace by owner preference. Optional
  remote development is ready on `geeklabs-td` in a separate checkout at
  `/home/joe/projects/geeklabs-td-dev`. The existing
  `/home/joe/projects/geeklabs-td` remains the production deployment checkout.
- Remote validation: Node 22.23.2, clean `npm ci` with zero reported
  vulnerabilities, all 91 tests passed, production build passed. Forgejo
  push dry-run succeeded. GitHub fetch works; direct server push setup is pending.
- Read [REMOTE_DEVELOPMENT.md](REMOTE_DEVELOPMENT.md) for setup, Mac-only
  artifacts, service boundaries, and outstanding access checks.
- Latest recorded Apple status: version 1.0 build 3 submitted September 18;
  manual release selected. Live check September 20 confirms **Waiting for Review**
  with build 3 selected and manual release enabled.
  See [readiness](../app-store/READINESS.md) and the final sections of
  [preparation](../app-store/PREPARATION-2026-09-17.md).
- Older entries below are dated historical evidence. The September 11 release
  record supersedes the August deployed revision; the September 18 submission
  supersedes older “not submitted” statements. A fresh Git checkout is not
  proof of a newly deployed game image.

## iPad gameplay acceptance — 2026-09-12

- Owner reports reaching Wave 66 in approximately 30 minutes (duration is an
  estimate), using 7 percentage points of battery, with testing otherwise good.
- The reported turret appearance defect is addressed in the local correction
  below. The owner accepted the installed turret correction on 2026-09-12.
- This is user-reported gameplay acceptance, not instrumented thermal or frame
  timing data, and does not establish separate force-quit persistence checks.

## Accepted turret alignment correction — 2026-09-12

- The owner reported Basic heads appearing detached during an iPad run.
  Inspection found the sprite origins were ahead of the receivers. Rapid,
  Sniper, and Laser also used image-center origins despite asymmetric artwork.
- Added per-tier head mount coordinates and corrected base mount coordinates
  in the shared art standards. Placed towers, upgrades, and placement previews
  consume the same origins. Basic procedural fallback mounting follows them.
- Rendered all four types at all three tiers and eight angles (96 views).
  Heads remain seated in the corrected visual review. All 91 tests, web build,
  native sync, and signed device build pass. Gameplay values are unchanged.
- With owner approval after the playtest, installed over the existing iPad app
  and launched successfully on 2026-09-12. The owner then confirmed that the
  turret looks good, accepting the visual correction.
  The correction was subsequently deployed to web on September 20; see above.

## Mobile branding release — 2026-09-11

- Owner accepted iPhone gameplay after a 30-minute Hard run to Wave 66, 5,354
  kills, and 86,896 score. Battery fell from 59% to 54%; no heat, stuttering,
  or control issues were reported. This was before the menu branding update.
- Full original logo selected for the iOS icon. Landscape menus now use a
  dedicated logo column alongside controls. Browser checks at 956×440,
  667×375, 1366×1024, and 1440×900 show no base-menu clipping; expanded
  results scroll on the smaller phone. All 91 tests and signed device build pass.
- Game revision `7bf5fb0` deployed successfully to production on 2026-09-11.
  The deployment verified the VM revision and healthy game/gateway containers.
  Direct HTTPS checks passed for the game and leaderboard; served JavaScript
  and CSS match the locally verified build byte for byte.
- The branded native build installed and launched successfully on the iPhone.
  It has not been submitted to Apple. New menu acceptance on physical devices
  remains pending. Subsequent documentation commits do not change the running
  game revision above.

## Repository and validation

- Forgejo is authoritative; GitHub mirrors reviewed revisions for public access.
- The production game image was built from `3817ef3` and deployed on 2026-08-28,
  including immediate wave buttons, replay fixes, wave previews, escape reports,
  and touch readability improvements. Balance values are unchanged.
- `npm test` passes with **86 tests**.
- `npm run build`, `npm audit`, and `git diff --check` pass.
- The v0.10.0 release preserves the accepted v0.4.0 balance and v0.7.0 command
  interface while completing the first-pass production graphics system.

### Deployment verification — 2026-08-28

- `npm run deploy` completed for `3817ef3`; the VM checkout matched that revision.
- Game and gateway containers reported healthy after recreation/restart.
- Running game image: `sha256:9a77f327f61239ad2ff34fe6698963fe7269ba6fbad148a2ccabd8182ec711ef`.
- Public HTML, JavaScript, CSS, and leaderboard JSON returned successfully.
  Public JS/CSS bytes matched the locally validated production build.
- Browser startup at `play.geeklabs.io` rendered the new `NEXT W1 • 11 Runner`
  preview and setup controls. No test score was submitted.
- A later documentation-only commit records this deployment; it does not change
  the running game image or the physical iPhone/iPad installations.

## Live product

- Game: <https://play.geeklabs.io>
- Main site: <https://geeklabs.io>
- Player guide: <https://geeklabs.io/guide/defense-protocol>
- Support: <https://geeklabs.io/support/defense-protocol>
- Privacy: <https://geeklabs.io/privacy/defense-protocol>
- Updates: <https://geeklabs.io/updates/defense-protocol>
- Credits: <https://geeklabs.io/credits/defense-protocol>
- Global leaderboard: <https://geeklabs.io/leaderboard/defense-protocol>

The web game and public site are live through Cloudflare Tunnel. The game keeps
its existing same-origin `/api/score` and `/api/leaderboard` contract.

## Production boundary

| Concern | Owner |
| --- | --- |
| Shared web/iOS game core and game image | This `geeklabs-td` repository |
| Public site, gateway, leaderboard API, and deployment definitions | Separate `geeklabs-site` repository |
| Runtime host | Dedicated Proxmox VM |
| Public ingress | Cloudflare Tunnel only |
| Internal routing | Nginx gateway on the private Docker network |
| Leaderboard data | SQLite with nightly same-VM backups |

The game, site, leaderboard, and gateway containers are healthy, cloudflared is
running, and the backup timer is active. VM hardening and an off-host or Proxmox
backup are intentionally still pending. The support mailbox must be monitored
before App Store submission.

## Accepted gameplay baseline

Defense Protocol is an endless tower-defense game with Easy, Medium, and Hard
modes, concurrent waves, persistent settings, local and optional global scores,
contextual tower controls, and responsive desktop and touch presentation.

Specialist progression is intentionally staged: Rapid unlocks before Sprinters,
Sniper before Brutes, and Laser before Armored enemies. A seeded Hard comparison
showed the mixed-specialist build surviving eight waves longer than Basic-heavy
(Wave 54 versus Wave 46), so the coordinated v0.4.0 balance remains accepted.
See [balance testing](BALANCE_TESTING.md) before proposing stat changes.

## iOS state

- Unreleased App Store hardening replaces free-form public names with fixed-
  vocabulary generated callsigns, defaults online score submission to off, and
  enforces the callsign format in the leaderboard API. Existing public rows have
  a backup-first migration path. This coordinated game/site/API change still
  requires deployment, new screenshots, and a fresh Release archive.

- Playtest follow-up fixes compact results, restart teardown, and the
  change-difficulty return path. It adds deterministic next-wave counts,
  per-type/per-wave escape summaries, specialist bonus text, and clearer enemy
  cues. Tests and Simulator packaging pass; native replay/result checks pass.
  Revision `3817ef3` is deployed to the web game and its game code is installed
  on both physical devices as a signed Debug build (2026-08-28). Installation,
  launch, and subsequent process checks passed on the iPhone 17 Pro Max and
  12.9-inch iPad Pro. Details and
  remaining acceptance checks are in [iOS proof of concept](IOS_POC.md).

- Start/Add Wave now deploys immediately on one touch without the keyboard
  confirmation prompt; desktop Space confirmation and the spawner cap remain.
  The 2026-08-28 change passes tests, production build, Simulator packaging
  validation, and a signed Debug device build. The update installed and launched
  on both the iPhone and iPad over Wi-Fi after direct `devicectl` requests
  established their connections; `xctrace` had reported them offline.
  Physical-device interaction verification of this change remains pending.
  This change is included in the live web deployment of `3817ef3`.
- The Capacitor 8 shell builds, signs, installs, and launches on an iPhone 17 Pro
  Max.
- The v0.10.0 build is installed on that iPhone and a 12.9-inch iPad Pro.
- Automated launch passed on both devices on 2026-08-28; the earlier iPad
  launch attempt had been blocked because the device was locked.
- Simulator validation covers safe areas, both landscape orientations, touch
  placement, contextual actions, lifecycle pause behavior, and persistence.
- A physical-device Easy run reached Wave 54 with no reported touch or frame-
  pacing blocker.
- The privacy manifest, required-reason declaration, and export-compliance flag
  are packaged; a development-signed `1.0 (1)` Release archive passed signature
  and debug-symbol checks.
- Native iPhone 6.9-inch and iPad 13-inch Release screenshots are prepared.
- Store copy, review notes, and privacy/age-rating worksheets are prepared in
  the public-site repository; App Store Connect upload is still pending.

The proof of concept is accepted. A measured endurance/thermal run and final
force-quit preference-restoration audit remain release gates; see
[the iOS validation record](IOS_POC.md).

## Current release gates

1. Complete late-wave physical-device checks on both the installed iPhone and
   iPad, including battery, heat, touch selection, and visual density.
2. Verify force-quit preference restoration on the release candidate.
3. Deploy and migrate the generated-callsign flow. The sound-source documentation
   gate was resolved on 2026-09-11: an independent sine-wave generator reproduces
   all seven shipped WAV files byte for byte; see
   [the reconstruction record](../app-store/SOUND_PROVENANCE.md).
4. Confirm the support mailbox and Cloudflare retention, approve final store
   declarations, and complete distribution signing, upload, and TestFlight.
5. Harden the VM and establish an off-host or Proxmox-level backup before the
   service is treated as durable production infrastructure.

See [the App Store readiness record](../app-store/READINESS.md) for completed
artifacts, validation evidence, and the remaining owner decisions.

Only update gameplay balance or art pivots from specific new evidence. Broader
ideas remain non-binding in [IDEAS.md](IDEAS.md).
