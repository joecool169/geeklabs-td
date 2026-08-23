import { WAVE_CADENCE } from "../constants.js";
import {
  MAX_CONCURRENT_SPAWNERS,
  WAVE_SPAM_WINDOW_MS,
} from "../game/config.js";
import { computeClearBonus } from "../game/balance.js";
import { pickWeighted } from "../game/enemies.js";
import { createWaveRandom } from "../game/random.js";
import { computeWaveConfig } from "../game/waves.js";

const WAVE_SYSTEM_FIELDS = Object.freeze([
  "intermissionMs",
  "nextWaveAvailableAt",
  "autoStartWaves",
  "autoStartTimer",
  "didStartFirstWave",
  "activeWaves",
  "spaceArmedAt",
  "spaceArmMode",
  "nextWaveNumberToSpawn",
  "blockWaveStart",
  "swarmPackSpacingMs",
]);

class WaveSystem {
  constructor({
    scene,
    runController,
    enemySystem,
    getRunSeed,
    showToast = () => {},
    showTransition = () => {},
    playWaveSfx = () => {},
    onWavesCleared = () => {},
    intermissionMs = 2000,
    autoStartWaves = true,
  }) {
    this.scene = scene;
    this.runController = runController;
    this.enemySystem = enemySystem;
    this.getRunSeed = getRunSeed;
    this.showToast = showToast;
    this.showTransition = showTransition;
    this.playWaveSfx = playWaveSfx;
    this.onWavesCleared = onWavesCleared;
    this.intermissionMs = intermissionMs;
    this.autoStartWaves = autoStartWaves;
    this.nextWaveAvailableAt = 0;
    this.autoStartTimer = null;
    this.didStartFirstWave = false;
    this.activeWaves = [];
    this.spaceArmedAt = 0;
    this.spaceArmMode = null;
    this.nextWaveNumberToSpawn = this.state.wave;
    this.blockWaveStart = this.state.wave;
    this.swarmPackSpacingMs = WAVE_CADENCE.packSpacingMs;
  }

  get state() {
    return this.runController.state;
  }

  computeConfig(wave) {
    return computeWaveConfig(wave, this.intermissionMs);
  }

  enterIntermission(isInitial = false) {
    this.state.waveState = "intermission";
    this.activeWaves = [];
    this.nextWaveNumberToSpawn = this.state.wave;
    this.blockWaveStart = this.state.wave;
    this.cancelAutoStart();
    if (isInitial && !this.didStartFirstWave) {
      this.nextWaveAvailableAt = this.scene.time.now;
      return;
    }
    this.nextWaveAvailableAt = this.scene.time.now + this.intermissionMs;
    if (!this.autoStartWaves) return;
    this.autoStartTimer = this.scene.time.delayedCall(
      this.intermissionMs,
      () => {
        if (this.state.isPaused || this.state.waveState !== "intermission") {
          return;
        }
        this.startNextWave();
      }
    );
  }

  cancelAutoStart() {
    this.autoStartTimer?.remove(false);
    this.autoStartTimer = null;
  }

  startNextWave() {
    this.startWave(this.nextWaveNumberToSpawn);
    this.nextWaveNumberToSpawn += 1;
    this.didStartFirstWave = true;
  }

  tryStartWave() {
    if (this.state.waveState !== "intermission") return false;
    if (this.scene.time.now < this.nextWaveAvailableAt) return false;
    this.startNextWave();
    return true;
  }

  startWave(wave) {
    const config = this.computeConfig(wave);
    this.activeWaves.push({
      waveNumber: wave,
      cfg: config,
      enemiesTotal: config.total,
      enemiesSpawned: 0,
      spawnDelayMs: config.spawnDelayMs,
      nextSpawnAt: this.scene.time.now + 250,
      swarmPacksRemaining: 0,
      swarmNextPackSpawnAt: 0,
      random: createWaveRandom(this.getRunSeed(), wave),
    });
    this.state.waveState = "running";
    this.playWaveSfx();
    this.showTransition(`WAVE ${wave} ENGAGED`);
  }

