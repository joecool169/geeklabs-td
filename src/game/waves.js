import { clamp01 } from "../constants.js";
import { pickWeighted } from "./enemies.js";

function computeWaveConfig(wave) {
  const w = Math.max(1, wave);
  const total = Math.floor(8 + w * 2.6 + Math.min(16, w * 1.2));
  const spawnDelayMs = Math.max(280, 700 - w * 16);
  const bruteW = clamp01((w - 10) / 10) * 0.9;
  const armoredW = clamp01((w - 20) / 10) * 0.8;
  const weights = [{ key: "runner", w: 1.6 }];
  if (w >= 10) weights.push({ key: "brute", w: 0.6 + bruteW });
  if (w >= 20) weights.push({ key: "armored", w: 0.15 + armoredW });
  const packEvery = Math.max(10, 16 - Math.floor(w / 2));
  const packSize = Math.min(6, 2 + Math.floor(w / 4));
  return {
    total,
    spawnDelayMs,
    weights,
    packEvery,
    packSize,
    intermissionMs: this.intermissionMs,
  };
}

function enterIntermission(isInitial = false) {
  this.waveState = "intermission";
  this.activeWaves = [];
  this.waveEnemiesTotal = 0;
  this.waveEnemiesSpawned = 0;
  this.waveNextSpawnAt = 0;
  this.swarmPacksRemaining = 0;
  this.swarmNextPackSpawnAt = 0;

  if (this.autoStartTimer) {
    this.autoStartTimer.remove(false);
    this.autoStartTimer = null;
  }

  if (isInitial && !this.didStartFirstWave) {
    this.nextWaveAvailableAt = this.time.now;
    return;
  }

  this.nextWaveAvailableAt = this.time.now + this.intermissionMs;

  if (this.autoStartWaves) {
    this.autoStartTimer = this.time.delayedCall(this.intermissionMs, () => {
      if (this.isPaused) return;
      if (this.waveState !== "intermission") return;
      startWave.call(this, this.wave);
    });
  }
}

function tryStartWave() {
  if (this.waveState !== "intermission") return;
  if (this.time.now < this.nextWaveAvailableAt) return;
  startWave.call(this, this.wave);
  if (!this.didStartFirstWave) this.didStartFirstWave = true;
}

function startWave(wave) {
  const cfg = computeWaveConfig.call(this, wave);
  if (!this.activeWaves) this.activeWaves = [];
  this.activeWaves.push({
    waveNumber: wave,
    cfg,
    enemiesTotal: cfg.total,
    enemiesSpawned: 0,
    spawnDelayMs: cfg.spawnDelayMs,
    nextSpawnAt: this.time.now + 250,
    swarmPacksRemaining: 0,
    swarmNextPackSpawnAt: 0,
  });
  this.waveState = "running";
}

function updateWaveSpawning(time) {
  if (this.waveState !== "running") return;

  if (!this.activeWaves || this.activeWaves.length === 0) return;

  for (const spawner of this.activeWaves) {
    if (spawner.swarmPacksRemaining > 0 && time >= spawner.swarmNextPackSpawnAt) {
      this.spawnEnemyOfType("runner", { isSwarm: true });
      spawner.enemiesSpawned += 1;
      spawner.swarmPacksRemaining -= 1;
      spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
      continue;
    }

    if (spawner.enemiesSpawned >= spawner.enemiesTotal) continue;
    if (time < spawner.nextSpawnAt) continue;

    const cfg = spawner.cfg;
    const shouldPack =
      cfg.packEvery > 0 && spawner.enemiesSpawned > 0 && spawner.enemiesSpawned % cfg.packEvery === 0;

    if (shouldPack) {
      const toSpawn = Math.min(cfg.packSize, spawner.enemiesTotal - spawner.enemiesSpawned);
      this.spawnEnemyOfType("runner", { isSwarm: true });
      spawner.enemiesSpawned += 1;
      spawner.swarmPacksRemaining = Math.max(0, toSpawn - 1);
      spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
    } else {
      const r = Math.random();
      const type = pickWeighted.call(this, r, cfg.weights) || "runner";
      this.spawnEnemyOfType(type);
      spawner.enemiesSpawned += 1;
    }

    spawner.nextSpawnAt = time + spawner.spawnDelayMs;
  }
}

export { computeWaveConfig, enterIntermission, tryStartWave, startWave, updateWaveSpawning };
