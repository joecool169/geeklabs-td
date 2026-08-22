const BALANCE_CHECKPOINT_WAVES = Object.freeze([20, 25, 30, 35, 40]);
const TELEMETRY_VERSION = 1;

const incrementCount = (counts, key) => {
  if (!counts || !key) return;
  counts[key] = (counts[key] ?? 0) + 1;
};

function createRunTelemetry({
  seed,
  difficultyKey,
  runLabel = "unlabeled",
  startingLives = 20,
}) {
  const normalizedLabel = String(runLabel || "unlabeled").trim() || "unlabeled";
  return {
    version: TELEMETRY_VERSION,
    runId: `${difficultyKey}:${normalizedLabel}:${seed}`,
    runLabel: normalizedLabel,
    seed,
    difficultyKey,
    startingLives,
    firstLeakWave: null,
    totalLeaks: 0,
    peakActiveEnemies: 0,
    peakActiveEnemiesSinceCheckpoint: 0,
    spawnedByType: {},
    killedByType: {},
    checkpoints: [],
  };
}

function recordEnemySpawn(telemetry, enemyType) {
  if (!telemetry) return;
  incrementCount(telemetry.spawnedByType, enemyType);
}

function recordEnemyKill(telemetry, enemyType) {
  if (!telemetry) return;
  incrementCount(telemetry.killedByType, enemyType);
}

function recordEnemyLeak(telemetry, waveNumber) {
  if (!telemetry) return;
  telemetry.totalLeaks += 1;
  if (telemetry.firstLeakWave === null) {
    telemetry.firstLeakWave = Math.max(1, Number(waveNumber) || 1);
  }
}

function observeActiveEnemies(telemetry, activeEnemies) {
  if (!telemetry) return;
  telemetry.peakActiveEnemies = Math.max(
    telemetry.peakActiveEnemies,
    Math.max(0, Number(activeEnemies) || 0)
  );
  telemetry.peakActiveEnemiesSinceCheckpoint = Math.max(
    telemetry.peakActiveEnemiesSinceCheckpoint,
    Math.max(0, Number(activeEnemies) || 0)
  );
}

function summarizeTowers(towers = []) {
  const byType = {};
  let upgrades = 0;
  for (const tower of towers) {
    if (!tower?.type) continue;
    const tier = Math.max(1, Number(tower.tier) || 1);
    const type = tower.type;
    byType[type] ??= { total: 0, tiers: {} };
    byType[type].total += 1;
    byType[type].tiers[tier] = (byType[type].tiers[tier] ?? 0) + 1;
    upgrades += tier - 1;
  }
  return { total: towers.length, upgrades, byType };
}

function recordCheckpoint(telemetry, waveNumber, state) {
  const wave = Number(waveNumber);
  if (!telemetry || !BALANCE_CHECKPOINT_WAVES.includes(wave)) return null;
  if (telemetry.checkpoints.some((checkpoint) => checkpoint.wave === wave)) return null;

  const checkpoint = {
    wave,
    money: Number(state.money) || 0,
    lives: Number(state.lives) || 0,
    score: Number(state.score) || 0,
    kills: Number(state.kills) || 0,
    totalLeaks: telemetry.totalLeaks,
    firstLeakWave: telemetry.firstLeakWave,
    activeEnemies: Math.max(0, Number(state.activeEnemies) || 0),
    peakActiveEnemies: telemetry.peakActiveEnemies,
    peakActiveEnemiesSinceLastCheckpoint:
      telemetry.peakActiveEnemiesSinceCheckpoint,
    towers: summarizeTowers(state.towers),
    spawnedByType: { ...telemetry.spawnedByType },
    killedByType: { ...telemetry.killedByType },
  };
  telemetry.checkpoints.push(checkpoint);
  telemetry.peakActiveEnemiesSinceCheckpoint = 0;
  return checkpoint;
}

function snapshotRunTelemetry(telemetry) {
  return telemetry ? JSON.parse(JSON.stringify(telemetry)) : null;
}

function updateTelemetryArchive(rawArchive, snapshot) {
  let stored = null;
  try {
    stored = typeof rawArchive === "string" ? JSON.parse(rawArchive) : rawArchive;
  } catch {
    stored = null;
  }
  const runs =
    stored?.version === TELEMETRY_VERSION &&
    stored.runs &&
    typeof stored.runs === "object"
      ? { ...stored.runs }
      : {};
  if (snapshot?.runId) runs[snapshot.runId] = snapshot;
  return { version: TELEMETRY_VERSION, runs };
}

export {
  BALANCE_CHECKPOINT_WAVES,
  TELEMETRY_VERSION,
  createRunTelemetry,
  observeActiveEnemies,
  recordCheckpoint,
  recordEnemyKill,
  recordEnemyLeak,
  recordEnemySpawn,
  snapshotRunTelemetry,
  summarizeTowers,
  updateTelemetryArchive,
};
