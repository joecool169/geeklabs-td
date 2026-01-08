import Phaser from "phaser";
import { GameScene } from "./scene.js";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1080,
  height: 730,
  backgroundColor: 0x0b0f14,
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [GameScene],
};

new Phaser.Game(config);
