# iOS App Store readiness — reconciled 2026-09-20

## Latest recorded release status

Version **1.0 (build 3)** was submitted for public App Review on September 18
with Joe's authorization. Apple confirmed “1 Item Submitted”; submission ID
`e673c879-964d-41dd-a333-5df1475d6e24`. **Manual release** remains selected.
This is the latest committed evidence, not a fresh check of Apple's review
status. Check App Store Connect before claiming approval or publishing.

See [the preparation record](PREPARATION-2026-09-17.md), especially its final
September 18 sections. Those updates supersede the old build-2 processing,
unpublished-privacy, missing-screenshot, and not-submitted notes.

## Completed preparation

- App record: [Defense Protocol](https://appstoreconnect.apple.com/apps/6811413986/distribution),
  Apple ID `6811413986`, bundle `tv.geekstreet.td`, SKU `defense-protocol-ios`.
- Build 3 was signed, archived, uploaded, processed, and selected for version 1.0.
  Local archive: `ios/Archives/DefenseProtocol-1.0-3.xcarchive`.
  Earlier archives remain historical artifacts.
- Privacy disclosures were published with owner approval: User ID, Gameplay
  Content, Coarse Location, and Other Diagnostic Data; linked, no tracking.
  The native manifest and live privacy policy were reconciled with that inventory.
  See [privacy audit](PRIVACY-AUDIT-2026-09-18.md).
- Current owner-supplied iPhone and iPad screenshots were uploaded and accepted;
  originals are tracked under `screenshots/2026-09-18-iphone/` and
  `screenshots/2026-09-18-ipad/`.
- Store metadata, Content Rights, pricing, age rating, and review notes saved.
  Free pricing and manual release selected. Initial targets are iPhone/iPad;
  Apple Silicon Mac and Vision Pro availability disabled.
- Joe confirmed `support@geeklabs.io` is monitored. DSA non-trader declaration
  was saved and verified Active for 27 countries/regions.
- Seven sounds have reproducible synthesis provenance; see
  [sound evidence](SOUND_PROVENANCE.md). Artwork/branding attribution and
  bundled third-party notices are documented.
- Global scores remain opt-in; callsigns are generated and enforced by the API.
  Local scores remain available without opting into online submission.

## Validation and retained evidence

- Build-3 preparation passed game tests, production build, manifest lint, strict
  signature verification, and website tests. All 45 packaged public/gameplay
  files matched build 2. See the dated preparation record for exact scope.
- iOS target is 15.0, iPhone/iPad, landscape left/right.
- Owner previously accepted roughly 30-minute iPhone/iPad runs to Wave 66 and
  the corrected iPad turret artwork. These reports do not establish final
  build-3 force-quit persistence or instrumented thermal validation.
- Signed archives and Xcode build outputs are ignored local files. Preserve the
  Mac checkout for native builds and release evidence; Git cloning omits them.

## Remaining release and operational gates

1. Check Apple's current review result; resolve any review feedback. Approval
   does not publish automatically under the recorded manual-release setting.
2. Confirm final TestFlight/build-3 acceptance on both device families, including
   force-quit preference restoration.
3. Resolve regional availability/licensing constraints, including China/Vietnam,
   before claiming an all-region launch.
4. Confirm production game/API state separately from repository status. The
   development move does not deploy the game or migrate service data.
5. Verify an off-host backup and agree an access/recovery plan before changing
   production firewall or SSH settings. The audit below is historical.

## Historical production audit — 2026-09-02

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
