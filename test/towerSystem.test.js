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
  setDepth() { return this; },
  setAlpha() { return this; },
  setTint() { return this; },
  setScale() { return this; },
  setPosition() { return this; },
  setTexture() { return this; },
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
    showToast() {},
    playSfx(key) { sounds.push(key); },
  };
  const system = new TowerSystem({ scene, world, runController });
  attachTowerSystem(scene, system);

  assert.equal(system.isTowerUnlocked("rapid"), true);
  assert.equal(system.isTowerUnlocked("sniper"), false);
  const tower = system.tryPlaceTowerAt(300, 300);
  assert.equal(tower.type, "basic");
  assert.equal(state.money, 450);
  assert.equal(scene.towers.length, 1);
  assert.equal(scene.selectedTower, tower);

  assert.equal(system.tryUpgradeTower(tower), true);
  assert.equal(tower.tier, 2);
  assert.equal(state.money, 375);
  assert.equal(system.trySellTower(tower), true);
  assert.equal(state.money, 462);
  assert.equal(scene.towers.length, 0);
  assert.deepEqual(sounds, ["place", "upgrade", "sell"]);
});
