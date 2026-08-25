import { segCircleHit } from "../game/utils.js";
import {
  flashEnemy,
  getMuzzlePoint,
  showHitEffect,
  showMuzzleEffect,
} from "../game/bullets.js";

const PROJECTILE_DEPTH = 50;

const getTowerColor = (tower, fallback) =>
  tower?.visualTint ?? tower?.sprite?.tintTopLeft ?? fallback;

const getProjectileOrigin = (tower, target, projectileType) =>
  projectileType === "basic" || projectileType === "rapid"
    ? getMuzzlePoint(
        tower?.type ? tower : { ...tower, type: projectileType },
        target
      )
    : { x: tower.x, y: tower.y };

class ProjectileSystem {
  constructor({ scene, onHit }) {
    this.scene = scene;
    this.onHit = onHit;
    this.projectiles = [];
  }

  fire(tower, target) {
    if (!target?.active) return;
    if (tower.type === "sniper") {
      this.fireSniper(tower, target);
      return;
    }

    const projectileType = tower.type === "rapid" ? "rapid" : "basic";
    const color = getTowerColor(
      tower,
      projectileType === "rapid" ? 0x39ff8f : 0x3bd3ff
    );
    if (projectileType === "basic" || projectileType === "rapid") {
      showMuzzleEffect(this.scene, tower, target, color);
    }
    const origin = getProjectileOrigin(tower, target, projectileType);
    const projectile = this.scene.add.image(
      origin.x,
      origin.y,
      `projectile_${projectileType}`
    );
    projectile.setDepth(PROJECTILE_DEPTH).setTint(color).setScale(1.12);
    this.projectiles.push({
      projectile,
      target,
      tower,
      projectileType,
      color,
      expiresAt: (this.scene.time?.now ?? 0) + 900,
    });
  }

  fireSniper(tower, target) {
    const tracer = this.scene.add.graphics();
    const color = getTowerColor(tower, 0xffc857);
    const origin = getMuzzlePoint(tower, target);
    tracer.setDepth(80);
    tracer.lineStyle(3, color, 0.28);
    tracer.lineBetween(origin.x, origin.y, target.x, target.y);
    tracer.lineStyle(1, 0xffedc0, 1);
    tracer.lineBetween(origin.x, origin.y, target.x, target.y);
    showMuzzleEffect(this.scene, tower, target, color);
    showHitEffect(this.scene, "sniper", target.x, target.y, color);
    flashEnemy(this.scene, target);
    this.onHit(tower, target, tower.damage);
    this.scene.time.delayedCall(50, () => tracer.destroy());
  }

  update(time, dt) {
    for (const shot of this.projectiles) {
      const { projectile, target, tower, projectileType, color } = shot;
      if (!projectile.active) continue;
      if (!target.active || time >= shot.expiresAt) {
        projectile.destroy();
        continue;
      }
      const x0 = projectile.x;
      const y0 = projectile.y;
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 780;
      const vx = (dx / length) * speed;
      const vy = (dy / length) * speed;
      projectile.setRotation(Math.atan2(vy, vx));
      projectile.x += (vx * dt) / 1000;
      projectile.y += (vy * dt) / 1000;
      if (
        segCircleHit(
          x0,
          y0,
          projectile.x,
          projectile.y,
          target.x,
          target.y,
          14
        )
      ) {
        showHitEffect(this.scene, projectileType, target.x, target.y, color);
        flashEnemy(this.scene, target);
        this.onHit(tower, target, tower.damage);
        projectile.destroy();
      }
    }
    this.projectiles = this.projectiles.filter(
      ({ projectile }) => projectile.active
    );
  }

  destroy() {
    for (const { projectile } of this.projectiles) {
      if (projectile.active) projectile.destroy();
    }
    this.projectiles = [];
  }
}

export { ProjectileSystem, getProjectileOrigin };
