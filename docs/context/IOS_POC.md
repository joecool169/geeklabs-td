# iOS proof of concept

## Playtest follow-up — 2026-08-28

Follow-up game code `3817ef3` was deployed to the web game and installed on both
physical devices on 2026-08-28:

- compact landscape game-over screen keeps wave, kills, score, and replay/change/
  leaderboard buttons visible; expandable escape counts show type and wave
- restart cleanup tolerates Phaser already destroying its enemy group
- Change name / difficulty explicitly clears the prior skip-start-screen setting
- seeded next-wave preview, full-opacity damaged enemies with distinct type
  markers, and specialist bonuses alongside explicitly labeled base DPS
- checkpoint diagnostic toast removed; telemetry preserved
- 86 automated tests pass; production build and Simulator packaging pass
- native Simulator checks: place a tower, pause/restart, launch a fresh wave,
  natural game over with no towers, expand the escape report, and Re-engage
- the no-tower result correctly displayed 20 escapes: 11 from wave 1, nine from
  wave 2; all result buttons and the expanded breakdown fitted in landscape
- browser forced-touch at 1280×720 now keeps HUD and controls on one screen
- signed Debug device build and strict code-signature verification passed;
  packaged JavaScript matched the verified web build
- installed and launched on the iPhone 17 Pro Max and 12.9-inch iPad Pro
  (6th generation), both running iOS/iPadOS 26.6.1; subsequent process queries
  confirmed the new apps remained running
- initial wireless connections failed despite paired/available listings;
  retrying direct lock-state queries established both tunnels without re-pairing

Remaining acceptance: iPhone/iPad finger testing, long specialist descriptions
at late waves, both landscape orientations on physical devices, and measured
frame pacing/thermal/battery endurance. Simulator responsiveness is not evidence
for these checks. See [balance testing](BALANCE_TESTING.md) for the planned
controlled comparison; no balance values changed in this follow-up.

## Single-tap wave update — 2026-08-28

- Revision `990c150` starts/adds waves with one touch and no keyboard
  confirmation prompt; keyboard confirmation and the spawner cap are preserved.
- All 80 tests, production build, Simulator packaging validation, signed Debug
  device build, and code-signature verification passed.
- The update installed and launched on the iPhone 17 Pro Max and 12.9-inch
  iPad Pro over Wi-Fi. Manual single-tap interaction verification is pending.
- `xcrun xctrace list devices` initially reported both devices offline, while
  `xcrun devicectl list devices` reported them available and paired. Direct
  `devicectl device info details --device <identifier>` and
  `devicectl device info lockState --device <identifier>` requests established
  the connections; the iPad needed a retry. Check these before treating an
  `xctrace` offline listing as an installation blocker. No re-pairing or device
  settings changes were needed.

## Store-preparation handoff — 2026-08-26

Privacy/license packaging, native Release screenshots, store metadata, and a
development-signed Release archive are now prepared. See the
[App Store readiness record](../app-store/READINESS.md) for exact artifacts,
verification evidence, and remaining release gates. This does not replace final
physical-device endurance checks or App Store distribution validation.

## Current status — accepted proof of concept

The Capacitor 8 shell and generated iOS 15+ project are in the repository. The native project uses bundle identifier `tv.geekstreet.td` and includes the App and Preferences plugins.

Implemented and locally verified:

