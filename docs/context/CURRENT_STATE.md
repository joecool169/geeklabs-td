# Current State

- Snapshot date: **2026-09-20**
- Branch: **`main`**
- Current release: **`v0.10.0` production graphics pass**
- Preserved balance baseline: **`v0.3.0-balance-checkpoint`**

This is the volatile operational snapshot. Architecture, historical rationale,
and longer-term work live in the other documents linked from the
[context index](README.md).

## Remote development handoff — 2026-09-20

- Development moves to `geeklabs-td` using a separate checkout at
  `/home/joe/projects/geeklabs-td-dev`. The existing
  `/home/joe/projects/geeklabs-td` remains the production deployment checkout.
- Remote validation: Node 22.23.2, clean `npm ci` with zero reported
  vulnerabilities, all 91 tests passed, production build passed. Forgejo
  push dry-run succeeded. GitHub fetch works; direct server push setup is pending.
- Read [REMOTE_DEVELOPMENT.md](REMOTE_DEVELOPMENT.md) for setup, Mac-only
  artifacts, service boundaries, and outstanding access checks.
- Latest recorded Apple status: version 1.0 build 3 submitted September 18;
  manual release selected. Review outcome has not been checked September 20.
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
  The correction is included in this revision; web deployment remains pending.

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
