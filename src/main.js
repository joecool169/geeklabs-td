import Phaser from "phaser";
import { GameScene } from "./scene.js";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1100,
  height: 650,
  backgroundColor: 0x0b0f14,
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [GameScene],
};

new Phaser.Game(config);
