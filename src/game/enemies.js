import {
  clamp01,
  ENEMY_DEFS,
  ENEMY_HP_SCALING,
  TOWER_DEFS,
} from "../constants.js";
import { dist2 } from "./utils.js";

const ENEMY_DEPTH = 20;
const ENEMY_HEALTH_DEPTH = 21;
const ENEMY_HEALTH_WIDTH = 20;
const ENEMY_HEALTH_Y = -17;
const ENEMY_MOTION = Object.freeze({
  runner: Object.freeze({ amplitude: 0.018, frequency: 0.009 }),
  sprinter: Object.freeze({ amplitude: 0.05, frequency: 0.014 }),
  brute: Object.freeze({ amplitude: 0.012, frequency: 0.006 }),
  armored: Object.freeze({ amplitude: 0.007, frequency: 0.004 }),
});

function getEnemyMotionRotation(typeKey, direction, clock, phase = 0) {
  const motion = ENEMY_MOTION[typeKey] ?? ENEMY_MOTION.runner;
  return direction + Math.sin(clock * motion.frequency + phase) * motion.amplitude;
}

function getEnemyDamagePresentation(ratio) {
  if (ratio <= 0.25) return { alpha: 1, healthColor: 0xff4d6d };
  if (ratio <= 0.55) return { alpha: 1, healthColor: 0xffc857 };
  return { alpha: 1, healthColor: 0x57e3ff };
}

function shouldShowEnemyHealth(typeKey, ratio, activeEnemyCount = 0) {
  if (ratio >= 1) return false;
  const durable = typeKey === "brute" || typeKey === "armored";
  if (activeEnemyCount > 60) return ratio <= (durable ? 0.55 : 0.25);
  if (activeEnemyCount > 36) return ratio <= (durable ? 0.8 : 0.4);
  if (durable) return true;
  return ratio <= 0.55;
}

function getEnemyTextureKey(typeKey) {
  return `enemy_${ENEMY_DEFS[typeKey] ? typeKey : "runner"}`;
}

function drawEnemyTexture(graphics, typeKey) {
  const dark = 0x0b0f14;
  graphics.clear();
  graphics.fillStyle(0xffffff, 1);

  if (typeKey === "brute") {
    graphics.fillPoints(
      [
        { x: 5, y: 1 },
        { x: 19, y: 1 },
        { x: 23, y: 5 },
        { x: 23, y: 19 },
        { x: 19, y: 23 },
        { x: 5, y: 23 },
        { x: 1, y: 19 },
        { x: 1, y: 5 },
      ],
      true
    );
    graphics.fillStyle(dark, 1);
    graphics.fillRect(6, 6, 12, 12);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(9, 9, 6, 6);
    return;
  }

  if (typeKey === "armored") {
    graphics.fillRect(0, 7, 4, 10);
    graphics.fillRect(20, 7, 4, 10);
    graphics.fillPoints(
      [
        { x: 12, y: 1 },
        { x: 21, y: 5 },
        { x: 21, y: 15 },
        { x: 17, y: 21 },
        { x: 12, y: 23 },
        { x: 7, y: 21 },
        { x: 3, y: 15 },
        { x: 3, y: 5 },
      ],
      true
    );
    graphics.fillStyle(dark, 1);
    graphics.fillRect(4, 9, 16, 2);
    graphics.fillRect(5, 15, 14, 2);
    return;
  }

  if (typeKey === "sprinter") {
    graphics.fillPoints(
      [
        { x: 2, y: 12 },
        { x: 12, y: 3 },
        { x: 22, y: 12 },
        { x: 12, y: 21 },
      ],
      true
    );
    graphics.fillStyle(dark, 1);
    graphics.fillPoints(
      [
        { x: 7, y: 12 },
        { x: 12, y: 8 },
        { x: 17, y: 12 },
        { x: 12, y: 16 },
      ],
      true
    );
    return;
  }

  graphics.fillPoints(
    [
      { x: 5, y: 5 },
      { x: 12, y: 8 },
      { x: 12, y: 3 },
      { x: 23, y: 12 },
      { x: 12, y: 21 },
      { x: 12, y: 16 },
      { x: 5, y: 19 },
      { x: 8, y: 12 },
    ],
    true
  );
}

function updateEnemyVisual(e, activeEnemyCount = 0) {
  if (!e?.active || !e.healthIndicator?.active) return;
  const indicator = e.healthIndicator;
  indicator.setPosition(e.x, e.y);

  const ratio = clamp01(e.hp / Math.max(1, e.maxHp));
  const showHealth = shouldShowEnemyHealth(e.typeKey, ratio, activeEnemyCount);
  if (e.healthIndicatorHp === e.hp && e.healthIndicatorMaxHp === e.maxHp && e.healthIndicatorShown === showHealth) return;
  e.healthIndicatorHp = e.hp;
  e.healthIndicatorMaxHp = e.maxHp;
  e.healthIndicatorShown = showHealth;

  const damagePresentation = getEnemyDamagePresentation(ratio);
  e.presentationAlpha = damagePresentation.alpha;
  if (!e.flashTween) e.setAlpha?.(damagePresentation.alpha);
  indicator.clear();
  indicator.setVisible(true);
  // Reuse the health graphics for a steady type cue; no new effects or sprites.
  const points = getEnemyTypeMarker(e.typeKey).map(([x, y]) => ({ x, y: y + 15 }));
  indicator.fillStyle(0x0b0f14, 0.95);
  indicator.fillPoints(points, true);
  indicator.lineStyle(2, ENEMY_DEFS[e.typeKey]?.tint ?? ENEMY_DEFS.runner.tint, 1);
  indicator.strokePoints(points, true);
  if (!showHealth) return;
  indicator.fillStyle(0x0b0f14, 0.9);
  indicator.fillRect(
    -ENEMY_HEALTH_WIDTH / 2 - 1,
    ENEMY_HEALTH_Y - 1,
    ENEMY_HEALTH_WIDTH + 2,
    4
  );
  indicator.fillStyle(damagePresentation.healthColor, 1);
  indicator.fillRect(
    -ENEMY_HEALTH_WIDTH / 2,
    ENEMY_HEALTH_Y,
    Math.max(1, Math.ceil(ENEMY_HEALTH_WIDTH * ratio)),
    2
  );
}

