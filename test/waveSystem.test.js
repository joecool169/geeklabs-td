import test from "node:test";
import assert from "node:assert/strict";

import { RunController } from "../src/core/RunController.js";
import { RunState } from "../src/core/RunState.js";
import { computeClearBonus } from "../src/game/balance.js";
import { WaveSystem, attachWaveSystem } from "../src/systems/WaveSystem.js";

test("wave system owns launch, deterministic spawning, and completion", () => {
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
  const system = new WaveSystem({
    scene,
    runController: new RunController(state),
    enemySystem: {
      spawn(type, options) { spawned.push([type, options.waveNumber]); },
      countActive() { return activeEnemies; },
    },
    getRunSeed: () => "wave-system-test",
    onWavesCleared: (first, last) => cleared.push([first, last]),
    autoStartWaves: false,
  });
  attachWaveSystem(scene, system);

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