  handleStartInput(now) {
    if (this.state.waveState === "intermission") {
      if (now < this.nextWaveAvailableAt) {
        if (
          this.spaceArmMode === "intermission" &&
          now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS
        ) {
          this.spaceArmedAt = 0;
          this.spaceArmMode = null;
          this.nextWaveAvailableAt = Math.min(this.nextWaveAvailableAt, now);
          this.startNextWave();
        } else {
          this.spaceArmedAt = now;
          this.spaceArmMode = "intermission";
          this.showToast("Press SPACE again to start early.", 1400);
        }
        return;
      }
      this.spaceArmedAt = 0;
      this.spaceArmMode = null;
      this.startNextWave();
      return;
    }
    if (this.state.waveState !== "running") return;
    if (this.activeWaves.length >= MAX_CONCURRENT_SPAWNERS) {
      this.showToast(
        `Spawner cap reached (${MAX_CONCURRENT_SPAWNERS}).`,
        1400
      );
      return;
    }
    if (
      this.spaceArmMode === "running" &&
      now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS
    ) {
      this.spaceArmedAt = 0;
      this.spaceArmMode = null;
      this.startNextWave();
      return;
    }
    this.spaceArmedAt = now;
    this.spaceArmMode = "running";
    this.showToast("Press SPACE again to add a spawner.", 1400);
  }

  update(time) {
    this.updateSpawning(time);
    if (this.state.waveState !== "running") return;
    const allDone =
      this.activeWaves.length > 0 &&
      this.activeWaves.every(
        (spawner) => spawner.enemiesSpawned >= spawner.enemiesTotal
      );
    if (!allDone || this.enemySystem.countActive() > 0) return;

    const wavesCleared = Math.max(
      1,
      this.nextWaveNumberToSpawn - this.blockWaveStart
    );
    const firstWave = this.blockWaveStart;
    const lastWave = this.nextWaveNumberToSpawn - 1;
    this.showTransition(
      wavesCleared === 1
        ? `WAVE ${firstWave} COMPLETE`
        : `WAVES ${firstWave}–${lastWave} COMPLETE`,
      "positive",
      1200
    );
    for (let wave = firstWave; wave <= lastWave; wave += 1) {
      this.runController.awardWaveClear(computeClearBonus(wave));
    }
    this.onWavesCleared(firstWave, lastWave);
    this.state.wave = this.nextWaveNumberToSpawn;
    this.enterIntermission(false);
  }

  updateSpawning(time) {
    if (this.state.waveState !== "running" || this.activeWaves.length === 0) {
      return;
    }
    for (const spawner of this.activeWaves) {
      if (
        spawner.swarmPacksRemaining > 0 &&
        time >= spawner.swarmNextPackSpawnAt
      ) {
        this.spawn(spawner, "runner", true);
        spawner.swarmPacksRemaining -= 1;
        spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
        continue;
      }
      if (
        spawner.enemiesSpawned >= spawner.enemiesTotal ||
        time < spawner.nextSpawnAt
      ) {
        continue;
      }
      const config = spawner.cfg;
      const shouldPack =
        config.packEvery > 0 &&
        spawner.enemiesSpawned > 0 &&
        spawner.enemiesSpawned % config.packEvery === 0;
      if (shouldPack) {
        const packSize = Math.min(
          config.packSize,
          spawner.enemiesTotal - spawner.enemiesSpawned
        );
        this.spawn(spawner, "runner", true);
        spawner.swarmPacksRemaining = Math.max(0, packSize - 1);
        spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
      } else {
        const type = pickWeighted(spawner.random(), config.weights) || "runner";
        this.spawn(spawner, type, false);
      }
      spawner.nextSpawnAt = time + spawner.spawnDelayMs;
    }
  }

  spawn(spawner, type, isSwarm) {
    this.enemySystem.spawn(type, {
      isSwarm,
      waveNumber: spawner.waveNumber,
    });
    spawner.enemiesSpawned += 1;
  }

  destroy() {
    this.cancelAutoStart();
    this.activeWaves = [];
  }
}

function attachWaveSystem(scene, waveSystem) {
  scene.waveSystem = waveSystem;
  for (const field of WAVE_SYSTEM_FIELDS) {
    Object.defineProperty(scene, field, {
      configurable: true,
      enumerable: true,
      get: () => waveSystem[field],
      set: (value) => {
        waveSystem[field] = value;
      },
    });
  }
  return waveSystem;
}

export { WAVE_SYSTEM_FIELDS, WaveSystem, attachWaveSystem };
