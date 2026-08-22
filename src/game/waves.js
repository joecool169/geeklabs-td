import { clamp01, ENEMY_DEFS, WAVE_CADENCE } from "../constants.js";
import { pickWeighted } from "./enemies.js";
import { createWaveRandom } from "./random.js";

function computeSpawnTopology(total, packEvery, packSize) {
  let spawned = 0;
  let randomSpawns = 0;
  let forcedRunners = 0;
  let packSpacingCount = 0;
  let endsWithPack = false;
  while (spawned < total) {
    const shouldPack =
      packEvery > 0 &&
      spawned > 0 &&
      spawned % packEvery === 0;
    if (shouldPack) {
      const packCount = Math.min(packSize, total - spawned);
      forcedRunners += packCount;
      packSpacingCount += Math.max(0, packCount - 1);
      spawned += packCount;
      endsWithPack = true;
    } else {
      randomSpawns += 1;
      spawned += 1;
      endsWithPack = false;
    }
  }
  return {
    randomSpawns,
    forcedRunners,
    packSpacingCount,
    endsWithPack,
  };
}

function computeWaveConfig(wave) {
  const w = Math.max(1, wave);
  const rawTotal = Math.floor(8 + w * 2.6 + Math.min(16, w * 1.2));
  const weights = [{ key: "runner", w: 1.6 }];
  const bruteUnlockWave = ENEMY_DEFS.brute.unlockWave;
  if (w >= bruteUnlockWave) {
    const bruteW = 0.35 + clamp01((w - bruteUnlockWave) / 10) * 0.85;
    weights.push({ key: "brute", w: bruteW });
  }
  if (w >= 30) {
    const armoredW = 0.25 + clamp01((w - 30) / 12) * 0.75;
    weights.push({ key: "armored", w: armoredW });
  }
  const basePackEvery = Math.max(10, 16 - Math.floor(w / 2));
  const basePackSize = Math.min(6, 2 + Math.floor(w / 4));
  const t = clamp01((w - 1) / 9);
  const countMul = 1 - 0.5 * t;
  const reducedTotal = Math.max(6, Math.floor(rawTotal * countMul));
  const densityBonus =
    w <= 3
      ? 0
      : Math.floor(
          Math.min(6, (w - 3) * 1.5) +
            Math.max(0, w - 7) * 0.8
        );
  const total = reducedTotal + densityBonus;
  const pressureRamp = clamp01((w - 3) / 9);
  const cadenceFloorMs = Math.max(
    WAVE_CADENCE.minimumMs,
    WAVE_CADENCE.preparationFloorMs -
      WAVE_CADENCE.lateRampPerWaveMs *
        Math.max(0, w - WAVE_CADENCE.lateRampStartWave)
  );
  const averageSpawnDelayMs = Math.max(
    cadenceFloorMs,
    Math.floor(
      Math.max(280, 700 - w * 16) *
        (1 - 0.15 * pressureRamp)
    )
  );
  // Introduce a modest Runner-pack ramp alongside Rapid without changing the
  // onboarding pressure before wave 10.
  const rapidPhaseRamp = w >= 10 ? clamp01((w - 9) / 6) : 0;
  const packFrequencyBonus = Math.floor(rapidPhaseRamp * 2);
  const packSizeBonus = Math.ceil(rapidPhaseRamp * 2);
  const packEvery = basePackEvery - packFrequencyBonus;
  const reducedPackSize =
    Math.max(2, Math.floor(basePackSize * countMul)) + packSizeBonus;
  const spawnTopology = computeSpawnTopology(
    total,
    packEvery,
    reducedPackSize
  );
  const { randomSpawns, packSpacingCount, endsWithPack } = spawnTopology;
  const ordinarySlots = Math.ceil(total * countMul);
  const targetSpawnDurationMs =
    Math.max(0, ordinarySlots - 1) * averageSpawnDelayMs +
    Math.max(0, total - ordinarySlots) * WAVE_CADENCE.packSpacingMs;
  const delayCount = Math.max(
    1,
    randomSpawns - (endsWithPack ? 0 : 1)
  );
  const spawnDelayMs = Math.max(
    WAVE_CADENCE.packSpacingMs,
    Math.round(
      (targetSpawnDurationMs -
        packSpacingCount * WAVE_CADENCE.packSpacingMs) /
        delayCount
    )
  );
  return {
    total,
    spawnDelayMs,
    averageSpawnDelayMs,
    targetSpawnDurationMs,
    spawnTopology,
    weights,
    packEvery,
    packSize: reducedPackSize,
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
      const waveNumber = this.nextWaveNumberToSpawn ?? this.wave;
      startWave.call(this, waveNumber);
      if (typeof this.nextWaveNumberToSpawn === "number") this.nextWaveNumberToSpawn += 1;
      if (!this.didStartFirstWave) this.didStartFirstWave = true;
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
    random: createWaveRandom(this.runSeed, wave),
  });
  this.waveState = "running";
  if (this.showWaveTransition) this.showWaveTransition(`WAVE ${wave} ENGAGED`);
}

function updateWaveSpawning(time) {
  if (this.waveState !== "running") return;

  if (!this.activeWaves || this.activeWaves.length === 0) return;

  for (const spawner of this.activeWaves) {
    if (spawner.swarmPacksRemaining > 0 && time >= spawner.swarmNextPackSpawnAt) {
      this.spawnEnemyOfType("runner", {
        isSwarm: true,
        waveNumber: spawner.waveNumber,
      });
      spawner.enemiesSpawned += 1;
      spawner.swarmPacksRemaining -= 1;
      spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
      continue;
    }

    if (spawner.enemiesSpawned >= spawner.enemiesTotal) continue;
    if (time < spawner.nextSpawnAt) continue;

    const cfg = spawner.cfg;
    const shouldPack =
      cfg.packEvery > 0 &&
      spawner.enemiesSpawned > 0 &&
      spawner.enemiesSpawned % cfg.packEvery === 0;

    if (shouldPack) {
      const toSpawn = Math.min(cfg.packSize, spawner.enemiesTotal - spawner.enemiesSpawned);
      this.spawnEnemyOfType("runner", {
        isSwarm: true,
        waveNumber: spawner.waveNumber,
      });
      spawner.enemiesSpawned += 1;
      spawner.swarmPacksRemaining = Math.max(0, toSpawn - 1);
      spawner.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
    } else {
      const r = spawner.random();
      const type = pickWeighted.call(this, r, cfg.weights) || "runner";
      this.spawnEnemyOfType(type, { waveNumber: spawner.waveNumber });
      spawner.enemiesSpawned += 1;
    }

    spawner.nextSpawnAt = time + spawner.spawnDelayMs;
  }
}

export { computeWaveConfig, enterIntermission, tryStartWave, startWave, updateWaveSpawning };
