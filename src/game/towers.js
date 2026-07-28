import { TOWER_DEFS, TARGET_MODES, nextInCycle } from "../constants.js";

function getNextUpgradeCost(t) {
  const def = TOWER_DEFS[t.type];
  if (!def) return null;
  if (t.tier >= def.tiers.length) return null;
  return def.tiers[t.tier]?.cost ?? null;
}

function applyTowerTier(t, tierIdx) {
  const def = TOWER_DEFS[t.type];
  const tier = def.tiers[tierIdx];
  t.tier = tierIdx + 1;
  t.damage = tier.damage;
  t.range = tier.range;
  t.fireMs = tier.fireMs;
  t.nextShotAt = 0;
  t.sprite.setTint(tier.tint);
  t.sprite.setScale(tier.scale ?? 1);
  if (t.badge) t.badge.setDepth(t.sprite.depth + 1);
}

function tryUpgradeTower(t) {
  const nextCost = getNextUpgradeCost(t);
  if (nextCost === null) return;
  if (this.money < nextCost) return;
  this.money -= nextCost;
  t.spent += nextCost;
  applyTowerTier(t, t.tier);
  if (this.selectedTower === t) this.showRangeRing(t, 0x00ffff);
}

function trySellTower(t) {
  if (!t) return;
  const idx = this.towers.indexOf(t);
  if (idx === -1) return;
  const refund = Math.floor((t.spent || 0) * 0.7);
  if (t.badge) t.badge.destroy();
  t.sprite.destroy();
  this.towers.splice(idx, 1);
  this.money += refund;
  if (this.selectedTower === t) this.clearSelection();
}

function cycleTargetMode(t) {
  t.targetMode = nextInCycle(TARGET_MODES, t.targetMode);
}

export { getNextUpgradeCost, applyTowerTier, tryUpgradeTower, trySellTower, cycleTargetMode };
