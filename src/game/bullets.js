import {
  ART_DEPTHS,
  FULL_EFFECT_ENEMY_LIMIT,
  TRANSIENT_EFFECT_ENEMY_LIMIT,
} from "../presentation/artStandards.js";

const IMPACT_DEPTH = ART_DEPTHS.impact;

const hasTransientEffectBudget = (scene) =>
  (scene?.enemies?.countActive?.(true) ?? 0) <= TRANSIENT_EFFECT_ENEMY_LIMIT;

const shouldShowImpactEffect = (scene, type) => {
  const activeEnemies = scene?.enemies?.countActive?.(true) ?? 0;
  if (activeEnemies <= FULL_EFFECT_ENEMY_LIMIT) return true;
  if (activeEnemies > TRANSIENT_EFFECT_ENEMY_LIMIT) return false;
  return type === "basic" || type === "sniper";
};

const MUZZLE_OFFSETS = Object.freeze({
  basic: Object.freeze([22, 25, 28]),
  rapid: Object.freeze([24, 26, 28]),
  sniper: Object.freeze([27, 29, 31]),
  laser: Object.freeze([22, 25, 28]),
});

const getMuzzlePoint = (tower, target) => {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  const tierIndex = Math.min(2, Math.max(0, (tower.tier ?? 1) - 1));
  const offset = (MUZZLE_OFFSETS[tower.type] ?? MUZZLE_OFFSETS.basic)[tierIndex];
  return {
    angle,
    x: tower.x + Math.cos(angle) * offset,
    y: tower.y + Math.sin(angle) * offset,
  };
};

const showMuzzleEffect = (scene, tower, target, color = 0x3bd3ff) => {
  if (
    !scene?.textures?.exists?.("impact_basic") ||
    !target ||
    !hasTransientEffectBudget(scene)
  ) return;
  const muzzle = getMuzzlePoint(tower, target);
  const flash = scene.add.image(muzzle.x, muzzle.y, "impact_basic");
  flash
    .setDepth(IMPACT_DEPTH - 2)
    .setTint(color)
    .setRotation(muzzle.angle)
    .setScale(0.48)
    .setAlpha(0.9);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 0.9,
    duration: 55,
    onComplete: () => flash.active && flash.destroy(),
  });
};

const showDeathEffect = (scene, enemy) => {
  if (
    !scene?.textures?.exists?.("impact_basic") ||
    !enemy ||
    !hasTransientEffectBudget(scene)
  ) return;
  const burst = scene.add.image(enemy.x, enemy.y, "impact_basic");
  burst.setDepth(IMPACT_DEPTH - 1).setTint(0xff6b74).setScale(0.72).setAlpha(0.85);
  scene.tweens.add({
    targets: burst,
    alpha: 0,
    scale: 1.65,
    duration: 120,
    ease: "Sine.easeOut",
    onComplete: () => burst.active && burst.destroy(),
  });
};

const showDeploymentEffect = (scene, enemy) => {
  if (
    !scene?.textures?.exists?.("impact_basic") ||
    !scene?.add?.image ||
    !scene?.tweens?.add ||
    !enemy ||
    !hasTransientEffectBudget(scene)
  ) return;
  const pulse = scene.add.image(enemy.x, enemy.y, "impact_basic");
  pulse.setDepth(ART_DEPTHS.enemy - 1).setTint(0xff4d6d).setScale(0.55).setAlpha(0.55);
  scene.tweens.add({
    targets: pulse,
    alpha: 0,
    scale: 1.15,
    duration: 110,
    onComplete: () => pulse.active && pulse.destroy(),
  });
};

const showHitEffect = (scene, type, x, y, color) => {
  if (!shouldShowImpactEffect(scene, type)) return;
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
  if (target.setTintFill) target.setTintFill(flashTint);
  else target.setTint(flashTint);
  target.setAlpha(0.55);
  target.flashTween = scene.time.delayedCall(80, () => {
    if (!target.active) return;
    target.setTint(baseTint);
    target.setAlpha(target.presentationAlpha ?? 1);
    target.flashTween = null;
  });
};

const showTowerPulse = (scene, tower, color = 0x39ff8f) => {
  if (!scene?.add?.image || !scene?.tweens?.add || !tower) return;
  const pulse = scene.add.image(tower.x, tower.y, "impact_basic");
  pulse.setDepth(IMPACT_DEPTH - 1).setTint(color).setScale(1.35).setAlpha(0.9);
  scene.tweens.add({
    targets: pulse,
    alpha: 0,
    scale: 2.35,
    duration: 190,
    ease: "Sine.easeOut",
    onComplete: () => {
      if (pulse.active) pulse.destroy();
    },
  });
};

export {
  flashEnemy,
  getMuzzlePoint,
  hasTransientEffectBudget,
  shouldShowImpactEffect,
  showDeathEffect,
  showDeploymentEffect,
  showHitEffect,
  showMuzzleEffect,
  showTowerPulse,
};
