import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import { computeClearBonus } from "../src/game/balance.js";
import { MAX_CONCURRENT_SPAWNERS, WAVE_SPAM_WINDOW_MS } from "../src/game/config.js";
import { WaveSystem, attachWaveSystem } from "../src/systems/WaveSystem.js";

function makeWaveSystem() {
  const timers = [];
  const scene = {
    time: {
      now: 100,
      delayedCall(delay, callback) {
        const timer = {
          delay,
          callback,
          paused: false,
          remove() { this.removed = true; },
        };
        timers.push(timer);
        return timer;
      },
    },
  };
  const state = new RunState({ startScreenActive: false });
  const spawned = [];
  let activeEnemies = 0;
  const cleared = [];
  const toasts = [];
  const system = new WaveSystem({
    scene,
    runController: new RunController(state),
    enemySystem: {
      spawn(type, options) { spawned.push([type, options.waveNumber]); },
      countActive() { return activeEnemies; },
    },
    getRunSeed: () => "wave-system-test",
    onWavesCleared: (first, last) => cleared.push([first, last]),
    showToast: (message) => toasts.push(message),
    autoStartWaves: false,
  });
  attachWaveSystem(scene, system);
  return { scene, state, system, spawned, cleared, timers, toasts };
}

test("wave system owns launch, deterministic spawning, and completion", () => {
  const { scene, state, system, spawned, cleared, timers } = makeWaveSystem();
  system.enterIntermission(true);
  assert.equal(scene.nextWaveAvailableAt, 100);
  system.handleStartInput(100);
  assert.equal(state.waveState, "running");
  assert.equal(scene.nextWaveNumberToSpawn, 2);

  const spawner = system.activeWaves[0];
  spawner.enemiesSpawned = spawner.enemiesTotal;
  system.update(500);
  assert.deepEqual(cleared, [[1, 1]]);
  assert.equal(state.wave, 2);
  assert.equal(state.waveState, "intermission");
  assert.equal(state.money, computeClearBonus(1));
  assert.equal(state.score, computeClearBonus(1));
  assert.deepEqual(spawned, []);
  assert.deepEqual(timers, []);
});

test("touch wave button launches immediately without confirmation toasts", () => {
  const { system, state, toasts } = makeWaveSystem();
  const touchInput = { requireConfirmation: false };

  system.enterIntermission(true);
  system.handleStartInput(100, touchInput);
  assert.equal(state.waveState, "running");
  assert.equal(system.nextWaveNumberToSpawn, 2);

  system.handleStartInput(200, touchInput);
  assert.deepEqual(system.activeWaves.map((wave) => wave.waveNumber), [1, 2]);

  for (const wave of system.activeWaves) wave.enemiesSpawned = wave.enemiesTotal;
  system.update(300);
  assert.equal(state.wave, 3);
  assert.equal(state.waveState, "intermission");
  assert.ok(system.nextWaveAvailableAt > 400);

  system.handleStartInput(400, touchInput);
  assert.equal(state.waveState, "running");
  assert.deepEqual(system.activeWaves.map((wave) => wave.waveNumber), [3]);
  assert.equal(system.spaceArmMode, null);
  assert.deepEqual(toasts, []);
});

test("touch wave button still respects the concurrent spawner cap", () => {
  const { system, toasts } = makeWaveSystem();
  system.enterIntermission(true);
  for (let i = 0; i <= MAX_CONCURRENT_SPAWNERS; i += 1) {
    system.handleStartInput(100 + i, { requireConfirmation: false });
  }
  assert.equal(system.activeWaves.length, MAX_CONCURRENT_SPAWNERS);
  assert.equal(system.nextWaveNumberToSpawn, MAX_CONCURRENT_SPAWNERS + 1);
  assert.deepEqual(toasts, [`Spawner cap reached (${MAX_CONCURRENT_SPAWNERS}).`]);
});

test("keyboard input retains confirmation for early and concurrent waves", () => {
  const { system, state, toasts } = makeWaveSystem();
  system.enterIntermission(false);

  system.handleStartInput(100);
  assert.equal(state.waveState, "intermission");
  assert.equal(toasts.at(-1), "Press SPACE again to start early.");
  system.handleStartInput(101);
  assert.equal(state.waveState, "running");
  assert.equal(system.activeWaves.length, 1);

  system.handleStartInput(200);
  assert.equal(system.activeWaves.length, 1);
  assert.equal(toasts.at(-1), "Press SPACE again to add a spawner.");
  const expired = 201 + WAVE_SPAM_WINDOW_MS;
  system.handleStartInput(expired);
  assert.equal(system.activeWaves.length, 1);
  system.handleStartInput(expired + 1);
  assert.equal(system.activeWaves.length, 2);
  assert.equal(system.spaceArmMode, null);
});
