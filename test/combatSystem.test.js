import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import { createRunTelemetry } from "../src/game/telemetry.js";
import { CombatSystem } from "../src/systems/CombatSystem.js";

test("combat system clips telemetry damage and owns kill rewards", () => {
  const state = new RunState({ startScreenActive: false });
  const telemetry = createRunTelemetry({
    seed: "combat-test",
    difficultyKey: "hard",
  });
  const sounds = [];
  const combat = new CombatSystem({
    scene: { playSfx: (key) => sounds.push(key) },
    towerSystem: { towers: [] },
    enemySystem: {},
    runController: new RunController(state),
    getDifficulty: () => ({ scoreMul: 1.4 }),
    getTelemetry: () => telemetry,
  });
  const tower = { type: "basic" };
  const enemy = {
    active: true,
    typeKey: "runner",
    hp: 5,
    armor: 0,
    reward: 7,
    scoreWeight: 2,
    destroy() { this.active = false; },
  };

  assert.equal(combat.applyDamage(tower, enemy, 10), 5);
  assert.equal(enemy.active, false);
  assert.equal(telemetry.damageByTowerType.basic, 5);
  assert.equal(telemetry.killedByType.runner, 1);
  assert.equal(telemetry.killsByTowerType.basic, 1);
  assert.equal(state.money, 7);
  assert.equal(state.kills, 1);
  assert.equal(state.score, 38);
  assert.deepEqual(sounds, ["death"]);
});

test("three-quarter Basic artwork stays upright while firing", () => {
  let rotations = 0;
  let shots = 0;
  const tower = {
    type: "basic",
    x: 100,
    y: 100,
    fireMs: 260,
    nextShotAt: 0,
    targetMode: "first",
    sprite: { setRotation() { rotations += 1; } },
  };
  const target = { active: true, x: 20, y: 100 };
  const combat = new CombatSystem({
    scene: {},
    towerSystem: { towers: [tower] },
    enemySystem: { findTarget: () => target },
    runController: {},
    getDifficulty: () => ({}),
    getTelemetry: () => null,
  });
  combat.projectiles.fire = () => { shots += 1; };
  combat.projectiles.update = () => {};

  combat.update(1, 16);

  assert.equal(shots, 1);
  assert.equal(rotations, 0);
});
