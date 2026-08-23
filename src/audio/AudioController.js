class AudioController {
  constructor({ soundManager, storage, storageKey, unlockTarget = globalThis.document }) {
    this.soundManager = soundManager;
    this.storage = storage;
    this.storageKey = storageKey;
    this.sounds = new Map();
    this.lastPlayedAt = new Map();
    this.enabled = storage?.read(storageKey) !== "false";
    this.removeUnlockListeners = this.bindUnlock(unlockTarget);
    this.applyMuteState();
  }

  applyMuteState() {
    if (typeof this.soundManager?.setMute === "function") {
      this.soundManager.setMute(!this.enabled);
    } else if (this.soundManager) {
      this.soundManager.mute = !this.enabled;
    }
  }

  register(key, sound) {
    if (key && sound) this.sounds.set(key, sound);
  }

  setEnabled(enabled) {
    this.enabled = enabled !== false;
    this.applyMuteState();
    this.storage?.write(this.storageKey, String(this.enabled));
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  unlock() {
    try {
      if (this.soundManager?.locked && typeof this.soundManager.unlock === "function") {
        this.soundManager.unlock();
      }
      const context = this.soundManager?.context;
      if (context?.state === "suspended" && typeof context.resume === "function") {
        void Promise.resolve(context.resume()).catch(() => {});
      }
    } catch {
      // A later user gesture gets another chance to unlock audio.
    }
  }

  bindUnlock(target) {
    if (!target?.addEventListener) return () => {};
    const attemptUnlock = () => this.unlock();
    const eventNames = ["pointerdown", "touchend", "keydown"];
    eventNames.forEach((eventName) =>
      target.addEventListener(eventName, attemptUnlock, { capture: true })
    );
    return () =>
      eventNames.forEach((eventName) =>
        target.removeEventListener(eventName, attemptUnlock, { capture: true })
      );
  }

  play(key, { minInterval = 0, now = Date.now() } = {}) {
    if (!this.enabled) return false;
    const sound = this.sounds.get(key);
    if (!sound || sound.isPlaying) return false;
    const lastPlayedAt = this.lastPlayedAt.get(key) ?? -Infinity;
    if (now - lastPlayedAt < minInterval) return false;
    const played = sound.play();
    if (played === false) return false;
    this.lastPlayedAt.set(key, now);
    return true;
  }

  destroy() {
    this.removeUnlockListeners?.();
    this.removeUnlockListeners = null;
    this.sounds.clear();
    this.lastPlayedAt.clear();
  }
}

export { AudioController };
