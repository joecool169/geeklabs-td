import { ENEMY_DEFS } from "../constants.js";
import {
  computeEnemyHp,
  computeEnemyReward,
  createEnemyRewardCarry,
  findTarget,
  getEnemyTextureKey,
  updateEnemyVisual,
} from "../game/enemies.js";
import { dist2 } from "../game/utils.js";
import {
  ART_DEPTHS,
  getEnemyArtStandard,
} from "../presentation/artStandards.js";

function getEnemyArtPresentation(typeKey, textureWidth = 24) {
  if (typeKey === "runner" && textureWidth > 24) {
    const standard = getEnemyArtStandard(typeKey);
    return {
      displayWidth: standard.width,
      displayHeight: standard.height,
      useTint: false,
    };
  }
  return { displayWidth: null, displayHeight: null, useTint: true };
}

class EnemySystem {
  constructor({
    scene,
    path,
    runController,
    getWave,
    getDifficulty,
    onSpawn = () => {},
    onLeak = () => {},
    onLifeLost = () => {},
    onGameOver = () => {},
  }) {
    this.scene = scene;
    this.path = path;
    this.runController = runController;
    this.getWave = getWave;
    this.getDifficulty = getDifficulty;
    this.onSpawn = onSpawn;
    this.onLeak = onLeak;
    this.onLifeLost = onLifeLost;
    this.onGameOver = onGameOver;
    this.group = scene.physics.add.group();
    this.rewardCarry = createEnemyRewardCarry();
  }

  spawn(typeKey, opts = {}) {
    const def = ENEMY_DEFS[typeKey] || ENEMY_DEFS.runner;
    const start = this.path[0];
    const enemy = this.scene.physics.add.image(
      start.x,
      start.y,
      getEnemyTextureKey(def.key)
    );
    enemy.setDepth(ART_DEPTHS.enemy);
    enemy.setCollideWorldBounds(false);
    enemy.body.setAllowGravity(false);

    const wave = Math.max(1, opts.waveNumber ?? this.getWave());
    const difficulty = this.getDifficulty();
    const speedMultiplier =
      (1 + (wave - 1) * (def.scaleSpeedPerWave ?? 0.02)) *
      difficulty.enemySpeedMul;
    enemy.typeKey = def.key;
    const art = getEnemyArtPresentation(def.key, enemy.width);
    if (art.useTint) enemy.setTint(def.tint);
    else {
      enemy.clearTint();
      enemy.setDisplaySize(art.displayWidth, art.displayHeight);
    }
    enemy.hp = computeEnemyHp(def, wave, difficulty);
    enemy.maxHp = enemy.hp;
    enemy.speed = Math.floor(def.baseSpeed * speedMultiplier);
    enemy.armor = def.armor || 0;
    const reward = computeEnemyReward(
      def,
      wave,
      difficulty,
      this.rewardCarry[def.key] ?? 0
    );
    enemy.reward = reward.reward;
    this.rewardCarry[def.key] = reward.roundingCarry;
    enemy.scoreWeight = def.scoreWeight ?? 1;
    enemy.waveNumber = wave;
    enemy.pathIndex = 0;
    enemy.isSwarm = !!opts.isSwarm;
    enemy.healthIndicator = this.scene.add.graphics();
    enemy.healthIndicator.setDepth(ART_DEPTHS.enemyHealth).setVisible(false);
    enemy.once("destroy", () => {
      if (enemy.healthIndicator?.active) enemy.healthIndicator.destroy();
      enemy.healthIndicator = null;
    });
    updateEnemyVisual(enemy);
    this.group.add(enemy);
    this.onSpawn(enemy);
    return enemy;
  }

  update(dt) {
    this.group.children.iterate((enemy) => {
      if (!enemy?.active) return;
      this.advance(enemy, dt);
      updateEnemyVisual(enemy);
    });
  }

  advance(enemy, dt) {
    const index = enemy.pathIndex;
    if (index >= this.path.length - 1) {
      this.onLeak(enemy);
      enemy.destroy();
      const shouldEndRun = this.runController.loseLife();
      this.onLifeLost();
      if (shouldEndRun) this.onGameOver();
      return;
    }
    const start = this.path[index];
    const end = this.path[index + 1];
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    if (enemy.typeKey === "runner") enemy.setRotation?.(Math.atan2(vy, vx));
    const length = Math.sqrt(vx * vx + vy * vy) || 1;
    const move = (enemy.speed * dt) / 1000;
    enemy.x += (vx / length) * move;
    enemy.y += (vy / length) * move;
    if (dist2(enemy.x, enemy.y, end.x, end.y) < 14 * 14) {
      enemy.pathIndex += 1;
      enemy.x = end.x;
      enemy.y = end.y;
    }
  }

  findTarget(tower, mode) {
    return findTarget({ path: this.path, enemies: this.group }, tower, mode);
  }

  countActive() {
    return this.group.countActive(true);
  }

  destroy() {
    this.group?.clear(true, true);
    this.group = null;
    this.rewardCarry = null;
  }
}

function attachEnemySystem(scene, enemySystem) {
  scene.enemySystem = enemySystem;
  Object.defineProperty(scene, "enemies", {
    configurable: true,
    get: () => enemySystem.group,
  });
  return enemySystem;
}

export { EnemySystem, attachEnemySystem, getEnemyArtPresentation };
