# Current State

- Snapshot date: **2026-08-28**
- Branch: **`main`**
- Current release: **`v0.10.0` production graphics pass**
- Preserved balance baseline: **`v0.3.0-balance-checkpoint`**

This is the volatile operational snapshot. Architecture, historical rationale,
and longer-term work live in the other documents linked from the
[context index](README.md).

## Repository and validation

- Forgejo is authoritative; GitHub mirrors reviewed revisions for public access.
- The production game image was built from `019c6b5`, including native leaderboard
  controls, public callsign labels, bundled runtime notices, and local branding.
- `npm test` passes with **80 tests**.
- `npm run build`, `npm audit`, and `git diff --check` pass.
- The v0.10.0 release preserves the accepted v0.4.0 balance and v0.7.0 command
  interface while completing the first-pass production graphics system.

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

- Start/Add Wave now deploys immediately on one touch without the keyboard
  confirmation prompt; desktop Space confirmation and the spawner cap remain.
  The 2026-08-28 change passes tests, production build, Simulator packaging
  validation, and a signed Debug device build. Both physical devices were offline,
  so installation and physical-device verification of this change are pending.
  This change has not been deployed to the live web game.
- The Capacitor 8 shell builds, signs, installs, and launches on an iPhone 17 Pro
  Max.
- The v0.10.0 build is installed on that iPhone and a 12.9-inch iPad Pro.
- Automated launch passed on the iPhone; the iPad launch attempt was blocked
  because the device was locked and still needs a manual acceptance check.
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
3. Resolve public free-form callsign moderation and document ownership or
   licensing of the seven shipped sound effects.
4. Confirm the support mailbox and Cloudflare retention, approve final store
   declarations, and complete distribution signing, upload, and TestFlight.
5. Harden the VM and establish an off-host or Proxmox-level backup before the
   service is treated as durable production infrastructure.

See [the App Store readiness record](../app-store/READINESS.md) for completed
artifacts, validation evidence, and the remaining owner decisions.

Only update gameplay balance or art pivots from specific new evidence. Broader
ideas remain non-binding in [IDEAS.md](IDEAS.md).
