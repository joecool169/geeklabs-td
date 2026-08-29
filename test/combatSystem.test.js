import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import { createRunTelemetry } from "../src/game/telemetry.js";
import {
  CombatSystem,
  coolLaserHeat,
  getLaserHeatMultiplier,
} from "../src/systems/CombatSystem.js";
import { TOWER_DEFS } from "../src/constants.js";

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

test("Basic weapon head swivels while its three-quarter base stays upright", () => {
  let baseRotations = 0;
  let headAngle = null;
  let shots = 0;
  const tower = {
    type: "basic",
    x: 100,
    y: 100,
    fireMs: 260,
    nextShotAt: 0,
    targetMode: "first",
    sprite: { setRotation() { baseRotations += 1; } },
    head: { setRotation(angle) { headAngle = angle; } },
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
  assert.equal(baseRotations, 0);
  assert.equal(headAngle, Math.PI);
});

test("Laser reaches full heat in two seconds and cools over idle time", () => {
  const def = TOWER_DEFS.laser;
  assert.equal(getLaserHeatMultiplier(def, 0), 1);
  assert.equal(getLaserHeatMultiplier(def, 1000), 1.75);
  assert.equal(getLaserHeatMultiplier(def, 2000), 2.5);
  assert.equal(getLaserHeatMultiplier(def, 5000), 2.5);

  const tower = { heatMs: 2000 };
  coolLaserHeat(tower, def, 375);
  assert.equal(tower.heatMs, 1500);
  coolLaserHeat(tower, def, 2000);
  assert.equal(tower.heatMs, 0);
});

test("Laser preserves heat when Armored Priority preempts a valid target", () => {
  const runner = { active: true, typeKey: "runner", x: 20, y: 0 };
  const armored = { active: true, typeKey: "armored", x: 30, y: 0 };
  const tower = {
    type: "laser", x: 0, y: 0, range: 100, fireMs: 110,
    targetMode: "preferred", lockTarget: runner, heatMs: 1000,
    beamAcc: 0, beamTickMs: 110,
  };
  const combat = new CombatSystem({
    scene: {},
    towerSystem: { towers: [tower] },
    enemySystem: { findTarget: () => armored },
    runController: {},
    getDifficulty: () => ({}),
    getTelemetry: () => null,
  });

  combat.updateLaser(tower, 50);

  assert.equal(tower.lockTarget, armored);
  assert.equal(tower.heatMs, 1050);
});

test("Laser carries heat to a replacement target and decays only while idle", () => {
  const expired = { active: false, typeKey: "armored", x: 20, y: 0 };
  const replacement = { active: true, typeKey: "runner", x: 30, y: 0 };
  let nextTarget = replacement;
  const tower = {
    type: "laser", x: 0, y: 0, range: 100, fireMs: 110,
    targetMode: "first", lockTarget: expired, heatMs: 1800,
    beamAcc: 0, beamTickMs: 110,
  };
  const combat = new CombatSystem({
    scene: {},
    towerSystem: { towers: [tower] },
    enemySystem: { findTarget: () => nextTarget },
    runController: {},
    getDifficulty: () => ({}),
    getTelemetry: () => null,
  });

  combat.updateLaser(tower, 50);
  assert.equal(tower.lockTarget, replacement);
  assert.equal(tower.heatMs, 1850);

  replacement.active = false;
  nextTarget = null;
  combat.updateLaser(tower, 300);
  assert.equal(tower.lockTarget, null);
  assert.equal(tower.heatMs, 1450);
});
