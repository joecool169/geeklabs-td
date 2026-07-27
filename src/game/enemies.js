import { clamp01, ENEMY_DEFS } from "../constants.js";
import { DIFFICULTY_CONFIG } from "./config.js";
import { dist2 } from "./utils.js";

const ENEMY_DEPTH = 20;
const ENEMY_HEALTH_DEPTH = 21;
const ENEMY_HEALTH_WIDTH = 20;
const ENEMY_HEALTH_Y = -17;

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

function updateEnemyVisual(e) {
  if (!e?.active || !e.healthIndicator?.active) return;
  const indicator = e.healthIndicator;
  indicator.setPosition(e.x, e.y);

  if (e.healthIndicatorHp === e.hp && e.healthIndicatorMaxHp === e.maxHp) return;
  e.healthIndicatorHp = e.hp;
  e.healthIndicatorMaxHp = e.maxHp;

  const ratio = clamp01(e.hp / Math.max(1, e.maxHp));
  indicator.clear();
  if (ratio >= 1) {
    indicator.setVisible(false);
    return;
  }

  indicator.setVisible(true);
  indicator.fillStyle(0x0b0f14, 0.9);
  indicator.fillRect(
    -ENEMY_HEALTH_WIDTH / 2 - 1,
    ENEMY_HEALTH_Y - 1,
    ENEMY_HEALTH_WIDTH + 2,
    4
  );
  indicator.fillStyle(ENEMY_DEFS[e.typeKey]?.tint ?? 0xff4d6d, 1);
  indicator.fillRect(
    -ENEMY_HEALTH_WIDTH / 2,
    ENEMY_HEALTH_Y,
    Math.max(1, Math.ceil(ENEMY_HEALTH_WIDTH * ratio)),
    2
  );
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

function spawnEnemyOfType(typeKey, opts = {}) {
  const def = ENEMY_DEFS[typeKey] || ENEMY_DEFS.runner;
  const start = this.path[0];
  const e = this.physics.add.image(start.x, start.y, getEnemyTextureKey(def.key));
  e.setDepth(ENEMY_DEPTH);
  e.setCollideWorldBounds(false);
  e.body.setAllowGravity(false);
  const w = Math.max(1, this.wave);
  const difficulty = this.difficulty || DIFFICULTY_CONFIG.easy;
  const hpMul = (1 + (w - 1) * (def.scaleHpPerWave ?? 0.12)) * difficulty.enemyHpMul;
  const spMul = (1 + (w - 1) * (def.scaleSpeedPerWave ?? 0.02)) * difficulty.enemySpeedMul;
  e.typeKey = def.key;
  e.setTint(def.tint);
  const t = clamp01((w - 1) / 9);
  const hpFactor = 1 + 1.0 * t;
  e.hp = Math.max(1, Math.floor(def.baseHp * hpMul * hpFactor));
  e.maxHp = e.hp;
  e.speed = Math.floor(def.baseSpeed * spMul);
  e.armor = def.armor || 0;
  const baseReward = def.reward || 8;
  e.reward = Math.max(1, Math.floor(baseReward * difficulty.enemyRewardMul));
  e.scoreWeight = def.scoreWeight ?? 1;
  e.pathIndex = 0;
  e.isSwarm = !!opts.isSwarm;
  e.healthIndicator = this.add.graphics();
  e.healthIndicator.setDepth(ENEMY_HEALTH_DEPTH);
  e.healthIndicator.setVisible(false);
  e.once("destroy", () => {
    if (e.healthIndicator?.active) e.healthIndicator.destroy();
    e.healthIndicator = null;
  });
  updateEnemyVisual(e);
  this.enemies.add(e);
  return e;
}

function advanceEnemy(e, dt) {
  const i = e.pathIndex;
  if (i >= this.path.length - 1) {
    e.destroy();
    this.lives -= 1;
    if (this.triggerLifeLossFeedback) this.triggerLifeLossFeedback();
    if (this.playSfx) this.playSfx("life");
    if (this.lives <= 0) this.triggerGameOver();
    return;
  }
  const a = this.path[i];
  const b = this.path[i + 1];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.sqrt(vx * vx + vy * vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  const move = (e.speed * dt) / 1000;
  e.x += ux * move;
  e.y += uy * move;
  if (dist2(e.x, e.y, b.x, b.y) < 14 * 14) {
    e.pathIndex += 1;
    e.x = b.x;
    e.y = b.y;
  }
}

function enemyProgressScore(e) {
  const i = e.pathIndex;
  const next = this.path[Math.min(i + 1, this.path.length - 1)];
  const d = Math.sqrt(dist2(e.x, e.y, next.x, next.y));
  return i * 100000 - d;
}

function findTarget(tower, mode) {
  const r2 = tower.range * tower.range;
  let best = null;
  let bestMetric = -Infinity;
  let bestArmor = -Infinity;
  this.enemies.children.iterate((e) => {
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
      const progress = enemyProgressScore.call(this, e);
      if (armor > bestArmor || (armor === bestArmor && progress > bestMetric)) {
        bestArmor = armor;
        bestMetric = progress;
        best = e;
      }
      return;
    }
    if (mode === "first") {
      const m = enemyProgressScore.call(this, e);
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
  drawEnemyTexture,
  updateEnemyVisual,
  pickWeighted,
  spawnEnemyOfType,
  advanceEnemy,
  enemyProgressScore,
  findTarget,
};
