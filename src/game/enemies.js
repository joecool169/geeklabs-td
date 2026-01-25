import { ENEMY_DEFS } from "../constants.js";
import { DIFFICULTY_CONFIG } from "./config.js";
import { dist2 } from "./utils.js";

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
  const e = this.physics.add.image(start.x, start.y, "enemy");
  e.setCollideWorldBounds(false);
  e.body.setAllowGravity(false);
  const w = Math.max(1, this.wave);
  const difficulty = this.difficulty || DIFFICULTY_CONFIG.easy;
  const hpMul = (1 + (w - 1) * (def.scaleHpPerWave ?? 0.12)) * difficulty.enemyHpMul;
  const spMul = (1 + (w - 1) * (def.scaleSpeedPerWave ?? 0.02)) * difficulty.enemySpeedMul;
  e.typeKey = def.key;
  e.setTint(def.tint);
  e.hp = Math.max(1, Math.floor(def.baseHp * hpMul));
  e.maxHp = e.hp;
  e.speed = Math.floor(def.baseSpeed * spMul);
  e.armor = def.armor || 0;
  const baseReward = def.reward || 8;
  e.reward = Math.max(1, Math.floor(baseReward * difficulty.enemyRewardMul));
  e.scoreWeight = def.scoreWeight ?? 1;
  e.pathIndex = 0;
  e.isSwarm = !!opts.isSwarm;
  this.enemies.add(e);
  return e;
}

function advanceEnemy(e, dt) {
  const i = e.pathIndex;
  if (i >= this.path.length - 1) {
    e.destroy();
    this.lives -= 1;
    if (this.lives <= 0) this.scene.restart();
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

export { pickWeighted, spawnEnemyOfType, advanceEnemy, enemyProgressScore, findTarget };
