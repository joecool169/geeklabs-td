import { GAME_ACTIONS } from "./actions.js";

class InputController {
  constructor({ input, keyCodes, onAction }) {
    this.input = input;
    this.keyboard = input.keyboard;
    this.onAction = onAction;
    this.keys = {};
    this.removeListeners = [];
    this.input.mouse?.disableContextMenu();

    const bindings = [
      ["togglePlacement", keyCodes.T, GAME_ACTIONS.TOGGLE_PLACEMENT],
      ["upgrade", keyCodes.U, GAME_ACTIONS.UPGRADE_SELECTED],
      ["sell", keyCodes.X, GAME_ACTIONS.SELL_SELECTED],
      ["target", keyCodes.F, GAME_ACTIONS.CYCLE_TARGETING],
      ["basic", keyCodes.ONE, GAME_ACTIONS.SELECT_TOWER_TYPE, { towerType: "basic" }],
      ["rapid", keyCodes.TWO, GAME_ACTIONS.SELECT_TOWER_TYPE, { towerType: "rapid" }],
      ["sniper", keyCodes.THREE, GAME_ACTIONS.SELECT_TOWER_TYPE, { towerType: "sniper" }],
      ["laser", keyCodes.FOUR, GAME_ACTIONS.SELECT_TOWER_TYPE, { towerType: "laser" }],
      ["pause", keyCodes.P, GAME_ACTIONS.TOGGLE_PAUSE],
      ["help", keyCodes.H, GAME_ACTIONS.TOGGLE_HELP],
      ["cancel", keyCodes.ESC, GAME_ACTIONS.CANCEL],
      ["startWave", keyCodes.SPACE, GAME_ACTIONS.START_WAVE],
    ];

    this.keys.shift = this.keyboard.addKey(keyCodes.SHIFT);
    for (const [name, code, type, payload = {}] of bindings) {
      const key = this.keyboard.addKey(code);
      const handler = () => this.dispatch({ type, ...payload });
      key.on("down", handler);
      this.keys[name] = key;
      this.removeListeners.push(() => key.off("down", handler));
    }

    this.pointerDownHandler = (pointer) => {
      this.dispatch({
        type: pointer.rightButtonDown()
          ? GAME_ACTIONS.SECONDARY_AT
          : GAME_ACTIONS.PRIMARY_AT,
        x: pointer.worldX,
        y: pointer.worldY,
        modified: !!this.keys.shift?.isDown,
      });
    };
    this.pointerMoveHandler = (pointer) => {
      this.dispatch({
        type: GAME_ACTIONS.POINTER_MOVED,
        x: pointer.worldX,
        y: pointer.worldY,
      });
    };
    input.on("pointerdown", this.pointerDownHandler);
    input.on("pointermove", this.pointerMoveHandler);
    this.removeListeners.push(() =>
      input.off("pointerdown", this.pointerDownHandler)
    );
    this.removeListeners.push(() =>
      input.off("pointermove", this.pointerMoveHandler)
    );
  }

  dispatch(action) {
    this.onAction?.(action);
  }

  setKeyboardEnabled(enabled) {
    if (!this.keyboard) return;
    this.keyboard.enabled = !!enabled;
    if (enabled) this.keyboard.enableGlobalCapture();
    else this.keyboard.disableGlobalCapture();
  }

  destroy() {
    this.removeListeners.splice(0).forEach((remove) => remove());
    this.onAction = null;
  }
}

export { InputController };
