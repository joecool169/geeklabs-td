import test from "node:test";
import assert from "node:assert/strict";

import { TouchSellGuard } from "../src/ui/TouchSellGuard.js";

test("touch selling requires a second tap and resets safely", () => {
  const classes = new Set();
  const button = {
    attributes: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const label = { textContent: "Sell" };
  let timerCallback;
  let confirmations = 0;
  const guard = new TouchSellGuard({
    button,
    label,
    onConfirm: () => { confirmations += 1; },
    setTimer: (callback) => { timerCallback = callback; return 1; },
    clearTimer() {},
  });

  assert.equal(guard.handle(), false);
  assert.equal(confirmations, 0);
  assert.equal(label.textContent, "Confirm Sell");
  assert.equal(classes.has("is-confirming"), true);
  assert.equal(button.attributes["aria-label"], "Confirm sell selected tower");
  timerCallback();
  assert.equal(label.textContent, "Sell");

  guard.handle();
  assert.equal(guard.handle(), true);
  assert.equal(confirmations, 1);
  assert.equal(classes.has("is-confirming"), false);
});
