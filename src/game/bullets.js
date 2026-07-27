import { dist2, segCircleHit } from "./utils.js";

const PROJECTILE_DEPTH = 50;
const IMPACT_DEPTH = 60;

const getTowerColor = (tower, fallback) =>
  tower?.sprite?.tintTopLeft ?? fallback;

const showHitEffect = (scene, type, x, y, color) => {
  const key = `impact_${type}`;
  if (!scene.textures.exists(key)) return;

  const effect = scene.add.image(x, y, key);
  effect.setDepth(IMPACT_DEPTH);
  effect.setTint(color);

  if (type === "rapid") {
    effect.setAlpha(0.8);
    scene.time.delayedCall(35, () => {
      if (effect.active) effect.destroy();
    });
    return;
  }

  effect.setScale(type === "sniper" ? 0.8 : 0.9);
  scene.tweens.add({
    targets: effect,
    alpha: 0,
    scale: type === "sniper" ? 1.1 : 1.05,
    duration: type === "laser" ? 45 : 70,
    onComplete: () => {
      if (effect.active) effect.destroy();
    },
  });
};

const flashEnemy = (scene, target) => {
  if (!target || !target.active || target.flashTween) return;
  target.baseTint ??= (target.tintTopLeft ?? 0xffffff);
  const baseTint = target.baseTint;
  const isArmored = (target.armor || 0) > 0;
  const flashTint = isArmored ? 0x84d8ff : 0xffffff;
  target.setTint(flashTint);
  target.setAlpha(0.55);
  target.flashTween = scene.time.delayedCall(80, () => {
    if (!target.active) return;
    target.setTint(baseTint);
    target.setAlpha(1);
    target.flashTween = null;
  });
};

function fireBullet(t, target) {
  if (!target || !target.active) return;

  if (t.type === "sniper") {
    const x1 = t.x;
    const y1 = t.y;
    const x2 = target.x;
    const y2 = target.y;

    const tracer = this.add.graphics();
    const tracerColor = getTowerColor(t, 0xffc857);
    tracer.setDepth(80);
    tracer.lineStyle(3, tracerColor, 0.28);
    tracer.lineBetween(x1, y1, x2, y2);
    tracer.lineStyle(1, 0xffedc0, 1);
    tracer.lineBetween(x1, y1, x2, y2);

    const armor = target.armor || 0;
    const dmg = Math.max(1, t.damage - armor);
    showHitEffect(this, "sniper", x2, y2, tracerColor);
    flashEnemy(this, target);
    target.hp -= dmg;

    if (target.hp <= 0) this.handleEnemyKilled(target);

    this.time.delayedCall(50, () => {
      tracer.destroy();
    });

    return;
  }

  const x = t.x;
  const y = t.y;
  const projectileType = t.type === "rapid" ? "rapid" : "basic";
  const projectileColor = getTowerColor(
    t,
    projectileType === "rapid" ? 0x39ff8f : 0x3bd3ff
  );
  const b = this.add.image(x, y, `projectile_${projectileType}`);
  b.setDepth(PROJECTILE_DEPTH);
  b.setTint(projectileColor);
  const spd = 780;
  const hitR = 14;
  const step = (_time, dt) => {
    if (!b.active) return;
    const x0 = b.x;
    const y0 = b.y;
    if (!target.active) {
      b.destroy();
      return;
    }
    const dx = target.x - b.x;
    const dy = target.y - b.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const vx = (dx / len) * spd;
    const vy = (dy / len) * spd;
    b.setRotation(Math.atan2(vy, vx));
    b.x += (vx * dt) / 1000;
    b.y += (vy * dt) / 1000;
    if (segCircleHit(x0, y0, b.x, b.y, target.x, target.y, hitR)) {
      const armor = target.armor || 0;
      const dmg = Math.max(1, t.damage - armor);
      showHitEffect(this, projectileType, target.x, target.y, projectileColor);
      flashEnemy(this, target);
      target.hp -= dmg;
      if (target.hp <= 0) this.handleEnemyKilled(target);
      b.destroy();
    }
  };
  b.update = step;
  if (!this.bulletsPlain) {
    this.bulletsPlain = [];
    const updateBullets = (time, dt) => {
      if (this.isGameOver) return;
      for (const obj of this.bulletsPlain) {
        if (obj.active && obj.update) obj.update(time, dt);
      }
      this.bulletsPlain = this.bulletsPlain.filter((o) => o.active);
    };
    this.events.on("update", updateBullets);
    this.events.once("shutdown", () => {
      this.events.off("update", updateBullets);
      for (const obj of this.bulletsPlain || []) {
        if (obj.active) obj.destroy();
      }
      this.bulletsPlain = null;
    });
  }
  this.bulletsPlain.push(b);
  this.time.delayedCall(900, () => {
    if (b.active) b.destroy();
  });
}

export { fireBullet, showHitEffect };
