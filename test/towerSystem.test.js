import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import {
  TowerSystem,
  attachTowerSystem,
} from "../src/systems/TowerSystem.js";

const makeDisplayObject = () => ({
  active: true,
  depth: 1,
  width: 256,
  setDepth() { return this; },
  setAlpha(alpha) { this.alpha = alpha; return this; },
  setTint() { return this; },
  setScale() { return this; },
  setDisplaySize(width, height) {
    this.displayWidth = width;
    this.displayHeight = height;
    return this;
  },
  setOrigin(x, y) { this.originX = x; this.originY = y; return this; },
  clearTint() { return this; },
  setPosition() { return this; },
  setTexture(key) { this.textureKey = key; return this; },
  setVisible() { return this; },
  clear() { return this; },
  destroy() { this.active = false; },
});

test("tower system owns placement, upgrades, selection, and refunds", () => {
  const state = new RunState({ startScreenActive: false });
  state.money = 500;
  state.wave = 10;
  const runController = new RunController(state);
  const sounds = [];
  const world = {
    isOnPath: () => false,
    showTowerRange() {},
    showGhostRing() {},
    hideRange() {},
  };
  const scene = {
    get money() { return state.money; },
    get wave() { return state.wave; },
    scale: { width: 1080, height: 730 },
    input: { activePointer: null },
    add: {
      image: () => makeDisplayObject(),
      graphics: () => makeDisplayObject(),
    },
    placeHint: { setText() {} },
    towerStripSlots: [],
    textures: { exists: (key) => key.startsWith("tower_basic") },
    showToast() {},
    playSfx(key) { sounds.push(key); },
  };
  const system = new TowerSystem({ scene, world, runController });
  attachTowerSystem(scene, system);

  assert.equal(system.isTowerUnlocked("rapid"), true);
  assert.equal(system.isTowerUnlocked("sniper"), false);
  system.setPlacement(true);
  system.updateGhost(300, 300);
  assert.equal(system.ghost.displayWidth, 68);
  assert.equal(system.ghost.displayHeight, 68);
  assert.equal(system.ghostHead.displayWidth, 112);
  assert.equal(system.ghostHead.displayHeight, 112);
  assert.equal(system.ghost.alpha, 0.44);
  const tower = system.tryPlaceTowerAt(300, 300);
  assert.equal(tower.type, "basic");
  assert.equal(system.isPlacing, false);
  assert.equal(state.money, 450);
  assert.equal(scene.towers.length, 1);
  assert.equal(scene.selectedTower, tower);
  assert.equal(tower.sprite.textureKey, "tower_basic_base");
  assert.equal(tower.sprite.displayWidth, 68);
  assert.equal(tower.sprite.originY, 0.344);
  assert.equal(tower.head.textureKey, "tower_basic_head_t1");
  assert.equal(tower.head.originX, 0.485);
  assert.equal(system.getTowerAt(331, 300), undefined);
  assert.equal(system.getTowerAt(331, 300, { touch: true }), tower);
  assert.deepEqual(system.getPlacementStatusAt(300, 300), {
    valid: false,
    reason: "Occupied",
  });

  assert.equal(system.tryUpgradeTower(tower), true);
  assert.equal(tower.tier, 2);
  assert.equal(tower.sprite.textureKey, "tower_basic_base");
  assert.equal(tower.sprite.displayWidth, 72);
  assert.equal(tower.head.textureKey, "tower_basic_head_t2");
  assert.equal(tower.head.originX, 0.455);
  assert.equal(state.money, 375);
  assert.equal(system.trySellTower(tower), true);
  assert.equal(state.money, 462);
  assert.equal(scene.towers.length, 0);
  assert.deepEqual(sounds, ["place", "upgrade", "sell"]);
});
