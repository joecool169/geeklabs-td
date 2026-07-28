import {
  ENEMY_DEFS,
  TOWER_DEFS,
  WAVE_CADENCE,
} from "../constants.js";
import { computeEnemyHp, computeEnemyReward } from "./enemies.js";
import { computeWaveConfig } from "./waves.js";

function getEnemyKey(enemy) {
  return typeof enemy === "string" ? enemy : enemy?.typeKey ?? enemy?.key;
}

function getEnemyArmor(enemy) {
  if (typeof enemy === "string") return ENEMY_DEFS[enemy]?.armor ?? 0;
  return enemy?.armor ?? ENEMY_DEFS[getEnemyKey(enemy)]?.armor ?? 0;
}

function getTowerDef(tower) {
  const key = typeof tower === "string" ? tower : tower?.type ?? tower?.key;
  return TOWER_DEFS[key];
}

function computeDamageAgainstEnemy(tower, rawDamage, enemy) {
  const towerDef = getTowerDef(tower);
  const enemyKey = getEnemyKey(enemy);
  const matchupMultiplier = towerDef?.matchupDamage?.[enemyKey] ?? 1;
  const armorMultiplier = towerDef?.armorMultiplier ?? 1;
  const armorPenetration = towerDef?.armorPenetration ?? 0;
  const effectiveArmor = Math.max(
    0,
    getEnemyArmor(enemy) * armorMultiplier - armorPenetration
  );
  return Math.max(1, rawDamage * matchupMultiplier - effectiveArmor);
}

function computeTowerDps(towerKey, tierIndex, enemyKey, damageMultiplier = 1) {
  const tier = TOWER_DEFS[towerKey]?.tiers[tierIndex];
  if (!tier) return 0;
  return (
    computeDamageAgainstEnemy(
      towerKey,
      tier.damage * damageMultiplier,
      enemyKey
    ) *
    1000 /
    tier.fireMs
  );
}

function computeClearBonus(waveNumber) {
  const wave = Math.max(1, waveNumber);
  return (
    6 +
    Math.floor(
      1.5 * Math.min(wave, 12) +
        0.5 * Math.max(0, wave - 12)
    )
  );
}

function computeExpectedEnemyCounts(waveNumber) {
  const config = computeWaveConfig.call({ intermissionMs: 0 }, waveNumber);
  const {
    forcedRunners,
    randomSpawns,
    packSpacingCount,
    endsWithPack,
  } = config.spawnTopology;

  const weightTotal = config.weights.reduce(
    (sum, entry) => sum + entry.w,
    0
  );
  const counts = { runner: forcedRunners, brute: 0, armored: 0 };
  for (const entry of config.weights) {
    counts[entry.key] += randomSpawns * (entry.w / weightTotal);
  }
  return {
    config,
    counts,
    randomSpawns,
    packSpacingCount,
    endsWithPack,
  };
}

function computeWaveSpawnDurationMs(
  config,
  randomSpawns,
  packSpacingCount,
  packSpacingMs = WAVE_CADENCE.packSpacingMs,
  endsWithPack = false
) {
  const delayCount = Math.max(
    0,
    randomSpawns - (endsWithPack ? 0 : 1)
  );
  return (
    delayCount * config.spawnDelayMs +
    packSpacingCount * packSpacingMs
  );
}

function computeWaveBalance(waveNumber, difficulty) {
  const {
    config,
    counts,
    randomSpawns,
    packSpacingCount,
    endsWithPack,
  } =
    computeExpectedEnemyCounts(waveNumber);
  const hpByClass = Object.fromEntries(
    Object.entries(ENEMY_DEFS).map(([key, def]) => [
      key,
      computeEnemyHp(def, waveNumber, difficulty),
    ])
  );
  const combinedHp = Object.entries(counts).reduce(
    (total, [key, count]) => total + count * hpByClass[key],
    0
  );
  const spawnDurationMs = computeWaveSpawnDurationMs(
    config,
    randomSpawns,
    packSpacingCount,
    WAVE_CADENCE.packSpacingMs,
    endsWithPack
  );
  const bounty = Object.entries(counts).reduce(
    (total, [key, count]) =>
      total +
      count *
        computeEnemyReward(
          ENEMY_DEFS[key],
          waveNumber,
          difficulty
        ).exactReward,
    0
  );
  const clearBonus = computeClearBonus(waveNumber);
  return {
    wave: waveNumber,
    config,
    counts,
    hpByClass,
    combinedHp,
    spawnDurationMs,
    requiredDps: combinedHp / (spawnDurationMs / 1000),
    bounty,
    clearBonus,
    income: bounty + clearBonus,
  };
}

export {
  computeClearBonus,
  computeDamageAgainstEnemy,
  computeExpectedEnemyCounts,
  computeTowerDps,
  computeWaveBalance,
  computeWaveSpawnDurationMs,
};
