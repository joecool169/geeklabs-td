#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEVELOPER_DIR_PATH="$(xcode-select -p 2>/dev/null || true)"

if [[ -z "$DEVELOPER_DIR_PATH" || "$DEVELOPER_DIR_PATH" == *CommandLineTools* ]]; then
  echo "Full Xcode is required for iOS validation."
  echo "Install Xcode 26 or newer, then select it with:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 2
fi

cd "$ROOT_DIR"
plutil -lint ios/App/App/PrivacyInfo.xcprivacy ios/App/App/Info.plist
npm run ios:sync
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath ios/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build

BUILT_APP="ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app"
plutil -lint "$BUILT_APP/PrivacyInfo.xcprivacy"
cmp ios/App/App/PrivacyInfo.xcprivacy "$BUILT_APP/PrivacyInfo.xcprivacy"
test -s "$BUILT_APP/public/legal/third-party-notices.txt"
echo "Privacy manifest and runtime notices are packaged in the Simulator app."
