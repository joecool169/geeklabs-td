import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('iOS privacy manifest declares leaderboard data and Preferences access', () => {
  const manifest = read('ios/App/App/PrivacyInfo.xcprivacy');
  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  for (const type of ['GameplayContent', 'OtherUserContent']) {
    assert.match(manifest, new RegExp(`NSPrivacyCollectedDataType${type}`));
  }
  assert.match(manifest, /NSPrivacyCollectedDataTypePurposeAppFunctionality/);
  assert.match(manifest, /NSPrivacyAccessedAPICategoryUserDefaults/);
  assert.match(manifest, /<string>CA92\.1<\/string>/);
  const project = read('ios/App/App.xcodeproj/project.pbxproj');
  const resources = project.split('/* Begin PBXResourcesBuildPhase section */')[1]
    .split('/* End PBXResourcesBuildPhase section */')[0];
  assert.match(resources, /PrivacyInfo\.xcprivacy in Resources/);
});

test('iOS release declarations and bundled runtime notices remain present', () => {
  const plist = read('ios/App/App/Info.plist');
  assert.match(plist, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.match(plist, /UIInterfaceOrientationLandscapeLeft/);
  assert.match(plist, /UIInterfaceOrientationLandscapeRight/);
  const notices = read('public/legal/third-party-notices.txt');
  assert.match(notices, /Phaser 3\.90\.0/);
  assert.match(notices, /Capacitor Preferences/);
  assert.match(notices, /Permission is hereby granted/);
});
