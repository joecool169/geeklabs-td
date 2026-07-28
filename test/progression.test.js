import test from "node:test";
import assert from "node:assert/strict";

import { TOWER_DEFS } from "../src/constants.js";
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

test("waves before 20 remain Runner-only", () => {
  for (let wave = 1; wave < 20; wave += 1) {
    assert.deepEqual(weightMap(wave), { runner: 1.6 });
  }
});

test("Brutes arrive with Sniper and ramp gradually", () => {
  assert.deepEqual(weightMap(20), { runner: 1.6, brute: 0.35 });
  assert.ok(Math.abs(weightMap(25).brute - 0.775) < Number.EPSILON);
  assert.equal(weightMap(30).brute, 1.2);
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
