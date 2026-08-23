const IMPACT_DEPTH = 60;

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

export { flashEnemy, showHitEffect, showTowerPulse };
