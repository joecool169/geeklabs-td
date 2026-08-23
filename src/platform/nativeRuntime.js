import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const STORAGE_PREFIX = "defense_protocol_";

function isNativeRuntime(capacitor = Capacitor) {
  return capacitor?.isNativePlatform?.() === true;
}

function getManagedBrowserKeys(storage) {
  const keys = [];
  try {
    for (let index = 0; index < (storage?.length ?? 0); index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
}

async function hydrateNativePreferences({
  storage = globalThis.localStorage,
  preferences = Preferences,
  capacitor = Capacitor,
} = {}) {
  if (!isNativeRuntime(capacitor)) return false;

  try {
    const { keys = [] } = await preferences.keys();
    for (const key of keys) {
      if (!key.startsWith(STORAGE_PREFIX)) continue;
      const browserValue = storage?.getItem(key);
      if (browserValue !== null && browserValue !== undefined) continue;
      const { value } = await preferences.get({ key });
      if (value !== null && value !== undefined) storage?.setItem(key, value);
    }

    for (const key of getManagedBrowserKeys(storage)) {
      const value = storage?.getItem(key);
      if (value !== null && value !== undefined) {
        await preferences.set({ key, value });
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function persistNativePreference(
  key,
  value,
  { preferences = Preferences, capacitor = Capacitor } = {}
) {
  if (!isNativeRuntime(capacitor) || !key?.startsWith(STORAGE_PREFIX)) {
    return false;
  }
  try {
    await preferences.set({ key, value: String(value) });
    return true;
  } catch {
    return false;
  }
}

async function bindNativeAppLifecycle({
  onInactive,
  onActive,
  app = App,
  capacitor = Capacitor,
} = {}) {
  if (!isNativeRuntime(capacitor)) return () => {};

  let lastIsActive = true;
  try {
    const handle = await app.addListener("appStateChange", ({ isActive }) => {
      const active = isActive !== false;
      if (active === lastIsActive) return;
      lastIsActive = active;
      if (active) onActive?.();
      else onInactive?.();
    });
    return () => handle.remove();
  } catch {
    return () => {};
  }
}

export {
  STORAGE_PREFIX,
  bindNativeAppLifecycle,
  hydrateNativePreferences,
  isNativeRuntime,
  persistNativePreference,
};
