import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import { DIFFICULTY_CONFIG } from "../src/game/config.js";
import {
  EnemySystem,
  attachEnemySystem,
  getEnemyArtPresentation,
} from "../src/systems/EnemySystem.js";

function makeEnemy(x, y) {
  const destroyListeners = [];
  return {
    active: true,
    x,
    y,
    body: { setAllowGravity() {} },
    setDepth() { return this; },
    setCollideWorldBounds() { return this; },
    setTint() { return this; },
    once(event, callback) {
      if (event === "destroy") destroyListeners.push(callback);
      return this;
    },
    destroy() {
      if (!this.active) return;
      this.active = false;
      destroyListeners.forEach((callback) => callback());
    },
  };
}

function makeGraphics() {
  return {
    active: true,
    setDepth() { return this; },
    setVisible() { return this; },
    setPosition() { return this; },
    clear() { return this; },
    fillStyle() { return this; },
    fillRect() { return this; },
    fillPoints() { return this; },
    lineStyle() { return this; },
    strokePoints() { return this; },
    destroy() { this.active = false; },
  };
}

test("enemy system owns spawn, movement, targeting, and leaks", () => {
  const members = [];
  const group = {
    children: { iterate(callback) { [...members].forEach(callback); } },
    add(enemy) { members.push(enemy); },
    countActive() { return members.filter((enemy) => enemy.active).length; },
    clear() { members.splice(0); },
  };
  const scene = {
    physics: {
      add: {
        group: () => group,
        image: (x, y) => makeEnemy(x, y),
      },
    },
    add: { graphics: makeGraphics },
  };
  const state = new RunState({ startingLives: 2, startScreenActive: false });
  const events = [];
  const system = new EnemySystem({
    scene,
    path: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    runController: new RunController(state),
    getWave: () => 15,
    getDifficulty: () => DIFFICULTY_CONFIG.hard,
    onSpawn: (enemy) => events.push(`spawn:${enemy.typeKey}`),
    onLeak: (enemy) => events.push(`leak:${enemy.typeKey}`),
    onLifeLost: () => events.push("life"),
    onGameOver: () => { state.isGameOver = true; events.push("gameover"); },
  });
  attachEnemySystem(scene, system);

  const sprinter = system.spawn("sprinter");
  assert.equal(scene.enemies, group);
  assert.equal(system.countActive(), 1);
  assert.equal(system.findTarget({ type: "rapid", x: 0, y: 0, range: 200 }, "preferred"), sprinter);

  system.update(100);
  assert.ok(sprinter.x > 0);
  sprinter.pathIndex = 1;
  system.update(16);
  assert.equal(state.lives, 1);
  assert.deepEqual(events, ["spawn:sprinter", "leak:sprinter", "life"]);

  const remaining = [system.spawn("runner"), system.spawn("brute")];
  remaining.forEach((enemy) => { enemy.pathIndex = 1; });
  system.update(16);
  assert.equal(state.lives, 0);
  assert.equal(state.isGameOver, true);
  assert.equal(remaining[1].active, true, "no extra escapes after the fatal leak in the same frame");
  assert.equal(events.filter((event) => event === "gameover").length, 1);
});

test("Runner bitmap art keeps a compact untinted gameplay footprint", () => {
  assert.deepEqual(getEnemyArtPresentation("runner", 192), {
    displayWidth: 34,
    displayHeight: 23,
    useTint: false,
  });
  assert.deepEqual(getEnemyArtPresentation("runner", 24), {
    displayWidth: null,
    displayHeight: null,
    useTint: true,
  });
});

test("enemy teardown tolerates Phaser destroying the group before scene cleanup", () => {
  let destroyed = false;
  const group = {
    children: {},
    destroy() { destroyed = true; this.children = undefined; },
    clear() { assert.fail("clear is unsafe after Phaser shutdown"); },
  };
  const system = new EnemySystem({
    scene: { physics: { add: { group: () => group } } },
  });
  group.destroy();
  assert.doesNotThrow(() => system.destroy());
  assert.doesNotThrow(() => system.destroy());
  assert.equal(destroyed, true);
  assert.equal(system.group, null);
});
