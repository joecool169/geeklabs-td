class TouchSellGuard {
  constructor({
    button,
    label,
    onConfirm,
    duration = 1800,
    setTimer = globalThis.setTimeout,
    clearTimer = globalThis.clearTimeout,
  }) {
    this.button = button;
    this.label = label;
    this.onConfirm = onConfirm;
    this.duration = duration;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.armed = false;
    this.timer = null;
  }

  handle() {
    if (this.armed) {
      this.reset();
      this.onConfirm?.();
      return true;
    }
    this.armed = true;
    this.button?.classList.add("is-confirming");
    this.button?.setAttribute?.("aria-label", "Confirm sell selected tower");
    if (this.label) this.label.textContent = "Confirm Sell";
    this.timer = this.setTimer(() => this.reset(), this.duration);
    return false;
  }

  reset() {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    this.armed = false;
    this.button?.classList.remove("is-confirming");
    this.button?.setAttribute?.("aria-label", "Sell selected tower");
    if (this.label) this.label.textContent = "Sell";
  }

  destroy() {
    this.reset();
    this.onConfirm = null;
  }
}

export { TouchSellGuard };
