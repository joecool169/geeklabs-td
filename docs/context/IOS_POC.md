# iOS proof of concept

## Current status

The Capacitor 8 shell and generated iOS 15+ project are in the repository. The native project uses bundle identifier `tv.geekstreet.td` and includes the App and Preferences plugins.

Implemented and locally verified:

- the normal Vite build remains the shared game core
- `npm run ios:sync` builds and copies the web bundle into the native project
- native backgrounding pauses an active run
- returning to the app refreshes Phaser sizing but does not resume gameplay automatically
- existing `defense_protocol_*` browser values are mirrored to native Preferences
- native Preferences can restore values if WebKit local storage is cleared
- web behavior remains unchanged when Capacitor is not native

Not yet verified:

- Xcode compilation or Simulator launch
- signing and installation on a real iPhone
- on-device orientation, safe areas, audio activation, persistence, heat, and dense-wave performance

The current Mac developer path is `/Library/Developer/CommandLineTools`. Capacitor 8 requires full Xcode 26 or newer, so the remaining checks cannot run until Xcode is installed and selected.

## One-time Mac setup

1. Install Xcode 26 or newer.
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
- rotate between portrait and both landscape orientations
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
