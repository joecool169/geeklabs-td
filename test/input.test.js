import test from "node:test";
import assert from "node:assert/strict";

import { GAME_ACTIONS } from "../src/input/actions.js";
import { InputController } from "../src/input/InputController.js";

class FakeEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, handler) {
    const handlers = this.listeners.get(eventName) ?? [];
    handlers.push(handler);
    this.listeners.set(eventName, handlers);
  }

  off(eventName, handler) {
    const handlers = this.listeners.get(eventName) ?? [];
    this.listeners.set(
      eventName,
      handlers.filter((candidate) => candidate !== handler)
    );
  }

  emit(eventName, payload) {
    for (const handler of this.listeners.get(eventName) ?? []) handler(payload);
  }
}

class FakeKey extends FakeEmitter {
  constructor() {
    super();
    this.isDown = false;
  }
}

function makeInput() {
  const input = new FakeEmitter();
  const keys = new Map();
  input.mouse = { disableContextMenu() {} };
  input.keyboard = {
    enabled: true,
    addKey(code) {
      const key = new FakeKey();
      keys.set(code, key);
      return key;
    },
    enableGlobalCapture() {},
    disableGlobalCapture() {},
  };
  return { input, keys };
}

const keyCodes = {
  SHIFT: "shift",
  T: "t",
  U: "u",
  X: "x",
  F: "f",
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  P: "p",
  H: "h",
  ESC: "escape",
  SPACE: "space",
};

test("input controller maps device events into semantic game actions", () => {
  const { input, keys } = makeInput();
  const actions = [];
  const controller = new InputController({
    input,
    keyCodes,
    onAction: (action) => actions.push(action),
  });

  keys.get("t").emit("down");
  keys.get("1").emit("down");
  keys.get("shift").isDown = true;
  input.emit("pointerdown", {
    worldX: 120,
    worldY: 240,
    rightButtonDown: () => false,
  });
  input.emit("pointerdown", {
    worldX: 40,
    worldY: 80,
    rightButtonDown: () => true,
  });
  input.emit("pointermove", { worldX: 10, worldY: 20 });

  assert.deepEqual(actions, [
    { type: GAME_ACTIONS.TOGGLE_PLACEMENT },
    { type: GAME_ACTIONS.SELECT_TOWER_TYPE, towerType: "basic" },
    {
      type: GAME_ACTIONS.PRIMARY_AT,
      x: 120,
      y: 240,
      modified: true,
    },
    {
      type: GAME_ACTIONS.SECONDARY_AT,
      x: 40,
      y: 80,
      modified: true,
    },
    { type: GAME_ACTIONS.POINTER_MOVED, x: 10, y: 20 },
  ]);

  controller.setKeyboardEnabled(false);
  assert.equal(input.keyboard.enabled, false);
  controller.destroy();
  keys.get("t").emit("down");
  input.emit("pointermove", { worldX: 1, worldY: 2 });
  assert.equal(actions.length, 5);
});
