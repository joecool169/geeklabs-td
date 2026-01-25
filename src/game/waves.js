import { clamp01 } from "../constants.js";
import { pickWeighted } from "./enemies.js";

function computeWaveConfig(wave) {
  const w = Math.max(1, wave);
  const total = Math.floor(10 + w * 3 + Math.min(18, w * 1.5));
  const spawnDelayMs = Math.max(260, 650 - w * 18);
  const bruteW = clamp01((w - 10) / 10) * 0.9;
  const armoredW = clamp01((w - 20) / 10) * 0.8;
  const weights = [{ key: "runner", w: 1.6 }];
  if (w >= 10) weights.push({ key: "brute", w: 0.6 + bruteW });
  if (w >= 20) weights.push({ key: "armored", w: 0.15 + armoredW });
  const packEvery = Math.max(9, 14 - Math.floor(w / 2));
  const packSize = Math.min(7, 3 + Math.floor(w / 3));
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
  this.waveState = "running";
  this.waveEnemiesTotal = cfg.total;
  this.waveEnemiesSpawned = 0;
  this.waveSpawnDelayMs = cfg.spawnDelayMs;
  this.waveNextSpawnAt = this.time.now + 250;
  this.waveCfg = cfg;
}

function updateWaveSpawning(time) {
  if (this.waveState !== "running") return;

  if (this.swarmPacksRemaining > 0 && time >= this.swarmNextPackSpawnAt) {
    this.spawnEnemyOfType("runner", { isSwarm: true });
    this.waveEnemiesSpawned += 1;
    this.swarmPacksRemaining -= 1;
    this.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
    return;
  }

  if (this.waveEnemiesSpawned >= this.waveEnemiesTotal) return;
  if (time < this.waveNextSpawnAt) return;

  const cfg = this.waveCfg || computeWaveConfig.call(this, this.wave);
  const shouldPack = cfg.packEvery > 0 && this.waveEnemiesSpawned > 0 && this.waveEnemiesSpawned % cfg.packEvery === 0;

  if (shouldPack) {
    const toSpawn = Math.min(cfg.packSize, this.waveEnemiesTotal - this.waveEnemiesSpawned);
    this.spawnEnemyOfType("runner", { isSwarm: true });
    this.waveEnemiesSpawned += 1;
    this.swarmPacksRemaining = Math.max(0, toSpawn - 1);
    this.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
  } else {
    const r = Math.random();
    const type = pickWeighted.call(this, r, cfg.weights) || "runner";
    this.spawnEnemyOfType(type);
    this.waveEnemiesSpawned += 1;
  }

  this.waveNextSpawnAt = time + this.waveSpawnDelayMs;
}

export { computeWaveConfig, enterIntermission, tryStartWave, startWave, updateWaveSpawning };
