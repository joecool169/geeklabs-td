import test from "node:test";
import assert from "node:assert/strict";

import {
  bindNativeAppLifecycle,
  hydrateNativePreferences,
  persistNativePreference,
} from "../src/platform/nativeRuntime.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    values,
  };
}

function createPreferences(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    async keys() {
      return { keys: [...values.keys()] };
    },
    async get({ key }) {
      return { value: values.get(key) ?? null };
    },
    async set({ key, value }) {
      values.set(key, String(value));
    },
    values,
  };
}

const nativeCapacitor = { isNativePlatform: () => true };
const webCapacitor = { isNativePlatform: () => false };

test("native preferences restore missing browser values and preserve newer local values", async () => {
  const playerKey = "defense_protocol_player_name_v1";
  const difficultyKey = "defense_protocol_difficulty_v1";
  const storage = createMemoryStorage({ [playerKey]: "local-player" });
  const preferences = createPreferences({
    [playerKey]: "older-native-player",
    [difficultyKey]: "hard",
    unrelated: "ignored",
  });

  assert.equal(
    await hydrateNativePreferences({
      storage,
      preferences,
      capacitor: nativeCapacitor,
    }),
    true
  );
  assert.equal(storage.values.get(playerKey), "local-player");
  assert.equal(storage.values.get(difficultyKey), "hard");
  assert.equal(storage.values.has("unrelated"), false);
  assert.equal(preferences.values.get(playerKey), "local-player");
});

test("native preference mirroring is scoped and disabled on the web", async () => {
  const preferences = createPreferences();
  assert.equal(
    await persistNativePreference("defense_protocol_help_overlay_v1", "true", {
      preferences,
      capacitor: nativeCapacitor,
    }),
    true
  );
  assert.equal(preferences.values.get("defense_protocol_help_overlay_v1"), "true");
  assert.equal(
    await persistNativePreference("unrelated", "value", {
      preferences,
      capacitor: nativeCapacitor,
    }),
    false
  );
  assert.equal(
    await persistNativePreference("defense_protocol_help_overlay_v1", "false", {
      preferences,
      capacitor: webCapacitor,
    }),
    false
  );
});

test("native lifecycle emits one callback per active-state transition", async () => {
  let listener;
  let removed = false;
  const app = {
    async addListener(eventName, callback) {
      assert.equal(eventName, "appStateChange");
      listener = callback;
      return { remove: () => { removed = true; } };
    },
  };
  const transitions = [];
  const unbind = await bindNativeAppLifecycle({
    app,
    capacitor: nativeCapacitor,
    onInactive: () => transitions.push("inactive"),
    onActive: () => transitions.push("active"),
  });

  listener({ isActive: false });
  listener({ isActive: false });
  listener({ isActive: true });
  assert.deepEqual(transitions, ["inactive", "active"]);
  unbind();
  assert.equal(removed, true);
});

test("web lifecycle binding is a no-op", async () => {
  let subscribed = false;
  const unbind = await bindNativeAppLifecycle({
    capacitor: webCapacitor,
    app: { addListener: () => { subscribed = true; } },
  });
  unbind();
  assert.equal(subscribed, false);
});
