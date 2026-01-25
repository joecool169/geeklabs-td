import { dist2, segCircleHit } from "./utils.js";

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
    tracer.setDepth(80);
    tracer.lineStyle(3, 0xffedc0, 0.95);
    tracer.lineBetween(x1, y1, x2, y2);

    const armor = target.armor || 0;
    const dmg = Math.max(1, t.damage - armor);
    flashEnemy(this, target);
    target.hp -= dmg;

    if (target.hp <= 0) {
      const reward = target.reward ?? 8;
      const weight = target.scoreWeight ?? 1;
      if (target.flashTween) {
        target.flashTween.remove(false);
        target.flashTween = null;
      }
      target.destroy();
      this.money += reward;
      this.killCount += 1;
      const scoreGain = reward + Math.round(weight * 10);
      this.score += scoreGain;
    }

    this.time.delayedCall(50, () => {
      tracer.destroy();
    });

    return;
  }

  const x = t.x;
  const y = t.y;
  const b = this.add.circle(x, y, 6, 0x00ffff, 1);
  b.setDepth(50);
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
    b.x += (vx * dt) / 1000;
    b.y += (vy * dt) / 1000;
    if (segCircleHit(x0, y0, b.x, b.y, target.x, target.y, hitR)) {
      const armor = target.armor || 0;
      const dmg = Math.max(1, t.damage - armor);
      flashEnemy(this, target);
      target.hp -= dmg;
      if (target.hp <= 0) {
        const reward = target.reward ?? 8;
        const weight = target.scoreWeight ?? 1;
        if (target.flashTween) {
          target.flashTween.remove(false);
          target.flashTween = null;
        }
        target.destroy();
        this.money += reward;
        this.killCount += 1;
        const scoreGain = reward + Math.round(weight * 10);
        this.score += scoreGain;
      }
      b.destroy();
    }
  };
  b.update = step;
  if (!this.bulletsPlain) {
    this.bulletsPlain = [];
    this.events.on("update", (time, dt) => {
      if (this.isGameOver) return;
      for (const obj of this.bulletsPlain) {
        if (obj.active && obj.update) obj.update(time, dt);
      }
      this.bulletsPlain = this.bulletsPlain.filter((o) => o.active);
    });
  }
  this.bulletsPlain.push(b);
  this.time.delayedCall(900, () => {
    if (b.active) b.destroy();
  });
}

export { fireBullet };
