# iOS proof of concept

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
- the production bundle, 66-test suite, dependency audit, Capacitor sync, Simulator build, signed device build, installation, and launch pass

Deferred to release endurance testing:

- a measured battery/thermal run and force-quit restoration audit on the release candidate

The current Mac uses Xcode 26.6 at `/Applications/Xcode.app/Contents/Developer`. Automatic development signing is configured and version `1.0 (1)` has been installed on Joe's iPhone.

## Touch-polish device handoff — 2026-08-23

- the final signed build installed on an iPhone 17 Pro Max and 12.9-inch iPad Pro (6th generation)
- automated launch succeeded on the iPad
- the iPhone installation succeeded; automated launch was denied only because the device was locked, so its final launch and interaction check remains a manual acceptance step
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
- automated native preference, lifecycle, placement, and touch-stat coverage passes in the 66-test suite

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

Record the iPhone model, iOS version, orientation, last wave, and any reproducible issue before deciding whether Capacitor is suitable for the mobile edition.
