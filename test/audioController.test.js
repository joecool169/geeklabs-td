import test from "node:test";
import assert from "node:assert/strict";

import { AudioController } from "../src/audio/AudioController.js";

function createStorage(initialValue = null) {
  const writes = [];
  return {
    read: () => initialValue,
    write: (key, value) => writes.push([key, value]),
    writes,
  };
}

function createUnlockTarget() {
  const listeners = new Map();
  return {
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    listeners,
  };
}

test("audio preference controls mute state and persists changes", () => {
  const storage = createStorage("false");
  const muteStates = [];
  const controller = new AudioController({
    soundManager: { setMute: (muted) => muteStates.push(muted) },
    storage,
    storageKey: "sound",
    unlockTarget: null,
  });

  assert.equal(controller.enabled, false);
  assert.deepEqual(muteStates, [true]);
  assert.equal(controller.toggle(), true);
  assert.deepEqual(muteStates, [true, false]);
  assert.deepEqual(storage.writes, [["sound", "true"]]);
});

test("audio playback honors enabled state, overlap, and rate limiting", () => {
  const controller = new AudioController({
    soundManager: { setMute() {} },
    storage: createStorage(),
    storageKey: "sound",
    unlockTarget: null,
  });
  let plays = 0;
  const sound = { isPlaying: false, play: () => { plays += 1; return true; } };
  controller.register("death", sound);

  assert.equal(controller.play("death", { now: 100, minInterval: 100 }), true);
  assert.equal(controller.play("death", { now: 150, minInterval: 100 }), false);
  assert.equal(controller.play("death", { now: 200, minInterval: 100 }), true);
  sound.isPlaying = true;
  assert.equal(controller.play("death", { now: 400, minInterval: 100 }), false);
  controller.setEnabled(false);
  sound.isPlaying = false;
  assert.equal(controller.play("death", { now: 500 }), false);
  assert.equal(plays, 2);
});

test("document gestures resume audio and listeners are removed on destroy", () => {
  const target = createUnlockTarget();
  let unlocks = 0;
  let resumes = 0;
  const controller = new AudioController({
    soundManager: {
      locked: true,
      unlock: () => { unlocks += 1; },
      context: { state: "suspended", resume: () => { resumes += 1; } },
      setMute() {},
    },
    storage: createStorage(),
    storageKey: "sound",
    unlockTarget: target,
  });

  target.listeners.get("pointerdown")();
  assert.equal(unlocks, 1);
  assert.equal(resumes, 1);
  controller.destroy();
  assert.equal(target.listeners.size, 0);
});