- the normal Vite build remains the shared game core
- `npm run ios:sync` builds and copies the web bundle into the native project
- native backgrounding pauses an active run
- returning to the app refreshes Phaser sizing but does not resume gameplay automatically
- existing `defense_protocol_*` browser values are mirrored to native Preferences
- native Preferences can restore values if WebKit local storage is cleared
- web behavior remains unchanged when Capacitor is not native
- Xcode 26.6 compiles the unsigned Simulator application successfully
- the app launches on an iPhone 17 Pro simulator running iOS 26.5
- landscape-left and landscape-right orientations respect safe areas; portrait is intentionally unsupported
- touch placement, wave start, and contextual tower controls work in the Simulator
- the bottom grid row remains reachable with the adaptive touch offset, and placement exits after a successful build
- selected towers expose compact damage, range, fire-rate, and DPS stats on touch layouts
- the short-landscape pause menu fits without scrolling or keyboard-only controls
- backgrounding during an active wave returns to an explicit pause screen
- the signed app installs and launches on an iPhone 17 Pro Max
- a real-device Easy run reached Wave 54 with 37 towers, 3,626 kills, 20 lives, and 40 active enemies without a reported touch or frame-pacing blocker
- real-device sound activation works after the first touch; effects are audible, Silent Mode is respected, and the persistent Sound On/Off control works
- the production bundle, full automated suite, dependency audit, Capacitor sync,
  Simulator build, signed device build, installation, and launch pass

Deferred to release endurance testing:

- a measured battery/thermal run and force-quit restoration audit on the release candidate

The current Mac uses Xcode 26.6 at `/Applications/Xcode.app/Contents/Developer`. Automatic development signing is configured and version `1.0 (1)` has been installed on Joe's iPhone.

## Touch-polish device handoff — 2026-08-23

- the final signed build installed on an iPhone 17 Pro Max and 12.9-inch iPad Pro (6th generation)
- automated launch succeeded on the iPhone
- the iPad installation succeeded; automated launch was denied only because the
  device was locked, so its final launch and interaction check remains a manual
  acceptance step
- both devices should verify landscape-left/right rotation, bottom-row placement, placement exit, selected-tower stats, and the compact pause menu

## Physical-device installation — 2026-08-23

- device: iPhone 17 Pro Max
- development signing and provisioning succeeded
- `tv.geekstreet.td` installed successfully
- the native process launched and remained alive
- touch interaction and dense-wave play reached Wave 54 without a reported blocker
- audio activation and the persistent sound toggle passed on the physical device
- the proof of concept is accepted as the mobile-development foundation

## Simulator validation — 2026-08-23

- unsigned native build passed with Capacitor 8.5.0 and iOS 26.5
- initial launch rendered without a blank screen or application error
- the start overlay clears the Dynamic Island and no longer opens the keyboard automatically
- one tower was placed through touch controls and its contextual actions appeared
- the app launches directly into landscape and supports both landscape orientations
- backgrounding during the active wave paused the run; foregrounding did not resume it automatically
- automated native preference, lifecycle, placement, and touch-stat coverage
  passes in the full test suite

## One-time Mac setup

1. Install Xcode 26 or newer. This Mac currently has Xcode 26.6.
2. Select it:

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```

3. From the repository, validate the unsigned Simulator build:

   ```bash
   npm ci
   npm run ios:validate
   ```

4. Open the project for Simulator or device work:

   ```bash
   npm run ios:open
   ```

For a real iPhone, select a development team for the App target in Xcode, connect and trust the phone, and enable Developer Mode if iOS requests it.

## Simulator checks

- launch without a blank frame or startup error
- start a run and place, select, target, upgrade, and sell towers
- rotate between landscape left and landscape right; confirm portrait cannot become an active game orientation
- confirm controls clear the notch, Dynamic Island, home indicator, and rounded corners
- confirm tower placement tracks the touch point after rotation
- background during an active wave, return, and confirm the pause menu is still present
- resume manually and confirm no enemies advanced while backgrounded
- choose a name and difficulty, relaunch, and confirm both persist
- confirm sound begins after the first user interaction

## Real-device checks

- repeat the Simulator interaction and lifecycle checks on an iPhone
- play through dense late waves and watch for frame pacing or touch lag
- run continuously for at least 20 minutes and note device warmth, battery drain, audio stability, and crashes
- force-quit and relaunch to verify Preferences restores name, difficulty, local scores, and telemetry

Record the device model, iOS version, orientation, last wave, endurance notes,
and any reproducible issue as release-validation evidence for the accepted
Capacitor mobile foundation.
