import "./style.css";
import Phaser from "phaser";
import { GameScene } from "./scene.js";
import {
  bindNativeAppLifecycle,
  hydrateNativePreferences,
} from "./platform/nativeRuntime.js";

const forceTouchUi = new URLSearchParams(window.location.search).get("touch") === "1";
const prefersTouchUi =
  window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches ||
  window.matchMedia?.("(any-pointer: coarse)")?.matches;
document.documentElement.classList.toggle(
  "touch-ui",
  forceTouchUi || !!prefersTouchUi
);

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1080,
  height: 730,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 730,
  },
  backgroundColor: 0x0b0f14,
  resolution: window.devicePixelRatio || 1,
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [GameScene],
};

async function startGame() {
  await hydrateNativePreferences();
  const game = new Phaser.Game(config);
  const unbindLifecycle = await bindNativeAppLifecycle({
    onInactive: () => game.scene.getScene("GameScene")?.handleAppInactive?.(),
    onActive: () => game.scene.getScene("GameScene")?.handleAppActive?.(),
  });
  window.addEventListener("beforeunload", unbindLifecycle, { once: true });
}

void startGame();
