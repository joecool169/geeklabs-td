import { TOWER_DEFS } from "../constants.js";
import { getMuzzlePoint } from "../game/bullets.js";

const DEF = TOWER_DEFS.rocket;

function splashMultiplier(distance) {
  if (distance > DEF.splashRadius) return 0;
  return 1 - Math.max(0, distance) / DEF.splashRadius * (1 - DEF.splashEdgeMultiplier);
}

// Uses active gameplay time: pausing freezes both flights and queued launches.
class RocketSystem {
  constructor({ scene, getEnemies, onHit }) {
    this.scene = scene;
    this.getEnemies = getEnemies;
    this.onHit = onHit;
    this.volleys = [];
    this.rockets = [];
    this.clock = 0;
    this.bursts = new Set();
  }

  fire(tower, target) {
    const tier = DEF.tiers[tower.tier - 1];
    this.volleys.push({
      tower, target, lastX: target.x, lastY: target.y,
      damage: tower.damage, remaining: tier.rockets, nextAt: this.clock,
    });
  }

  retarget(track) {
    if (track.target?.active) {
      track.lastX = track.target.x;
      track.lastY = track.target.y;
      return;
    }
    let closest = DEF.retargetRadius ** 2;
    track.target = null;
    for (const enemy of this.getEnemies()) {
      const distance = (enemy.x - track.lastX) ** 2 + (enemy.y - track.lastY) ** 2;
      if (enemy.active && distance <= closest) {
        track.target = enemy;
        closest = distance;
      }
    }
    if (track.target) {
      track.lastX = track.target.x;
      track.lastY = track.target.y;
    }
  }

  update(dt) {
    this.clock += Math.max(0, dt);
    // Move existing shots before launching new ones so new shots never receive
    // time from before their launch (including after a slow frame).
    for (const shot of this.rockets) {
      this.retarget(shot);
      const sprite = shot.sprite;
      const dx = shot.lastX - sprite.x, dy = shot.lastY - sprite.y;
      const distance = Math.hypot(dx, dy);
      const step = DEF.projectileSpeed * dt / 1000;
      if (distance <= step || this.clock >= shot.expiresAt) {
        // Lifetime expiry detonates at the projectile, never teleports damage.
        if (distance <= step) sprite.setPosition(shot.lastX, shot.lastY);
        this.explode(shot);
        continue;
      }
      sprite.setRotation(Math.atan2(dy, dx));
      sprite.x += dx / distance * step;
      sprite.y += dy / distance * step;
    }
    this.rockets = this.rockets.filter(shot => shot.sprite.active);
    for (const volley of this.volleys) {
      // Selling cancels unfired rockets. Already launched shots still resolve.
      if (!volley.tower.sprite.active) { volley.remaining = 0; continue; }
      this.retarget(volley);
      if (volley.remaining > 0 && this.clock >= volley.nextAt) {
        const origin = getMuzzlePoint(volley.tower, { x: volley.lastX, y: volley.lastY });
        volley.tower.head?.setRotation(origin.angle);
        const sprite = this.scene.add.image(origin.x, origin.y, "projectile_rocket");
        sprite.setDepth(50).setRotation(origin.angle);
        this.rockets.push({ ...volley, sprite, expiresAt: this.clock + DEF.projectileLifetimeMs });
        volley.remaining -= 1;
        volley.nextAt = this.clock + DEF.volleyIntervalMs;
        if (volley.remaining === 0) volley.tower.rocketReloadMs = volley.tower.fireMs;
      }
    }
    this.volleys = this.volleys.filter(volley => volley.remaining > 0);
  }

  explode(shot) {
    const { x, y } = shot.sprite;
    // Snapshot before applying damage because killing mutates the Phaser group.
    for (const enemy of [...this.getEnemies()]) {
      if (!enemy.active) continue;
      const multiplier = splashMultiplier(Math.hypot(enemy.x - x, enemy.y - y));
      if (multiplier > 0) this.onHit(shot.tower, enemy, shot.damage * multiplier);
    }
    // Bound transient effects even when many rocket towers fire together.
    if (this.scene.textures?.exists?.("impact_rocket") && this.scene.tweens &&
        this.bursts.size < 12) {
      const burst = this.scene.add.image(x, y, "impact_rocket");
      this.bursts.add(burst);
      burst.setDepth(60).setDisplaySize(DEF.splashRadius, DEF.splashRadius).setAlpha(0.65);
      this.scene.tweens.add({ targets: burst, alpha: 0, displayWidth: DEF.splashRadius * 2,
        displayHeight: DEF.splashRadius * 2, duration: 180,
        onComplete: () => { burst.destroy(); this.bursts.delete(burst); } });
    }
    shot.sprite.destroy();
  }

  destroy() {
    for (const shot of this.rockets) shot.sprite.destroy();
    this.rockets = [];
    this.volleys = [];
    for (const burst of this.bursts) {
      this.scene.tweens?.killTweensOf(burst);
      burst.destroy();
    }
    this.bursts.clear();
  }
}

export { RocketSystem, splashMultiplier };