function getEnemyTypeMarker(typeKey) {
  switch (typeKey) {
    case "sprinter": return [[0, -5], [6, 0], [0, 5], [-6, 0]];
    case "brute": return [[-5, -5], [5, -5], [5, 5], [-5, 5]];
    case "armored": return [[-6, -5], [6, -5], [5, 2], [0, 6], [-5, 2]];
    default: return [[-5, -4], [6, 0], [-5, 4]];
  }
}

function pickWeighted(rng01, entries) {
  const total = entries.reduce((s, e) => s + e.w, 0);
  if (total <= 0) return entries[0]?.key;
  let t = rng01 * total;
  for (const e of entries) {
    t -= e.w;
    if (t <= 0) return e.key;
  }
  return entries[entries.length - 1]?.key;
}

function computeEnemyHp(def, waveNumber, difficulty) {
  const w = Math.max(1, waveNumber);
  const classAge = Math.max(0, w - (def.unlockWave ?? 1));
  const classHpMul = 1 + classAge * (def.scaleHpPerWave ?? 0.12);
  const t = clamp01((w - 1) / ENEMY_HP_SCALING.earlyRampWaves);
  const hpFactor = 1 + ENEMY_HP_SCALING.earlyRampBonus * t;
  const midPressure =
    1 +
    ENEMY_HP_SCALING.midPressurePerWave *
      Math.min(
        ENEMY_HP_SCALING.midPressureWaves,
        Math.max(0, w - ENEMY_HP_SCALING.midPressureStartWave)
      );
  const endurancePressure = Math.pow(
    ENEMY_HP_SCALING.enduranceMultiplierPerWave,
    Math.max(0, w - ENEMY_HP_SCALING.enduranceStartWave)
  );
  return Math.max(
    1,
    Math.floor(
      def.baseHp *
        classHpMul *
        difficulty.enemyHpMul *
        hpFactor *
        midPressure *
        endurancePressure
    )
  );
}

function createEnemyRewardCarry() {
  return Object.create(null);
}

function computeEnemyReward(def, waveNumber, difficulty, roundingCarry = 0) {
  const w = Math.max(1, waveNumber);
  const baseReward = def.reward || 8;
  const bountyPressure = 1 / (1 + 0.035 * Math.max(0, w - 3));
  const exactReward = baseReward * difficulty.enemyRewardMul * bountyPressure;
  if (exactReward <= 1) {
    return { reward: 1, roundingCarry: 0, exactReward };
  }

  const rewardWithCarry = exactReward + roundingCarry;
  const reward = Math.floor(rewardWithCarry);
  return {
    reward,
    roundingCarry: rewardWithCarry - reward,
    exactReward,
  };
}

function enemyProgressScore(path, e) {
  const i = e.pathIndex;
  const next = path[Math.min(i + 1, path.length - 1)];
  const d = Math.sqrt(dist2(e.x, e.y, next.x, next.y));
  return i * 100000 - d;
}

function findTarget({ path, enemies }, tower, mode) {
  if (mode === "preferred") {
    const preferredType = TOWER_DEFS[tower?.type]?.preferredTargetType;
    if (preferredType) {
      const r2 = tower.range * tower.range;
      let preferred = null;
      let preferredProgress = -Infinity;
      enemies.children.iterate((enemy) => {
        if (!enemy || enemy.typeKey !== preferredType) return;
        if (dist2(tower.x, tower.y, enemy.x, enemy.y) > r2) return;
        const progress = enemyProgressScore(path, enemy);
        if (progress > preferredProgress) {
          preferredProgress = progress;
          preferred = enemy;
        }
      });
      if (preferred) return preferred;
    }
    return findTarget({ path, enemies }, tower, "first");
  }
  const r2 = tower.range * tower.range;
  let best = null;
  let bestMetric = -Infinity;
  let bestArmor = -Infinity;
  enemies.children.iterate((e) => {
    if (!e) return;
    const d = dist2(tower.x, tower.y, e.x, e.y);
    if (d > r2) return;
    if (mode === "close") {
      const m = -d;
      if (m > bestMetric) {
        bestMetric = m;
        best = e;
      }
      return;
    }
    if (mode === "strong") {
      const m = e.hp;
      if (m > bestMetric) {
        bestMetric = m;
        best = e;
      }
      return;
    }
    if (mode === "armored") {
      const armor = e.armor ?? 0;
      const progress = enemyProgressScore(path, e);
      if (armor > bestArmor || (armor === bestArmor && progress > bestMetric)) {
        bestArmor = armor;
        bestMetric = progress;
        best = e;
      }
      return;
    }
    if (mode === "first") {
      const m = enemyProgressScore(path, e);
      if (m > bestMetric) {
        bestMetric = m;
        best = e;
      }
    }
  });
  return best;
}

export {
  getEnemyTextureKey,
  getEnemyTypeMarker,
  getEnemyDamagePresentation,
  getEnemyMotionRotation,
  drawEnemyTexture,
  updateEnemyVisual,
  shouldShowEnemyHealth,
  pickWeighted,
  computeEnemyHp,
  computeEnemyReward,
  createEnemyRewardCarry,
  enemyProgressScore,
  findTarget,
};
