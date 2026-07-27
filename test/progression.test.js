import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_DEFS, TOWER_DEFS } from "../src/constants.js";
import { DIFFICULTY_CONFIG } from "../src/game/config.js";
import { computeEnemyHp } from "../src/game/enemies.js";
import { computeWaveConfig } from "../src/game/waves.js";

const waveConfig = (wave) => computeWaveConfig.call({ intermissionMs: 5000 }, wave);
const weightMap = (wave) =>
  Object.fromEntries(waveConfig(wave).weights.map(({ key, w }) => [key, w]));

test("specialist towers unlock at their progression milestones", () => {
  assert.equal(TOWER_DEFS.basic.unlockWave, 1);
  assert.equal(TOWER_DEFS.rapid.unlockWave, 10);
  assert.equal(TOWER_DEFS.sniper.unlockWave, 20);
  assert.equal(TOWER_DEFS.laser.unlockWave, 30);
});

test("waves before the Brute unlock remain Runner-only", () => {
  for (let wave = 1; wave < ENEMY_DEFS.brute.unlockWave; wave += 1) {
    assert.deepEqual(weightMap(wave), { runner: 1.6 });
  }
});

test("Brutes first appear on wave 22 and ramp gradually", () => {
  assert.equal(ENEMY_DEFS.brute.unlockWave, 22);
  assert.deepEqual(weightMap(20), { runner: 1.6 });
  assert.deepEqual(weightMap(21), { runner: 1.6 });
  assert.deepEqual(weightMap(22), { runner: 1.6, brute: 0.35 });
  assert.ok(Math.abs(weightMap(27).brute - 0.775) < Number.EPSILON);
  assert.equal(weightMap(32).brute, 1.2);
  assert.equal(weightMap(50).brute, 1.2);
  assert.equal(weightMap(29).armored, undefined);
});

test("Armored enemies arrive with Laser and ramp gradually", () => {
  assert.equal(weightMap(30).armored, 0.25);
  assert.equal(weightMap(36).armored, 0.625);
  assert.equal(weightMap(42).armored, 1);
  assert.equal(weightMap(60).armored, 1);
});

test("Runner pack pressure ramps gently from waves 10 through 15", () => {
  const packs = [];
  for (let wave = 9; wave <= 16; wave += 1) {
    const { packEvery, packSize } = waveConfig(wave);
    packs.push({ wave, packEvery, packSize });
  }

  assert.deepEqual(packs, [
    { wave: 9, packEvery: 12, packSize: 2 },
    { wave: 10, packEvery: 11, packSize: 3 },
    { wave: 11, packEvery: 11, packSize: 3 },
    { wave: 12, packEvery: 9, packSize: 3 },
    { wave: 13, packEvery: 9, packSize: 4 },
    { wave: 14, packEvery: 9, packSize: 4 },
    { wave: 15, packEvery: 8, packSize: 4 },
    { wave: 16, packEvery: 8, packSize: 5 },
  ]);
});

test("Brute HP class scaling starts at zero on its unlock wave", () => {
  const def = ENEMY_DEFS.brute;
  const expected = Math.floor(
    def.baseHp *
      DIFFICULTY_CONFIG.hard.enemyHpMul *
      2 *
      1.225 *
      Math.pow(1.03, 10)
  );

  assert.equal(computeEnemyHp(def, 22, DIFFICULTY_CONFIG.hard), expected);
});

test("Brute HP receives one wave of class scaling at wave 23", () => {
  const def = ENEMY_DEFS.brute;
  const expected = Math.floor(
    def.baseHp *
      (1 + def.scaleHpPerWave) *
      DIFFICULTY_CONFIG.hard.enemyHpMul *
      2 *
      1.225 *
      Math.pow(1.03, 11)
  );

  assert.equal(computeEnemyHp(def, 23, DIFFICULTY_CONFIG.hard), expected);
});

test("wave-1 Runner HP behavior remains unchanged", () => {
  const def = ENEMY_DEFS.runner;
  const oldFormulaHp = Math.floor(
    def.baseHp *
      (1 + (1 - 1) * def.scaleHpPerWave) *
      DIFFICULTY_CONFIG.hard.enemyHpMul
  );

  assert.equal(computeEnemyHp(def, 1, DIFFICULTY_CONFIG.hard), oldFormulaHp);
});

test("Armored HP class scaling is relative to its later unlock wave", () => {
  const def = ENEMY_DEFS.armored;
  const globalHpMulAt = (wave) =>
    DIFFICULTY_CONFIG.hard.enemyHpMul *
    2 *
    1.225 *
    Math.pow(1.03, wave - 12);

  assert.equal(
    computeEnemyHp(def, 30, DIFFICULTY_CONFIG.hard),
    Math.floor(def.baseHp * globalHpMulAt(30))
  );
  assert.equal(
    computeEnemyHp(def, 32, DIFFICULTY_CONFIG.hard),
    Math.floor(
      def.baseHp *
        (1 + 2 * def.scaleHpPerWave) *
        globalHpMulAt(32)
    )
  );
});
