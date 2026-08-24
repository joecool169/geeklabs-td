import { TOWER_DEFS } from "../constants.js";
import { computeDamageAgainstEnemy } from "../game/balance.js";
import {
  getMuzzlePoint,
  showDeathEffect,
  showHitEffect,
} from "../game/bullets.js";
import * as Telemetry from "../game/telemetry.js";
import { dist2, segCircleHit } from "../game/utils.js";
import { ProjectileSystem } from "./ProjectileSystem.js";

class CombatSystem {
  constructor({
    scene,
    towerSystem,
    enemySystem,
    runController,
    getDifficulty,
    getTelemetry,
  }) {
    this.scene = scene;
    this.towerSystem = towerSystem;
    this.enemySystem = enemySystem;
    this.runController = runController;
    this.getDifficulty = getDifficulty;
    this.getTelemetry = getTelemetry;
    this.projectiles = new ProjectileSystem({
      scene,
      onHit: (tower, enemy, rawDamage) =>
        this.applyDamage(tower, enemy, rawDamage),
    });
  }

  update(time, dt) {
    for (const tower of this.towerSystem.towers) {
      if (tower.type === "laser") {
        this.updateLaser(tower, dt);
        continue;
      }
      if (time < tower.nextShotAt) continue;
      const target = this.enemySystem.findTarget(tower, tower.targetMode);
      if (!target) continue;
      tower.nextShotAt = time + tower.fireMs;
      tower.head?.setRotation?.(
        Math.atan2(target.y - tower.y, target.x - tower.x)
      );
      this.projectiles.fire(tower, target);
    }
    this.projectiles.update(time, dt);
  }

  updateLaser(tower, dt) {
    const rangeSquared = tower.range * tower.range;
    const hasTarget =
      tower.lockTarget?.active &&
      dist2(
        tower.x,
        tower.y,
        tower.lockTarget.x,
        tower.lockTarget.y
      ) <= rangeSquared;

    if (!hasTarget) {
      const nextTarget = this.enemySystem.findTarget(tower, tower.targetMode);
      if (!nextTarget) {
        this.clearLaserLock(tower);
        return;
      }
      if (tower.lockTarget !== nextTarget) {
        tower.lockMs = 0;
        tower.beamAcc = 0;
      }
      tower.lockTarget = nextTarget;
    }

    const target = tower.lockTarget;
    if (!target) return;
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    tower.head?.setRotation?.(Math.atan2(dy, dx));
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const endX = tower.x + (dx / length) * tower.range;
    const endY = tower.y + (dy / length) * tower.range;
    const origin = getMuzzlePoint(tower, target);
    tower.lockMs += dt;
    tower.beamAcc += dt;

    if (tower.beam) {
      tower.beam.clear();
      tower.beam.lineStyle(3, 0xff6bff, 0.18);
      tower.beam.lineBetween(origin.x, origin.y, endX, endY);
      tower.beam.lineStyle(1, 0xffd1ff, 0.85);
      tower.beam.lineBetween(origin.x, origin.y, endX, endY);
      tower.beam.setVisible(true);
    }

    const tickMs = tower.beamTickMs || tower.fireMs || 110;
    while (tower.beamAcc >= tickMs) {
      tower.beamAcc -= tickMs;
      if (!tower.lockTarget?.active) break;
      this.applyLaserTick(tower, tower.lockTarget, endX, endY);
    }
    if (tower.lockTarget && !tower.lockTarget.active) {
      this.clearLaserLock(tower);
    }
  }

  clearLaserLock(tower) {
    tower.lockTarget = null;
    tower.lockMs = 0;
    tower.beamAcc = 0;
    tower.beam?.clear();
    tower.beam?.setVisible(false);
  }

  applyLaserTick(tower, target, endX, endY) {
    const towerDef = TOWER_DEFS[tower.type];
    const hits = [];
    this.enemySystem.group.children.iterate((enemy) => {
      if (!enemy?.active) return;
      if (!segCircleHit(tower.x, tower.y, endX, endY, enemy.x, enemy.y, 14)) {
        return;
      }
      hits.push({
        enemy,
        distanceSquared: dist2(tower.x, tower.y, enemy.x, enemy.y),
      });
    });
    hits.sort((a, b) => a.distanceSquared - b.distanceSquared);
    const primaryIndex = hits.findIndex(({ enemy }) => enemy === target);
    if (primaryIndex === -1) {
      this.clearLaserLock(tower);
      return;
    }
    if (primaryIndex > 0) {
      const [primary] = hits.splice(primaryIndex, 1);
      hits.unshift(primary);
    }

    const ramp =
      1 +
      Math.min(
        tower.lockMs / (towerDef.lockRampMs ?? 2000),
        towerDef.maxLockBonus ?? 1.5
      );
    const falloff = towerDef.pierceFalloff ?? 0.7;
    const maxPierce = towerDef.maxPierce ?? 1;
    for (let index = 0; index < hits.length && index < maxPierce; index += 1) {
      const enemy = hits[index].enemy;
      if (!enemy?.active) continue;
      showHitEffect(
        this.scene,
        "laser",
        enemy.x,
        enemy.y,
        tower.sprite?.tintTopLeft ?? 0xff6bff
      );
      this.applyDamage(
        tower,
        enemy,
        tower.damage * ramp * Math.pow(falloff, index)
      );
    }
  }

  applyDamage(tower, enemy, rawDamage) {
    if (!enemy?.active) return 0;
    const damage = computeDamageAgainstEnemy(tower, rawDamage, enemy);
    const actualDamage = Math.min(
      Math.max(0, Number(enemy.hp) || 0),
      Math.max(0, Number(damage) || 0)
    );
    Telemetry.recordTowerDamage(
      this.getTelemetry(),
      tower?.type,
      actualDamage
    );
    enemy.hp -= damage;
    if (enemy.hp <= 0) this.killEnemy(enemy, tower);
    return actualDamage;
  }

  killEnemy(enemy, tower) {
    if (!enemy?.active) return;
    if (enemy.flashTween) {
      enemy.flashTween.remove(false);
      enemy.flashTween = null;
    }
    const telemetry = this.getTelemetry();
    Telemetry.recordEnemyKill(telemetry, enemy.typeKey);
    Telemetry.recordTowerKill(telemetry, tower?.type);
    const reward = enemy.reward ?? 8;
    const scoreWeight = enemy.scoreWeight ?? 1;
    this.scene.playSfx?.("death");
    if (enemy.typeKey === "runner") showDeathEffect(this.scene, enemy);
    enemy.destroy();
    this.runController.recordKill({
      reward,
      scoreWeight,
      scoreMultiplier: this.getDifficulty()?.scoreMul ?? 1,
    });
  }

  destroy() {
    this.projectiles.destroy();
  }
}

export { CombatSystem };
