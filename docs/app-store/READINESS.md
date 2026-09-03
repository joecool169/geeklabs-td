# iOS App Store readiness — updated 2026-09-02

## Completed preparation

- Privacy manifest is included in the native Resources build phase. It declares
  unlinked Gameplay Content for app functionality, no tracking, and UserDefaults
  reason `CA92.1`. App-generated callsigns replace free-form user content.
- `ITSAppUsesNonExemptEncryption` is false for the platform-HTTPS-only app.
- Runtime MIT notices are bundled. The existing GitHub footer image is bundled
  locally, eliminating an unnecessary remote image request from the native app.
- Online score submission is off until the player selects it and remains
  controllable from the start and pause screens.
- Callsigns use a fixed app-generated vocabulary with a reroll control. The
  client normalizes older saved names and the API rejects arbitrary names.
- Store description, subtitle, keywords, promotional text, release notes, review
  notes, age-rating facts, and the App Privacy worksheet are prepared in the
  sibling site's `docs/app-store-metadata.md`. Field length checks pass.
- Four native Release screenshots are ready in [screenshots](screenshots/README.md):
  iPhone 6.9-inch and iPad 13-inch, with start and gameplay screens for each.
- A signed Release archive is available locally:
  `ios/Archives/DefenseProtocol-1.0-1-local-assets.xcarchive`.
  The earlier `DefenseProtocol-1.0-1.xcarchive` is superseded.

## Archive and test evidence

- Xcode archive: succeeded, version `1.0 (1)`, bundle `tv.geekstreet.td`.
- iOS deployment target: 15.0; device families: iPhone and iPad.
- Orientations: landscape left and right for both device families.
- Code signature: strict/deep verification passed; Apple Development signing.
- Binary and dSYM UUIDs match: `48ABAFC1-0597-367D-B528-D0D67B549B9C` (arm64).
- Packaged privacy manifest exactly matches the reviewed source; local branding
  image exactly matches its bundled source.
- Game suite: 77 tests passed; production build passed; production dependency
  audit found zero vulnerabilities.
- Simulator validation passed, including packaged manifest/notices checks.
- Public-site suite: 9 tests passed; production build passed.
- App Store Connect upload/distribution validation has **not** been performed.
  A development-signed archive is not a submitted or approved App Store build.

## Remaining owner decisions and release gates

1. **Sound provenance.** Confirm the source/license or ownership of all seven
   files under `public/sfx`: death, gameover, life, place, sell, upgrade, and wave.
   Their provenance is not documented. Do not claim clearance without evidence.
2. **Final physical-device acceptance.** Complete the measured battery/heat and
   dense-wave run, force-quit preference restoration, and final iPad acceptance
   on the release candidate. Simulator success does not substitute for these.
3. **Privacy/account facts.** Confirm that `support@geeklabs.io` is monitored,
   review Cloudflare account-level retention, and approve the final privacy,
   content-rights, export-compliance, and age-rating answers.
4. **App Store Connect.** Confirm developer membership/agreements, app record,
   distribution signing, pricing/territories and optional Mac/Vision availability;
   upload a build, complete TestFlight acceptance, and submit for review.
5. **Production durability/access.** Select an off-host/Proxmox backup destination
   and approve a firewall/SSH access plan before tightening the VM's access.

The callsign flow changed after the existing archive and screenshots were made.
Regenerate both before submission, deploy the coordinated game/API/site update,
then run the backup-first legacy-name migration. Use a new build number after
any build has been uploaded.

## Production audit

- The application containers expose no host ports; Cloudflare Tunnel remains
  the public ingress. No tunnel configuration change was required.
- Game, site, gateway, and leaderboard services were healthy during audit.
- Native `capacitor://localhost` leaderboard GET returned HTTP 200 and the
  expected CORS header. No fabricated score was submitted by this audit.
- Nightly leaderboard backup timer is active; last completed job succeeded.
- Existing compressed backup was decompressed into a temporary test directory;
  SQLite `PRAGMA quick_check` returned `ok`. The live database also returned `ok`.
- Backups are still on the same VM; no durable off-host backup was verified.
- UFW is inactive; SSH accepts passwords and listens on all interfaces; root
  password login is prohibited. Changes were intentionally not applied without
  an access/recovery plan.
- Unattended upgrades are active; four package updates were available. No
  reboot-required marker was present; root filesystem was 23% used.

## Reference

Privacy declarations were checked against Apple's
[data-use manifest guidance](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests)
and [App Privacy details](https://developer.apple.com/app-store/app-privacy-details/).
Final answers remain the account holder's responsibility and must reflect the
actual final app and service configuration.
